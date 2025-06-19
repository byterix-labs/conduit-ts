import { describe, test, expect } from "bun:test";
import { StreamReader, Endian } from "../../index";

describe("StreamReader", () => {
  describe("construction", () => {
    test("should create from ReadableStream", () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        },
      });
      const reader = new StreamReader(stream);
      expect(reader).toBeInstanceOf(StreamReader);
      expect(reader.bytesRead).toBe(0);
    });

    test("should create from buffer using static from method", () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5]);
      const reader = StreamReader.from(buffer);
      expect(reader).toBeInstanceOf(StreamReader);
      expect(reader.bytesRead).toBe(0);
    });

    test("should create from ArrayBuffer using static from method", () => {
      const arrayBuffer = new ArrayBuffer(5);
      const view = new Uint8Array(arrayBuffer);
      view.set([1, 2, 3, 4, 5]);
      const reader = StreamReader.from(arrayBuffer);
      expect(reader).toBeInstanceOf(StreamReader);
    });
  });

  describe("basic reading", () => {
    test("should read exact number of bytes", async () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const reader = StreamReader.from(data);

      const result = await reader.read(3);
      expect(result).toEqual(new Uint8Array([1, 2, 3]));
      expect(reader.bytesRead).toBe(3);
    });

    test("should read remaining bytes after partial read", async () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const reader = StreamReader.from(data);

      await reader.read(2);
      const result = await reader.read(3);
      expect(result).toEqual(new Uint8Array([3, 4, 5]));
      expect(reader.bytesRead).toBe(5);
    });

    test("should throw error when reading beyond available data", async () => {
      const data = new Uint8Array([1, 2, 3]);
      const reader = StreamReader.from(data);

      expect(async () => await reader.read(5)).toThrow(
        "Unexpected end of stream",
      );
    });

    test("should handle reading with bigint length", async () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const reader = StreamReader.from(data);

      const result = await reader.read(BigInt(3));
      expect(result).toEqual(new Uint8Array([1, 2, 3]));
      expect(reader.bytesRead).toBe(3);
    });
  });

  describe("string reading", () => {
    test("should read UTF-8 string", async () => {
      const text = "Hello, 世界!";
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const reader = StreamReader.from(data);

      const result = await reader.readString(data.length);
      expect(result).toBe(text);
    });

    test("should read partial string", async () => {
      const text = "Hello World";
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const reader = StreamReader.from(data);

      const result = await reader.readString(5);
      expect(result).toBe("Hello");
    });

    test("should handle empty string", async () => {
      const reader = StreamReader.from(new Uint8Array([]));

      const result = await reader.readString(0);
      expect(result).toBe("");
    });
  });

  describe("8-bit integer reading", () => {
    test("should read uint8", async () => {
      const data = new Uint8Array([0x00, 0x7f, 0xff]);
      const reader = StreamReader.from(data);

      expect(await reader.readUint8()).toBe(0x00);
      expect(await reader.readUint8()).toBe(0x7f);
      expect(await reader.readUint8()).toBe(0xff);
      expect(reader.bytesRead).toBe(3);
    });

    test("should read int8", async () => {
      const data = new Uint8Array([0x00, 0x7f, 0x80, 0xff]);
      const reader = StreamReader.from(data);

      expect(await reader.readInt8()).toBe(0);
      expect(await reader.readInt8()).toBe(127);
      expect(await reader.readInt8()).toBe(-128);
      expect(await reader.readInt8()).toBe(-1);
    });
  });

  describe("16-bit integer reading", () => {
    test("should read uint16 big-endian", async () => {
      const data = new Uint8Array([0x12, 0x34, 0xff, 0xff]);
      const reader = StreamReader.from(data);

      expect(await reader.readUint16(Endian.Big)).toBe(0x1234);
      expect(await reader.readUint16(Endian.Big)).toBe(0xffff);
    });

    test("should read uint16 little-endian", async () => {
      const data = new Uint8Array([0x34, 0x12, 0xff, 0xff]);
      const reader = StreamReader.from(data);

      expect(await reader.readUint16(Endian.Little)).toBe(0x1234);
      expect(await reader.readUint16(Endian.Little)).toBe(0xffff);
    });

    test("should default to big-endian for uint16", async () => {
      const data = new Uint8Array([0x12, 0x34]);
      const reader = StreamReader.from(data);

      expect(await reader.readUint16()).toBe(0x1234);
    });

    test("should read int16 big-endian", async () => {
      const data = new Uint8Array([0x7f, 0xff, 0x80, 0x00]);
      const reader = StreamReader.from(data);

      expect(await reader.readInt16(Endian.Big)).toBe(0x7fff);
      expect(await reader.readInt16(Endian.Big)).toBe(-0x8000);
    });

    test("should read int16 little-endian", async () => {
      const data = new Uint8Array([0xff, 0x7f, 0x00, 0x80]);
      const reader = StreamReader.from(data);

      expect(await reader.readInt16(Endian.Little)).toBe(0x7fff);
      expect(await reader.readInt16(Endian.Little)).toBe(-0x8000);
    });
  });

  describe("32-bit integer reading", () => {
    test("should read uint32 big-endian", async () => {
      const data = new Uint8Array([
        0x12, 0x34, 0x56, 0x78, 0xff, 0xff, 0xff, 0xff,
      ]);
      const reader = StreamReader.from(data);

      expect(await reader.readUint32(Endian.Big)).toBe(0x12345678);
      expect(await reader.readUint32(Endian.Big)).toBe(0xffffffff);
    });

    test("should read uint32 little-endian", async () => {
      const data = new Uint8Array([
        0x78, 0x56, 0x34, 0x12, 0xff, 0xff, 0xff, 0xff,
      ]);
      const reader = StreamReader.from(data);

      expect(await reader.readUint32(Endian.Little)).toBe(0x12345678);
      expect(await reader.readUint32(Endian.Little)).toBe(0xffffffff);
    });

    test("should read int32 big-endian", async () => {
      const data = new Uint8Array([
        0x7f, 0xff, 0xff, 0xff, 0x80, 0x00, 0x00, 0x00,
      ]);
      const reader = StreamReader.from(data);

      expect(await reader.readInt32(Endian.Big)).toBe(0x7fffffff);
      expect(await reader.readInt32(Endian.Big)).toBe(-0x80000000);
    });

    test("should read int32 little-endian", async () => {
      const data = new Uint8Array([
        0xff, 0xff, 0xff, 0x7f, 0x00, 0x00, 0x00, 0x80,
      ]);
      const reader = StreamReader.from(data);

      expect(await reader.readInt32(Endian.Little)).toBe(0x7fffffff);
      expect(await reader.readInt32(Endian.Little)).toBe(-0x80000000);
    });
  });

  describe("64-bit integer reading", () => {
    test("should read uint64 big-endian", async () => {
      const data = new Uint8Array([
        0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
      ]);
      const reader = StreamReader.from(data);

      const result = await reader.readUint64(Endian.Big);
      expect(result).toBe(BigInt("0x123456789ABCDEF0"));
    });

    test("should read uint64 little-endian", async () => {
      const data = new Uint8Array([
        0xf0, 0xde, 0xbc, 0x9a, 0x78, 0x56, 0x34, 0x12,
      ]);
      const reader = StreamReader.from(data);

      const result = await reader.readUint64(Endian.Little);
      expect(result).toBe(BigInt("0x123456789ABCDEF0"));
    });

    test("should read int64 big-endian", async () => {
      const data = new Uint8Array([
        0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
      ]);
      const reader = StreamReader.from(data);

      const result = await reader.readInt64(Endian.Big);
      expect(result).toBe(BigInt("0x7FFFFFFFFFFFFFFF"));
    });

    test("should read int64 little-endian negative", async () => {
      const data = new Uint8Array([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80,
      ]);
      const reader = StreamReader.from(data);

      const result = await reader.readInt64(Endian.Little);
      expect(result).toBe(-BigInt("0x8000000000000000"));
    });
  });

  describe("readUntilEof", () => {
    test("should read all remaining data", async () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const reader = StreamReader.from(data);

      // Read some data first
      await reader.read(2);

      const result = await reader.readUntilEof();
      expect(result).toEqual(new Uint8Array([3, 4, 5]));
    });

    test("should read all data when called initially", async () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const reader = StreamReader.from(data);

      const result = await reader.readUntilEof();
      expect(result).toEqual(data);
    });

    test("should return empty array when at EOF", async () => {
      const data = new Uint8Array([1, 2, 3]);
      const reader = StreamReader.from(data);

      await reader.read(3);
      const result = await reader.readUntilEof();
      expect(result).toEqual(new Uint8Array([]));
    });

    test("should handle chunked stream", async () => {
      const chunks = [
        new Uint8Array([1, 2]),
        new Uint8Array([3, 4]),
        new Uint8Array([5, 6]),
      ];

      let chunkIndex = 0;
      const stream = new ReadableStream({
        pull(controller) {
          if (chunkIndex < chunks.length) {
            controller.enqueue(chunks[chunkIndex++]);
          } else {
            controller.close();
          }
        },
      });

      const reader = new StreamReader(stream);
      const result = await reader.readUntilEof();
      expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));
    });
  });

  describe("DataView creation", () => {
    test("should create DataView from Uint8Array", async () => {
      const data = new Uint8Array([0x12, 0x34]);
      const reader = StreamReader.from(data);

      const buffer = await reader.read(2);
      const dataView = reader.createDataView(buffer);

      expect(dataView).toBeInstanceOf(DataView);
      expect(dataView.getUint16(0, false)).toBe(0x1234);
    });
  });

  describe("error handling", () => {
    test("should throw error when reading beyond stream end", async () => {
      const data = new Uint8Array([1, 2, 3]);
      const reader = StreamReader.from(data);

      expect(async () => await reader.read(5)).toThrow(
        "Unexpected end of stream",
      );
    });

    test("should throw error when reading specific types beyond stream end", async () => {
      const data = new Uint8Array([1]);
      const reader = StreamReader.from(data);

      expect(async () => await reader.readUint16()).toThrow(
        "Unexpected end of stream",
      );
      expect(async () => await reader.readUint32()).toThrow(
        "Unexpected end of stream",
      );
      expect(async () => await reader.readUint64()).toThrow(
        "Unexpected end of stream",
      );
    });

    test("should handle empty stream gracefully for readUntilEof", async () => {
      const reader = StreamReader.from(new Uint8Array([]));

      const result = await reader.readUntilEof();
      expect(result).toEqual(new Uint8Array([]));
    });
  });

  describe("resource management", () => {
    test("should close reader without error", async () => {
      const data = new Uint8Array([1, 2, 3]);
      const reader = StreamReader.from(data);

      await expect(reader.close()).resolves.toBeUndefined();
    });

    test("should track bytes read correctly", async () => {
      const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const reader = StreamReader.from(data);

      expect(reader.bytesRead).toBe(0);

      await reader.readUint8();
      expect(reader.bytesRead).toBe(1);

      await reader.readUint16();
      expect(reader.bytesRead).toBe(3);

      await reader.readUint32();
      expect(reader.bytesRead).toBe(7);

      await reader.readUint8();
      expect(reader.bytesRead).toBe(8);
    });
  });

  describe("mixed operations", () => {
    test("should handle mixed read operations in sequence", async () => {
      // Create a buffer with known data
      const buffer = new ArrayBuffer(20);
      const view = new DataView(buffer);
      let offset = 0;

      // Write test data
      view.setUint8(offset++, 42);
      view.setUint16(offset, 0x1234, false);
      offset += 2;
      view.setUint32(offset, 0x12345678, true);
      offset += 4;
      view.setBigUint64(offset, BigInt("0x123456789ABCDEF0"), false);
      offset += 8;

      const textEncoder = new TextEncoder();
      const textData = textEncoder.encode("Hello");
      new Uint8Array(buffer).set(textData, offset);

      const reader = StreamReader.from(buffer);

      expect(await reader.readUint8()).toBe(42);
      expect(await reader.readUint16(Endian.Big)).toBe(0x1234);
      expect(await reader.readUint32(Endian.Little)).toBe(0x12345678);
      expect(await reader.readUint64(Endian.Big)).toBe(
        BigInt("0x123456789ABCDEF0"),
      );
      expect(await reader.readString(5)).toBe("Hello");

      expect(reader.bytesRead).toBe(20);
    });
  });
});
