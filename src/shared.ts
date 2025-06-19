export enum Endian {
  Little,
  Big,
}

export interface ValueReader {
  readInt8(buf: Uint8Array): number;
  readInt16(buf: Uint8Array, endian: Endian): number;
  readInt32(buf: Uint8Array, endian: Endian): number;
  readInt64(buf: Uint8Array, endian: Endian): bigint;
  readUint8(buf: Uint8Array): number;
  readUint16(buf: Uint8Array, endian: Endian): number;
  readUint32(buf: Uint8Array, endian: Endian): number;
  readUint64(buf: Uint8Array, endian: Endian): bigint;
}
