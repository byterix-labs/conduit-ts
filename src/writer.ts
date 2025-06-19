import { Endian } from "./shared";

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
