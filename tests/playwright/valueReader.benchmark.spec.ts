// tests/valueReader.benchmark.spec.ts
import { test, expect } from "@playwright/test";
import BitOpsValueReader from "../../src/value-readers/BitOpsValueReader";
import DataViewValueReader from "../../src/value-readers/DataViewValueReader";
import PerformanceValueReader from "../../src/value-readers/PerformanceValueReader";
import { Endian } from "../../src/shared";

test("ValueReader performance comparison", async () => {
  const bitReader = new BitOpsValueReader();
  const dvReader = new DataViewValueReader();
  const perfReader = new PerformanceValueReader();

  const ITER8 = 1_000_000;
  const ITER16 = 500_000;
  const ITER32 = 200_000;
  const ITER64 = 20_000;

  // --- Int8 ---
  {
    const nums = new Uint8Array(ITER8);
    for (let i = 0; i < ITER8; i++) nums[i] = i & 0xff;
    const buf = new Uint8Array(1);
    let sum1 = 0,
      sum2 = 0,
      sum3 = 0;

    const t0 = performance.now();
    for (let i = 0; i < ITER8; i++) {
      buf[0] = nums[i];
      sum1 += bitReader.readInt8(buf);
    }
    const t1 = performance.now();
    for (let i = 0; i < ITER8; i++) {
      buf[0] = nums[i];
      sum2 += dvReader.readInt8(buf);
    }
    const t2 = performance.now();
    for (let i = 0; i < ITER8; i++) {
      buf[0] = nums[i];
      sum3 += perfReader.readInt8(buf);
    }
    const t3 = performance.now();

    console.log(
      `Int8  bit-twiddle: ${(t1 - t0).toFixed(2)} ms  |  ` +
        `DataView: ${(t2 - t1).toFixed(2)} ms  |  ` +
        `Performance: ${(t3 - t2).toFixed(2)} ms`,
    );
    expect(sum1).toBe(sum2);
    expect(sum1).toBe(sum3);
  }

  // --- Int16 BE ---
  {
    const nums = new Uint16Array(ITER16);
    for (let i = 0; i < ITER16; i++) nums[i] = i & 0xffff;
    const buf = new Uint8Array(2);
    let sum1 = 0,
      sum2 = 0,
      sum3 = 0;

    const t0 = performance.now();
    for (let i = 0; i < ITER16; i++) {
      const v = nums[i];
      buf[0] = (v >>> 8) & 0xff;
      buf[1] = v & 0xff;
      sum1 += bitReader.readInt16(buf, Endian.Big);
    }
    const t1 = performance.now();
    for (let i = 0; i < ITER16; i++) {
      const v = nums[i];
      buf[0] = (v >>> 8) & 0xff;
      buf[1] = v & 0xff;
      sum2 += dvReader.readInt16(buf, Endian.Big);
    }
    const t2 = performance.now();
    for (let i = 0; i < ITER16; i++) {
      const v = nums[i];
      buf[0] = (v >>> 8) & 0xff;
      buf[1] = v & 0xff;
      sum3 += perfReader.readInt16(buf, Endian.Big);
    }
    const t3 = performance.now();

    console.log(
      `Int16 BE  bit-twiddle: ${(t1 - t0).toFixed(2)} ms  |  ` +
        `DataView: ${(t2 - t1).toFixed(2)} ms  |  ` +
        `Performance: ${(t3 - t2).toFixed(2)} ms`,
    );
    expect(sum1).toBe(sum2);
    expect(sum1).toBe(sum3);
  }

  // --- Int32 BE ---
  {
    const nums = new Uint32Array(ITER32);
    for (let i = 0; i < ITER32; i++) nums[i] = i >>> 0;
    const buf = new Uint8Array(4);
    let sum1 = 0,
      sum2 = 0,
      sum3 = 0;

    const t0 = performance.now();
    for (let i = 0; i < ITER32; i++) {
      const v = nums[i];
      buf[0] = (v >>> 24) & 0xff;
      buf[1] = (v >>> 16) & 0xff;
      buf[2] = (v >>> 8) & 0xff;
      buf[3] = v & 0xff;
      sum1 += bitReader.readInt32(buf, Endian.Big);
    }
    const t1 = performance.now();
    for (let i = 0; i < ITER32; i++) {
      const v = nums[i];
      buf[0] = (v >>> 24) & 0xff;
      buf[1] = (v >>> 16) & 0xff;
      buf[2] = (v >>> 8) & 0xff;
      buf[3] = v & 0xff;
      sum2 += dvReader.readInt32(buf, Endian.Big);
    }
    const t2 = performance.now();
    for (let i = 0; i < ITER32; i++) {
      const v = nums[i];
      buf[0] = (v >>> 24) & 0xff;
      buf[1] = (v >>> 16) & 0xff;
      buf[2] = (v >>> 8) & 0xff;
      buf[3] = v & 0xff;
      sum3 += perfReader.readInt32(buf, Endian.Big);
    }
    const t3 = performance.now();

    console.log(
      `Int32 BE  bit-twiddle: ${(t1 - t0).toFixed(2)} ms  |  ` +
        `DataView: ${(t2 - t1).toFixed(2)} ms  |  ` +
        `Performance: ${(t3 - t2).toFixed(2)} ms`,
    );
    expect(sum1).toBe(sum2);
    expect(sum1).toBe(sum3);
  }

  // --- Uint64 & Int64 BE ---
  {
    // Pre-generate 8-byte buffers
    const buffers: Uint8Array[] = new Array(ITER64);
    for (let i = 0; i < ITER64; i++) {
      // make a 64-bit two-part value
      const v = (BigInt(i) << 32n) | BigInt(i);
      const buf = new Uint8Array(8);
      for (let b = 0; b < 8; b++) {
        buf[b] = Number((v >> BigInt((7 - b) * 8)) & 0xffn);
      }
      buffers[i] = buf;
    }

    let sumU1 = 0n,
      sumU2 = 0n,
      sumU3 = 0n;
    let sumI1 = 0n,
      sumI2 = 0n,
      sumI3 = 0n;

    // Unsigned 64
    let t0 = performance.now();
    for (let i = 0; i < ITER64; i++) {
      sumU1 += bitReader.readUint64(buffers[i], Endian.Big);
    }
    let t1 = performance.now();
    for (let i = 0; i < ITER64; i++) {
      sumU2 += dvReader.readUint64(buffers[i], Endian.Big);
    }
    let t2 = performance.now();
    for (let i = 0; i < ITER64; i++) {
      sumU3 += perfReader.readUint64(buffers[i], Endian.Big);
    }
    let t3 = performance.now();

    // Signed 64
    for (let i = 0; i < ITER64; i++) {
      sumI1 += bitReader.readInt64(buffers[i], Endian.Big);
    }
    let t4 = performance.now();
    for (let i = 0; i < ITER64; i++) {
      sumI2 += dvReader.readInt64(buffers[i], Endian.Big);
    }
    let t5 = performance.now();
    for (let i = 0; i < ITER64; i++) {
      sumI3 += perfReader.readInt64(buffers[i], Endian.Big);
    }
    let t6 = performance.now();

    console.log(
      `Uint64 BE bit-twiddle: ${(t1 - t0).toFixed(2)} ms  |  ` +
        `DataView: ${(t2 - t1).toFixed(2)} ms  |  ` +
        `Performance: ${(t3 - t2).toFixed(2)} ms`,
    );
    console.log(
      `Int64  BE bit-twiddle: ${(t4 - t3).toFixed(2)} ms  |  ` +
        `DataView: ${(t5 - t4).toFixed(2)} ms  |  ` +
        `Performance: ${(t6 - t5).toFixed(2)} ms`,
    );

    expect(sumU1).toBe(sumU2);
    expect(sumU1).toBe(sumU3);
    expect(sumI1).toBe(sumI2);
    expect(sumI1).toBe(sumI3);
  }
});
