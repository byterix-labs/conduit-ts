import { uint8ArrayFromBufferSource } from "./buffer";

export enum Endian {
  Little,
  Big,
}

export class StreamReader {
  bytesRead: number = 0;

  private readonly reader: ReadableStreamDefaultReader<Uint8Array>;
  private buffer: Uint8Array = new Uint8Array(0); // Internal buffer
  private bufferOffset: number = 0; // Offset within the buffer

  constructor(public stream: ReadableStream<Uint8Array>) {
    this.reader = stream.getReader();
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

  async read(len: number | bigint): Promise<Uint8Array> {
    const offset = Number(len);
    await this.ensureBufferFilledToAtLeast(offset);

    const value = this.buffer.slice(
      this.bufferOffset,
      this.bufferOffset + offset,
    );

    this.bufferOffset += offset;
    this.bytesRead += offset;

    return value;
  }

  async readString(len: number | bigint): Promise<string> {
    const data = await this.read(Number(len));
    const textDecoder = new TextDecoder();
    return textDecoder.decode(data);
  }

  async readUint8(): Promise<number> {
    const buffer = await this.read(1);
    return buffer[0];
  }

  createDataView(data: Uint8Array): DataView {
    return new DataView(data.buffer);
  }

  async readInt8(): Promise<number> {
    const buffer = await this.read(1);
    const dataView = this.createDataView(buffer);
    return dataView.getInt8(0);
  }

  async readUint16(endian: Endian = Endian.Big): Promise<number> {
    const buffer = await this.read(2);
    const dataView = this.createDataView(buffer);
    return dataView.getUint16(0, endian === Endian.Little);
  }

  async readInt16(endian: Endian = Endian.Big): Promise<number> {
    const buffer = await this.read(2);
    const dataView = this.createDataView(buffer);
    return dataView.getInt16(0, endian === Endian.Little);
  }

  async readUint32(endian: Endian = Endian.Big): Promise<number> {
    const buffer = await this.read(4);
    const dataView = this.createDataView(buffer);
    return dataView.getUint32(0, endian === Endian.Little);
  }

  async readInt32(endian: Endian = Endian.Big): Promise<number> {
    const buffer = await this.read(4);
    const dataView = this.createDataView(buffer);
    return dataView.getInt32(0, endian === Endian.Little);
  }

  async readUint64(endian: Endian = Endian.Big): Promise<bigint> {
    const buffer = await this.read(8);
    const dataView = this.createDataView(buffer);
    return dataView.getBigUint64(0, endian === Endian.Little);
  }

  async readInt64(endian: Endian = Endian.Big): Promise<bigint> {
    const buffer = await this.read(8);
    const dataView = this.createDataView(buffer);
    return dataView.getBigInt64(0, endian === Endian.Little);
  }

  async readUntilEof(): Promise<Uint8Array<ArrayBufferLike>> {
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

  // Optional: Implement seek if needed (complex with streams)
  // async seek(offset: number, whence: SeekOrigin): Promise<number> { ... }

  async close(): Promise<void> {
    this.reader.releaseLock();
  }
}

export class StreamWriter {
  private textEncoder?: TextEncoder;
  private writer: WritableStreamDefaultWriter;
  private buffer: Uint8Array = new Uint8Array(8);

  constructor(public stream: WritableStream) {
    this.writer = stream.getWriter();
  }

  async write(buffer: BufferSource): Promise<number> {
    await this.writer.write(buffer);

    return buffer.byteLength;
  }

  async writeString(value: string) {
    const encoder = (this.textEncoder ??= new TextEncoder());
    const buffer = encoder.encode(value);
    return this.write(buffer);
  }

  async writeUint8(value: number) {
    this.buffer.set([value], 0);
    return this.write(this.buffer.slice(0, 1));
  }

  async writeInt8(value: number) {
    const dataView = new DataView(this.buffer.buffer);
    dataView.setInt8(0, value);
    return this.write(this.buffer.slice(0, 1));
  }

  async writeUint16(value: number, endian: Endian = Endian.Big) {
    const dataView = new DataView(this.buffer.buffer);
    dataView.setUint16(0, value, endian === Endian.Little);
    return this.write(this.buffer.slice(0, 2));
  }

  async writeInt16(value: number, endian: Endian = Endian.Big) {
    const dataView = new DataView(this.buffer.buffer);
    dataView.setInt16(0, value, endian === Endian.Little);
    return this.write(this.buffer.slice(0, 2));
  }

  async writeUint32(value: number, endian: Endian = Endian.Big) {
    const dataView = new DataView(this.buffer.buffer);
    dataView.setUint32(0, value, endian === Endian.Little);
    return this.write(this.buffer.slice(0, 4));
  }

  async writeInt32(value: number, endian: Endian = Endian.Big) {
    const dataView = new DataView(this.buffer.buffer);
    dataView.setInt32(0, value, endian === Endian.Little);
    return this.write(this.buffer.slice(0, 4));
  }

  async writeUint64(value: bigint, endian: Endian = Endian.Big) {
    const dataView = new DataView(this.buffer.buffer);
    dataView.setBigUint64(0, value, endian === Endian.Little);
    return this.write(this.buffer.slice(0, 8));
  }

  async writeInt64(value: bigint, endian: Endian = Endian.Big) {
    const dataView = new DataView(this.buffer.buffer);
    dataView.setBigInt64(0, value, endian === Endian.Little);
    return this.write(this.buffer.slice(0, 8));
  }

  async close(): Promise<void> {
    return await this.writer.close();
  }
}
