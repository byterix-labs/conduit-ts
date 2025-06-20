import type { Endian, ValueReader } from "../shared";
import BitOpsValueReader from "./BitOpsValueReader";
import DataViewValueReader from "./DataViewValueReader";

/**
 * PerformanceValueReader uses BitOpsValueReader for 8-16 reading,
 * and DataViewValueReader for 32-64bit reading.
 *
 * This provides the best performance.
 */
export default class PerformanceValueReader implements ValueReader {
  private readonly br = new BitOpsValueReader();
  private readonly dv = new DataViewValueReader();

  readInt8(buf: Uint8Array): number {
    return this.br.readInt8(buf);
  }

  readInt16(buf: Uint8Array, endian: Endian): number {
    return this.br.readInt16(buf, endian);
  }

  readInt32(buf: Uint8Array, endian: Endian): number {
    return this.dv.readInt32(buf, endian);
  }

  readInt64(buf: Uint8Array, endian: Endian): bigint {
    return this.dv.readInt64(buf, endian);
  }

  readUint8(buf: Uint8Array): number {
    return this.br.readUint8(buf);
  }

  readUint16(buf: Uint8Array, endian: Endian): number {
    return this.br.readUint16(buf, endian);
  }

  readUint32(buf: Uint8Array, endian: Endian): number {
    return this.dv.readUint32(buf, endian);
  }

  readUint64(buf: Uint8Array, endian: Endian): bigint {
    return this.dv.readUint64(buf, endian);
  }
}
