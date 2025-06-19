import type { ValueReader } from "../shared";
import { Endian } from "../shared";

export default class DataViewValueReader implements ValueReader {
  private scratchBuf = new ArrayBuffer(8);
  private scratchDataView = new DataView(this.scratchBuf);

  private loadBuffer(buf: Uint8Array): void {
    new Uint8Array(this.scratchBuf).set(buf);
  }

  readUint8(buf: Uint8Array): number {
    this.loadBuffer(buf);
    return this.scratchDataView.getUint8(0);
  }

  readInt8(buf: Uint8Array): number {
    this.loadBuffer(buf);
    return this.scratchDataView.getInt8(0);
  }

  readUint16(buf: Uint8Array, endian: Endian): number {
    this.loadBuffer(buf);
    return this.scratchDataView.getUint16(0, endian === Endian.Little);
  }

  readInt16(buf: Uint8Array, endian: Endian): number {
    this.loadBuffer(buf);
    return this.scratchDataView.getInt16(0, endian === Endian.Little);
  }

  readUint32(buf: Uint8Array, endian: Endian): number {
    this.loadBuffer(buf);
    return this.scratchDataView.getUint32(0, endian === Endian.Little);
  }

  readInt32(buf: Uint8Array, endian: Endian): number {
    this.loadBuffer(buf);
    return this.scratchDataView.getInt32(0, endian === Endian.Little);
  }

  readUint64(buf: Uint8Array, endian: Endian): bigint {
    this.loadBuffer(buf);
    return this.scratchDataView.getBigUint64(0, endian === Endian.Little);
  }

  readInt64(buf: Uint8Array, endian: Endian): bigint {
    this.loadBuffer(buf);
    return this.scratchDataView.getBigInt64(0, endian === Endian.Little);
  }
}
