import type { ValueReader } from "../shared";
import { Endian } from "../shared";

export default class BitOpsValueReader implements ValueReader {
  bufferToUnsignedNumber(buffer: Uint8Array, endian: Endian): number {
    let result = 0;

    if (endian === Endian.Little) {
      for (let i = 0; i < buffer.length; i++) {
        result |= buffer[i] << (i * 8);
      }
    } else {
      for (let i = 0; i < buffer.length; i++) {
        result = (result << 8) | buffer[i];
      }
    }

    return result >>> 0;
  }

  toSignedNumber(u: number, bits: number): number {
    if (u < 0) {
      throw new RangeError("Value must be positive");
    }

    const mask = (1 << bits) - 1;
    const shift = 32 - bits;
    // mask off low N bits, shift left to sign‐bit, then arithmetic-shift back
    return ((u & mask) << shift) >> shift;
  }

  bufferToUnsignedBigInt(buffer: Uint8Array, endian: Endian): bigint {
    const CHUNK_SIZE = 0x4;
    let result = 0n;

    if (endian === Endian.Big) {
      for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
        const slice = buffer.slice(i, i + CHUNK_SIZE);
        const part = this.bufferToUnsignedNumber(slice, endian);
        result = (result << BigInt(slice.length * 8)) | BigInt(part);
      }
    } else {
      let shift = 0n;
      for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
        const slice = buffer.slice(i, i + CHUNK_SIZE);
        const part = this.bufferToUnsignedNumber(slice, endian);
        result |= BigInt(part) << shift;
        shift += BigInt(slice.length * 8);
      }
    }

    return result;
  }

  readUint8(buf: Uint8Array): number {
    return buf[0];
  }

  readUint16(buf: Uint8Array, endian: Endian): number {
    return this.bufferToUnsignedNumber(buf, endian);
  }

  readUint32(buf: Uint8Array, endian: Endian): number {
    return this.bufferToUnsignedNumber(buf, endian);
  }

  readUint64(buf: Uint8Array, endian: Endian): bigint {
    return this.bufferToUnsignedBigInt(buf, endian);
  }

  readInt8(buf: Uint8Array): number {
    return this.toSignedNumber(buf[0], 8);
  }

  readInt16(buf: Uint8Array, endian: Endian): number {
    return this.toSignedNumber(this.bufferToUnsignedNumber(buf, endian), 16);
  }

  readInt32(buf: Uint8Array, endian: Endian): number {
    return this.readUint32(buf, endian) | 0;
  }

  readInt64(buf: Uint8Array, endian: Endian): bigint {
    const u = this.bufferToUnsignedBigInt(buf, endian);
    const sign = 1n << 63n;
    const mask = (1n << 64n) - 1n;
    const ui = u & mask;
    return (ui & sign) !== 0n ? ui - (1n << 64n) : ui;
  }
}
