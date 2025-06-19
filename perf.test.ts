// perf.test.ts
import { performance } from "perf_hooks";

const ITER8 = 10_000_000;
const ITER16 = 5_000_000;
const ITER32 = 2_000_000;
const ITER64 = 200_000;

// —————————————————————————————————————————————
// Helpers
// —————————————————————————————————————————————

// Int8
function toInt8Bit(u: number): number {
  return (u << 24) >> 24;
}
const dv8buf = new Uint8Array(1);
const dv8 = new DataView(dv8buf.buffer);
function toInt8DV(u: number): number {
  dv8buf[0] = u & 0xff;
  return dv8.getInt8(0);
}

// Int16 BE
function toInt16BitBE(u: number): number {
  return ((u & 0xffff) << 16) >> 16;
}
const dv16buf = new Uint8Array(2);
const dv16 = new DataView(dv16buf.buffer);
function toInt16DV_BE(u: number): number {
  dv16.setUint16(0, u & 0xffff, false);
  return dv16.getInt16(0, false);
}

// Int32 BE
function toInt32BitBE(u: number): number {
  return u | 0;
}
const dv32buf = new Uint8Array(4);
const dv32 = new DataView(dv32buf.buffer);
function toInt32DV_BE(u: number): number {
  dv32.setUint32(0, u >>> 0, false);
  return dv32.getInt32(0, false);
}

// Uint64 BE → BigInt
function toUint64BitBE(buf: Uint8Array): bigint {
  const hi = ((buf[0] << 24) | (buf[1] << 16) | (buf[2] << 8) | buf[3]) >>> 0;
  const lo = ((buf[4] << 24) | (buf[5] << 16) | (buf[6] << 8) | buf[7]) >>> 0;
  return (BigInt(hi) << 32n) | BigInt(lo);
}
const dv64buf = new Uint8Array(8);
const dv64 = new DataView(dv64buf.buffer);
function toUint64DV_BE(buf: Uint8Array): bigint {
  dv64buf.set(buf);
  return dv64.getBigUint64(0, false);
}

// Int64 BE → BigInt (two's‐complement)
function toInt64BitBE(buf: Uint8Array): bigint {
  const u = toUint64BitBE(buf);
  const sign = 1n << 63n;
  const mask = (1n << 64n) - 1n;
  const ui = u & mask;
  return (ui & sign) !== 0n ? ui - (1n << 64n) : ui;
}
function toInt64DV_BE(buf: Uint8Array): bigint {
  dv64buf.set(buf);
  return dv64.getBigInt64(0, false);
}

// —————————————————————————————————————————————
// Build test data
// —————————————————————————————————————————————

const data8 = new Uint8Array(ITER8).map((_, i) => i & 0xff);

const data16 = new Uint8Array(ITER16 * 2);
for (let i = 0; i < ITER16; i++) {
  const v = i & 0xffff;
  data16[2 * i] = (v >>> 8) & 0xff;
  data16[2 * i + 1] = v & 0xff;
}

const data32 = new Uint8Array(ITER32 * 4);
for (let i = 0; i < ITER32; i++) {
  const v = i >>> 0;
  data32[4 * i] = (v >>> 24) & 0xff;
  data32[4 * i + 1] = (v >>> 16) & 0xff;
  data32[4 * i + 2] = (v >>> 8) & 0xff;
  data32[4 * i + 3] = v & 0xff;
}

const data64 = new Uint8Array(ITER64 * 8);
for (let i = 0; i < ITER64; i++) {
  // build a 64-bit value (small high word)
  const v = (BigInt(i) << 32n) | BigInt(i);
  for (let b = 0; b < 8; b++) {
    data64[8 * i + b] = Number((v >> BigInt((7 - b) * 8)) & 0xffn);
  }
}

// —————————————————————————————————————————————
// Measurement Runners
// —————————————————————————————————————————————

function measureNumber(
  label: string,
  fn: (x: number) => number,
  data: Uint8Array,
  iter: number,
) {
  const t0 = performance.now();
  let sum = 0;
  for (let i = 0; i < iter; i++) {
    sum += fn(data[i % data.length]);
  }
  const t1 = performance.now();
  console.log(`${label.padEnd(30)} : ${(t1 - t0).toFixed(2)} ms (sum=${sum})`);
}

function measureBigInt(
  label: string,
  fn: (buf: Uint8Array) => bigint,
  data: Uint8Array,
  iter: number,
) {
  const t0 = Bun.nanoseconds();
  let sum = 0n;
  const stride = 8;
  const blocks = data.length / stride;
  for (let i = 0; i < iter; i++) {
    const off = (i % blocks) * stride;
    sum += fn(data.subarray(off, off + stride));
  }
  const t1 = Bun.nanoseconds();
  console.log(
    `${label.padEnd(30)} : ${((t1 - t0) / 1e6).toFixed(2)} ms (sum=${sum})`,
  );
}

// —————————————————————————————————————————————
// Run!
console.log(`ITER8  = ${ITER8}`);
console.log(`ITER16 = ${ITER16}`);
console.log(`ITER32 = ${ITER32}`);
console.log(`ITER64 = ${ITER64}`);
console.log("");

measureNumber("Int8 bit-twiddle", toInt8Bit, data8, ITER8);
measureNumber("Int8 DataView", toInt8DV, data8, ITER8);
console.log("");

measureNumber("Int16 BE bit-twiddle", toInt16BitBE, data16, ITER16);
measureNumber("Int16 BE DataView", toInt16DV_BE, data16, ITER16);
console.log("");

measureNumber("Int32 BE bit-twiddle", toInt32BitBE, data32, ITER32);
measureNumber("Int32 BE DataView", toInt32DV_BE, data32, ITER32);
console.log("");

measureBigInt("Uint64 BE bit-twiddle", toUint64BitBE, data64, ITER64);
measureBigInt("Uint64 BE DataView", toUint64DV_BE, data64, ITER64);
console.log("");

measureBigInt("Int64  BE bit-twiddle", toInt64BitBE, data64, ITER64);
measureBigInt("Int64  BE DataView", toInt64DV_BE, data64, ITER64);
