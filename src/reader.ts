import { uint8ArrayFromBufferSource } from "./buffer";
import { Endian, type ValueReader } from "./shared";
import DefaultValueReader from "./value-readers/DefaultValueReader";

export class StreamReader {
  private readonly reader: ReadableStreamDefaultReader<Uint8Array>;
  private buffer: Uint8Array = new Uint8Array(0); // Internal buffer
  private bufferOffset: number = 0; // Offset within the buffer
  private valueReader: ValueReader;

  public bytesRead: number = 0;

  constructor(
    public stream: ReadableStream<Uint8Array>,
    valueReader = new DefaultValueReader(),
  ) {
    this.reader = stream.getReader();
    this.valueReader = valueReader;
  }

  static from(bufferSource: BufferSource) {
    return new StreamReader(
      new ReadableStream({
        start(controller) {
          controller.enqueue(uint8ArrayFromBufferSource(bufferSource));
          controller.close();
        },
      }),
    );
  }

  private async ensureBufferFilledToAtLeast(
    count: number | bigint,
  ): Promise<void> {
    const countNum = Number(count);
    while (this.buffer.length - this.bufferOffset < countNum) {
      const { done, value } = await this.reader.read();
      if (done) {
        throw new Error("Unexpected end of stream");
      }

      // Append the new chunk to the buffer
      const newBuffer = new Uint8Array(this.buffer.length + value.length);
      newBuffer.set(this.buffer, 0);
      newBuffer.set(value, this.buffer.length);
      this.buffer = newBuffer;
    }
  }

  private trimBuffer() {
    // once we've consumed half the buffer, drop the used part
    if (this.bufferOffset > this.buffer.byteLength >>> 1) {
      this.buffer = this.buffer.slice(this.bufferOffset);
      this.bufferOffset = 0;
    }
  }

  async read(len: number | bigint): Promise<Uint8Array> {
    const offset = Number(len);
    await this.ensureBufferFilledToAtLeast(offset);

    const value = this.buffer.slice(
      this.bufferOffset,
      this.bufferOffset + offset,
    );

    this.bufferOffset += offset;
    this.bytesRead += offset;

    this.trimBuffer();

    return value;
  }

  async readString(len: number | bigint): Promise<string> {
    const data = await this.read(Number(len));
    const textDecoder = new TextDecoder();
    return textDecoder.decode(data);
  }

  async readUint8(): Promise<number> {
    const buffer = await this.read(1);
    return this.valueReader.readUint8(buffer);
  }

  createDataView(data: Uint8Array): DataView {
    return new DataView(data.buffer);
  }

  async readInt8(): Promise<number> {
    const buffer = await this.read(1);
    return this.valueReader.readInt8(buffer);
  }

  async readUint16(endian: Endian = Endian.Big): Promise<number> {
    const buffer = await this.read(2);
    return this.valueReader.readUint16(buffer, endian);
  }

  async readInt16(endian: Endian = Endian.Big): Promise<number> {
    const buffer = await this.read(2);
    return this.valueReader.readInt16(buffer, endian);
  }

  async readUint32(endian: Endian = Endian.Big): Promise<number> {
    const buffer = await this.read(4);
    return this.valueReader.readUint32(buffer, endian);
  }

  async readInt32(endian: Endian = Endian.Big): Promise<number> {
    const buffer = await this.read(4);
    return this.valueReader.readInt32(buffer, endian);
  }

  async readUint64(endian: Endian = Endian.Big): Promise<bigint> {
    const buffer = await this.read(8);
    return this.valueReader.readUint64(buffer, endian);
  }

  async readInt64(endian: Endian = Endian.Big): Promise<bigint> {
    const buffer = await this.read(8);
    return this.valueReader.readInt64(buffer, endian);
  }

  async readUntilEof(): Promise<Uint8Array> {
    const chunks: Uint8Array[] = [this.buffer.slice(this.bufferOffset)];

    let done = false;
    while (!done) {
      const result = await this.reader.read();

      if (result.value != null) {
        chunks.push(result.value);
      }

      done = result.done;
    }

    const length = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const buffer = new Uint8Array(length);
    let offset = 0;

    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Update bytesRead to reflect the total bytes consumed
    this.bytesRead += length;
    this.bufferOffset = this.buffer.length;

    return buffer;
  }

  async close(): Promise<void> {
    this.reader.releaseLock();
  }
}
