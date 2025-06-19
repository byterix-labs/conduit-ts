import { describe, test, expect } from "bun:test";
import { StreamWriter, Endian } from "../../index";

describe("StreamWriter", () => {
  describe("construction", () => {
    test("should create with WritableStream", () => {
      const stream = new WritableStream();
      const writer = new StreamWriter(stream);
      expect(writer).toBeInstanceOf(StreamWriter);
    });
  });

  describe("basic writing", () => {
    test("should write raw bytes", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);
      const data = new Uint8Array([1, 2, 3, 4, 5]);

      const bytesWritten = await writer.write(data);
      expect(bytesWritten).toBe(5);
      expect(chunks[0]).toEqual(data);
    });

    test("should write ArrayBuffer", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);
      const buffer = new ArrayBuffer(3);
      const view = new Uint8Array(buffer);
      view.set([1, 2, 3]);

      const bytesWritten = await writer.write(buffer);
      expect(bytesWritten).toBe(3);
      expect(chunks[0]).toEqual(new Uint8Array([1, 2, 3]));
    });

    test("should write empty buffer", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);
      const data = new Uint8Array([]);

      const bytesWritten = await writer.write(data);
      expect(bytesWritten).toBe(0);
    });
  });

  describe("string writing", () => {
    test("should write UTF-8 string", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);
      const text = "Hello, World!";

      const bytesWritten = await writer.writeString(text);
      const expectedBytes = new TextEncoder().encode(text);

      expect(bytesWritten).toBe(expectedBytes.length);
      expect(chunks[0]).toEqual(expectedBytes);
    });

    test("should write unicode string", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);
      const text = "Hello, 世界! 🌍";

      const bytesWritten = await writer.writeString(text);
      const expectedBytes = new TextEncoder().encode(text);

      expect(bytesWritten).toBe(expectedBytes.length);
      expect(chunks[0]).toEqual(expectedBytes);
    });

    test("should write empty string", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);

      const bytesWritten = await writer.writeString("");
      expect(bytesWritten).toBe(0);
    });

    test("should reuse TextEncoder instance", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);

      await writer.writeString("First");
      await writer.writeString("Second");

      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toEqual(new TextEncoder().encode("First"));
      expect(chunks[1]).toEqual(new TextEncoder().encode("Second"));
    });
  });

  describe("8-bit integer writing", () => {
    test("should write uint8 values", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);

      await writer.writeUint8(0x00);
      await writer.writeUint8(0x7f);
      await writer.writeUint8(0xff);

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toEqual(new Uint8Array([0x00]));
      expect(chunks[1]).toEqual(new Uint8Array([0x7f]));
      expect(chunks[2]).toEqual(new Uint8Array([0xff]));
    });

    test("should write int8 values", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);

      await writer.writeInt8(0x00);
      await writer.writeInt8(0x7f);
      await writer.writeInt8(-0x80);
      await writer.writeInt8(-0x01);

      expect(chunks).toHaveLength(4);
      expect(chunks[0]).toEqual(new Uint8Array([0x00]));
      expect(chunks[1]).toEqual(new Uint8Array([0x7f]));
      expect(chunks[2]).toEqual(new Uint8Array([0x80]));
      expect(chunks[3]).toEqual(new Uint8Array([0xff]));
    });
  });

  describe("16-bit integer writing", () => {
    test("should write uint16 big-endian", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);

      await writer.writeUint16(0x1234, Endian.Big);
      await writer.writeUint16(0xffff, Endian.Big);

      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toEqual(new Uint8Array([0x12, 0x34]));
      expect(chunks[1]).toEqual(new Uint8Array([0xff, 0xff]));
    });

    test("should write uint16 little-endian", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);

      await writer.writeUint16(0x1234, Endian.Little);
      await writer.writeUint16(0xffff, Endian.Little);

      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toEqual(new Uint8Array([0x34, 0x12]));
      expect(chunks[1]).toEqual(new Uint8Array([0xff, 0xff]));
    });

    test("should default to big-endian for uint16", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);

      await writer.writeUint16(0x1234);

      expect(chunks[0]).toEqual(new Uint8Array([0x12, 0x34]));
    });

    test("should write int16 big-endian", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);

      await writer.writeInt16(0x7fff, Endian.Big);
      await writer.writeInt16(-0x8000, Endian.Big);
      await writer.writeInt16(-0x01, Endian.Big);

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toEqual(new Uint8Array([0x7f, 0xff]));
      expect(chunks[1]).toEqual(new Uint8Array([0x80, 0x00]));
      expect(chunks[2]).toEqual(new Uint8Array([0xff, 0xff]));
    });

    test("should write int16 little-endian", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);

      await writer.writeInt16(0x7fff, Endian.Little);
      await writer.writeInt16(-0x8000, Endian.Little);

      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toEqual(new Uint8Array([0xff, 0x7f]));
      expect(chunks[1]).toEqual(new Uint8Array([0x00, 0x80]));
    });
  });

  describe("32-bit integer writing", () => {
    test("should write uint32 big-endian", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);

      await writer.writeUint32(0x12345678, Endian.Big);
      await writer.writeUint32(0xffffffff, Endian.Big);

      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toEqual(new Uint8Array([0x12, 0x34, 0x56, 0x78]));
      expect(chunks[1]).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0xff]));
    });

    test("should write uint32 little-endian", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);

      await writer.writeUint32(0x12345678, Endian.Little);
      await writer.writeUint32(0xffffffff, Endian.Little);

      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toEqual(new Uint8Array([0x78, 0x56, 0x34, 0x12]));
      expect(chunks[1]).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0xff]));
    });

    test("should write int32 big-endian", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);

      await writer.writeInt32(0x7fffffff, Endian.Big);
      await writer.writeInt32(-0x80000000, Endian.Big);
      await writer.writeInt32(-0x01, Endian.Big);

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toEqual(new Uint8Array([0x7f, 0xff, 0xff, 0xff]));
      expect(chunks[1]).toEqual(new Uint8Array([0x80, 0x00, 0x00, 0x00]));
      expect(chunks[2]).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0xff]));
    });

    test("should write int32 little-endian", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);

      await writer.writeInt32(0x7fffffff, Endian.Little);
      await writer.writeInt32(-0x80000000, Endian.Little);

      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0x7f]));
      expect(chunks[1]).toEqual(new Uint8Array([0x00, 0x00, 0x00, 0x80]));
    });
  });

  describe("64-bit integer writing", () => {
    test("should write uint64 big-endian", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);

      await writer.writeUint64(BigInt("0x123456789ABCDEF0"), Endian.Big);
      await writer.writeUint64(BigInt("0xFFFFFFFFFFFFFFFF"), Endian.Big);

      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toEqual(
        new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0]),
      );
      expect(chunks[1]).toEqual(
        new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
      );
    });

    test("should write uint64 little-endian", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);

      await writer.writeUint64(BigInt("0x123456789ABCDEF0"), Endian.Little);
      await writer.writeUint64(BigInt("0xFFFFFFFFFFFFFFFF"), Endian.Little);

      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toEqual(
        new Uint8Array([0xf0, 0xde, 0xbc, 0x9a, 0x78, 0x56, 0x34, 0x12]),
      );
      expect(chunks[1]).toEqual(
        new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
      );
    });

    test("should write int64 big-endian", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);

      await writer.writeInt64(BigInt("0x7FFFFFFFFFFFFFFF"), Endian.Big);
      await writer.writeInt64(-BigInt("0x8000000000000000"), Endian.Big);
      await writer.writeInt64(-BigInt("0x01"), Endian.Big);

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toEqual(
        new Uint8Array([0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
      );
      expect(chunks[1]).toEqual(
        new Uint8Array([0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
      );
      expect(chunks[2]).toEqual(
        new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
      );
    });

    test("should write int64 little-endian", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);

      await writer.writeInt64(BigInt("0x7FFFFFFFFFFFFFFF"), Endian.Little);
      await writer.writeInt64(-BigInt("0x8000000000000000"), Endian.Little);

      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toEqual(
        new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x7f]),
      );
      expect(chunks[1]).toEqual(
        new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80]),
      );
    });

    test("should handle zero values", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);

      await writer.writeUint64(BigInt("0"), Endian.Big);
      await writer.writeInt64(BigInt("0"), Endian.Little);

      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toEqual(
        new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
      );
      expect(chunks[1]).toEqual(
        new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
      );
    });
  });

  describe("resource management", () => {
    test("should close writer without error", async () => {
      const stream = new WritableStream();
      const writer = new StreamWriter(stream);

      expect(writer.close()).resolves.toBe(undefined);
    });
  });

  describe("buffer reuse", () => {
    test("should reuse internal buffer for multiple writes", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);

      // Write multiple values that use the same internal buffer
      await writer.writeUint8(1);
      await writer.writeUint16(0x1234);
      await writer.writeUint32(0x12345678);
      await writer.writeUint64(BigInt("0x123456789ABCDEF0"));

      expect(chunks).toHaveLength(4);
      expect(chunks[0]).toEqual(new Uint8Array([1]));
      expect(chunks[1]).toEqual(new Uint8Array([0x12, 0x34]));
      expect(chunks[2]).toEqual(new Uint8Array([0x12, 0x34, 0x56, 0x78]));
      expect(chunks[3]).toEqual(
        new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0]),
      );
    });
  });

  describe("mixed operations", () => {
    test("should handle mixed write operations in sequence", async () => {
      const chunks: Uint8Array[] = [];
      const stream = new WritableStream({
        write(chunk) {
          chunks.push(new Uint8Array(chunk));
        },
      });

      const writer = new StreamWriter(stream);

      await writer.writeString("Hello");
      await writer.writeUint8(42);
      await writer.writeUint16(0x1234, Endian.Big);
      await writer.writeUint32(0x12345678, Endian.Little);
      await writer.writeUint64(BigInt("0x123456789ABCDEF0"), Endian.Big);
      await writer.write(new Uint8Array([0xaa, 0xbb]));

      expect(chunks).toHaveLength(6);
      expect(chunks[0]).toEqual(new TextEncoder().encode("Hello"));
      expect(chunks[1]).toEqual(new Uint8Array([42]));
      expect(chunks[2]).toEqual(new Uint8Array([0x12, 0x34]));
      expect(chunks[3]).toEqual(new Uint8Array([0x78, 0x56, 0x34, 0x12]));
      expect(chunks[4]).toEqual(
        new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0]),
      );
      expect(chunks[5]).toEqual(new Uint8Array([0xaa, 0xbb]));
    });
  });
});
