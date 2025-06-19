import { describe, test, expect } from "bun:test";
import { StreamReader, StreamWriter, Endian } from "../../index";

describe("Integration Tests - Round-trip Read/Write", () => {
  async function createWriterAndCollectData(): Promise<{
    writer: StreamWriter;
    getData: () => Uint8Array;
  }> {
    const chunks: Uint8Array[] = [];
    const stream = new WritableStream({
      write(chunk) {
        chunks.push(new Uint8Array(chunk));
      },
    });

    const writer = new StreamWriter(stream);

    const getData = () => {
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combinedData = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combinedData.set(chunk, offset);
        offset += chunk.length;
      }
      return combinedData;
    };

    return { writer, getData };
  }

  describe("basic data types", () => {
    test("should round-trip uint8 values", async () => {
      const { writer, getData } = await createWriterAndCollectData();
      const values = [0, 127, 255, 42, 128];

      for (const value of values) {
        await writer.writeUint8(value);
      }
      await writer.close();

      const reader = StreamReader.from(getData());
      for (const expected of values) {
        const actual = await reader.readUint8();
        expect(actual).toBe(expected);
      }
    });

    test("should round-trip int8 values", async () => {
      const { writer, getData } = await createWriterAndCollectData();
      const values = [0, 127, -128, -1, 42, -42];

      for (const value of values) {
        await writer.writeInt8(value);
      }
      await writer.close();

      const reader = StreamReader.from(getData());
      for (const expected of values) {
        const actual = await reader.readInt8();
        expect(actual).toBe(expected);
      }
    });

    test("should round-trip uint16 values with different endianness", async () => {
      const { writer, getData } = await createWriterAndCollectData();
      const values = [0x00, 0x1234, 0xffff, 0x00ff, 0xff00];

      // Test big-endian
      for (const value of values) {
        await writer.writeUint16(value, Endian.Big);
      }

      // Test little-endian
      for (const value of values) {
        await writer.writeUint16(value, Endian.Little);
      }

      await writer.close();

      const reader = StreamReader.from(getData());

      // Read big-endian values
      for (const expected of values) {
        const actual = await reader.readUint16(Endian.Big);
        expect(actual).toBe(expected);
      }

      // Read little-endian values
      for (const expected of values) {
        const actual = await reader.readUint16(Endian.Little);
        expect(actual).toBe(expected);
      }
    });

    test("should round-trip int16 values", async () => {
      const { writer, getData } = await createWriterAndCollectData();
      const values = [0x00, 0x7fff, -0x8000, -0x01, 0x1234, -0x1234];

      for (const value of values) {
        await writer.writeInt16(value, Endian.Big);
      }
      await writer.close();

      const reader = StreamReader.from(getData());
      for (const expected of values) {
        const actual = await reader.readInt16(Endian.Big);
        expect(actual).toBe(expected);
      }
    });

    test("should round-trip uint32 values", async () => {
      const { writer, getData } = await createWriterAndCollectData();
      const values = [0x00, 0x12345678, 0xffffffff, 0x00000001, 0x80000000];

      for (const value of values) {
        await writer.writeUint32(value, Endian.Big);
      }
      await writer.close();

      const reader = StreamReader.from(getData());
      for (const expected of values) {
        const actual = await reader.readUint32(Endian.Big);
        expect(actual).toBe(expected);
      }
    });

    test("should round-trip int32 values", async () => {
      const { writer, getData } = await createWriterAndCollectData();
      const values = [
        0x00, 0x7fffffff, -0x80000000, -0x01, 0x12345678, -0x12345678,
      ];

      for (const value of values) {
        await writer.writeInt32(value, Endian.Little);
      }
      await writer.close();

      const reader = StreamReader.from(getData());
      for (const expected of values) {
        const actual = await reader.readInt32(Endian.Little);
        expect(actual).toBe(expected);
      }
    });

    test("should round-trip uint64 values", async () => {
      const { writer, getData } = await createWriterAndCollectData();
      const values = [
        BigInt("0x00"),
        BigInt("0x123456789ABCDEF0"),
        BigInt("0xFFFFFFFFFFFFFFFF"),
        BigInt("0x0000000000000001"),
        BigInt("0x8000000000000000"),
      ];

      for (const value of values) {
        await writer.writeUint64(value, Endian.Big);
      }
      await writer.close();

      const reader = StreamReader.from(getData());
      for (const expected of values) {
        const actual = await reader.readUint64(Endian.Big);
        expect(actual).toBe(expected);
      }
    });

    test("should round-trip int64 values", async () => {
      const { writer, getData } = await createWriterAndCollectData();
      const values = [
        BigInt("0x00"),
        BigInt("0x7FFFFFFFFFFFFFFF"),
        -BigInt("0x8000000000000000"),
        -BigInt("0x01"),
        BigInt("0x123456789ABCDEF0"),
        -BigInt("0x123456789ABCDEF0"),
      ];

      for (const value of values) {
        await writer.writeInt64(value, Endian.Little);
      }
      await writer.close();

      const reader = StreamReader.from(getData());
      for (const expected of values) {
        const actual = await reader.readInt64(Endian.Little);
        expect(actual).toBe(expected);
      }
    });
  });

  describe("string operations", () => {
    test("should round-trip ASCII strings", async () => {
      const { writer, getData } = await createWriterAndCollectData();
      const strings = ["Hello", "World", "Test123", "", "A"];

      for (const str of strings) {
        await writer.writeString(str);
      }
      await writer.close();

      const reader = StreamReader.from(getData());
      let totalBytesRead = 0;

      for (const expected of strings) {
        const expectedBytes = new TextEncoder().encode(expected).length;
        const actual = await reader.readString(expectedBytes);
        expect(actual).toBe(expected);
        totalBytesRead += expectedBytes;
      }

      expect(reader.bytesRead).toBe(totalBytesRead);
    });

    test("should round-trip Unicode strings", async () => {
      const { writer, getData } = await createWriterAndCollectData();
      const strings = ["Hello, 世界!", "🌍🌎🌏", "Café", "München", "Москва"];

      for (const str of strings) {
        await writer.writeString(str);
      }
      await writer.close();

      const reader = StreamReader.from(getData());

      for (const expected of strings) {
        const expectedBytes = new TextEncoder().encode(expected).length;
        const actual = await reader.readString(expectedBytes);
        expect(actual).toBe(expected);
      }
    });

    test("should handle strings with null bytes", async () => {
      const { writer, getData } = await createWriterAndCollectData();
      const stringWithNull = "Hello\x00World";

      await writer.writeString(stringWithNull);
      await writer.close();

      const reader = StreamReader.from(getData());
      const expectedBytes = new TextEncoder().encode(stringWithNull).length;
      const actual = await reader.readString(expectedBytes);
      expect(actual).toBe(stringWithNull);
    });
  });

  describe("raw bytes operations", () => {
    test("should round-trip raw bytes", async () => {
      const { writer, getData } = await createWriterAndCollectData();
      const testData = new Uint8Array([
        0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd, 0x80, 0x7f,
      ]);

      await writer.write(testData);
      await writer.close();

      const reader = StreamReader.from(getData());
      const result = await reader.read(testData.length);
      expect(result).toEqual(testData);
    });

    test("should round-trip ArrayBuffer", async () => {
      const { writer, getData } = await createWriterAndCollectData();
      const buffer = new ArrayBuffer(8);
      const view = new Uint8Array(buffer);
      view.set([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);

      await writer.write(buffer);
      await writer.close();

      const reader = StreamReader.from(getData());
      const result = await reader.read(8);
      expect(result).toEqual(view);
    });
  });

  describe("complex mixed operations", () => {
    test("should round-trip complex data structure", async () => {
      const { writer, getData } = await createWriterAndCollectData();

      // Write a complex structure
      await writer.writeString("HEADER");
      await writer.writeUint32(0x12345678, Endian.Big);
      await writer.writeUint16(42, Endian.Little);
      await writer.writeInt64(-BigInt("0x8000000000000000"), Endian.Big);
      await writer.writeUint8(0xff);
      await writer.write(new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd]));
      await writer.writeString("FOOTER");

      await writer.close();

      // Read it back
      const reader = StreamReader.from(getData());

      const header = await reader.readString(6);
      expect(header).toBe("HEADER");

      const uint32Value = await reader.readUint32(Endian.Big);
      expect(uint32Value).toBe(0x12345678);

      const uint16Value = await reader.readUint16(Endian.Little);
      expect(uint16Value).toBe(42);

      const int64Value = await reader.readInt64(Endian.Big);
      expect(int64Value).toBe(-BigInt("0x8000000000000000"));

      const uint8Value = await reader.readUint8();
      expect(uint8Value).toBe(0xff);

      const rawBytes = await reader.read(4);
      expect(rawBytes).toEqual(new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd]));

      const footer = await reader.readString(6);
      expect(footer).toBe("FOOTER");

      expect(reader.bytesRead).toBe(getData().length);
    });

    test("should handle interleaved endianness", async () => {
      const { writer, getData } = await createWriterAndCollectData();

      await writer.writeUint16(0x1234, Endian.Big);
      await writer.writeUint16(0x5678, Endian.Little);
      await writer.writeUint32(0x9abcdef0, Endian.Big);
      await writer.writeUint32(0x13579bdf, Endian.Little);

      await writer.close();

      const reader = StreamReader.from(getData());

      expect(await reader.readUint16(Endian.Big)).toBe(0x1234);
      expect(await reader.readUint16(Endian.Little)).toBe(0x5678);
      expect(await reader.readUint32(Endian.Big)).toBe(0x9abcdef0);
      expect(await reader.readUint32(Endian.Little)).toBe(0x13579bdf);
    });
  });

  describe("edge cases", () => {
    test("should handle empty data", async () => {
      const { writer, getData } = await createWriterAndCollectData();

      await writer.close();

      const reader = StreamReader.from(getData());
      const result = await reader.readUntilEof();
      expect(result).toEqual(new Uint8Array([]));
    });

    test("should handle single byte operations", async () => {
      const { writer, getData } = await createWriterAndCollectData();

      await writer.writeUint8(42);
      await writer.close();

      const reader = StreamReader.from(getData());
      const result = await reader.readUint8();
      expect(result).toBe(42);
      expect(reader.bytesRead).toBe(1);
    });

    test("should handle maximum values", async () => {
      const { writer, getData } = await createWriterAndCollectData();

      await writer.writeUint8(0xff);
      await writer.writeInt8(-0x80);
      await writer.writeUint16(0xffff, Endian.Big);
      await writer.writeInt16(-0x8000, Endian.Big);
      await writer.writeUint32(0xffffffff, Endian.Big);
      await writer.writeInt32(-0x80000000, Endian.Big);
      await writer.writeUint64(BigInt("0xFFFFFFFFFFFFFFFF"), Endian.Big);
      await writer.writeInt64(-BigInt("0x8000000000000000"), Endian.Big);

      await writer.close();

      const reader = StreamReader.from(getData());

      expect(await reader.readUint8()).toBe(0xff);
      expect(await reader.readInt8()).toBe(-0x80);
      expect(await reader.readUint16(Endian.Big)).toBe(0xffff);
      expect(await reader.readInt16(Endian.Big)).toBe(-0x8000);
      expect(await reader.readUint32(Endian.Big)).toBe(0xffffffff);
      expect(await reader.readInt32(Endian.Big)).toBe(-0x80000000);
      expect(await reader.readUint64(Endian.Big)).toBe(
        BigInt("0xFFFFFFFFFFFFFFFF"),
      );
      expect(await reader.readInt64(Endian.Big)).toBe(
        -BigInt("0x8000000000000000"),
      );
    });
  });

  describe("partial reads and positioning", () => {
    test("should maintain correct position after partial reads", async () => {
      const { writer, getData } = await createWriterAndCollectData();

      // Write known pattern
      for (let i = 0; i < 10; i++) {
        await writer.writeUint8(i);
      }
      await writer.close();

      const reader = StreamReader.from(getData());

      // Read in different sized chunks
      const chunk1 = await reader.read(3);
      expect(chunk1).toEqual(new Uint8Array([0, 1, 2]));
      expect(reader.bytesRead).toBe(3);

      const byte1 = await reader.readUint8();
      expect(byte1).toBe(3);
      expect(reader.bytesRead).toBe(4);

      const chunk2 = await reader.read(2);
      expect(chunk2).toEqual(new Uint8Array([4, 5]));
      expect(reader.bytesRead).toBe(6);

      const remaining = await reader.readUntilEof();
      expect(remaining).toEqual(new Uint8Array([6, 7, 8, 9]));
      expect(reader.bytesRead).toBe(10);
    });

    test("should handle readUntilEof after partial consumption", async () => {
      const { writer, getData } = await createWriterAndCollectData();

      await writer.writeString("Hello");
      await writer.writeUint32(0x12345678, Endian.Big);
      await writer.writeString("World");

      await writer.close();

      const reader = StreamReader.from(getData());

      // Consume part of the data
      const hello = await reader.readString(5);
      expect(hello).toBe("Hello");

      // Read the rest
      const rest = await reader.readUntilEof();
      const restReader = StreamReader.from(rest);

      const uint32Value = await restReader.readUint32(Endian.Big);
      expect(uint32Value).toBe(0x12345678);

      const world = await restReader.readString(5);
      expect(world).toBe("World");
    });
  });

  describe("stress tests", () => {
    test("should handle large amounts of data", async () => {
      const { writer, getData } = await createWriterAndCollectData();

      const dataSize = 1000;
      const expectedValues: number[] = [];

      // Write a lot of data
      for (let i = 0; i < dataSize; i++) {
        const value = i % 256;
        expectedValues.push(value);
        await writer.writeUint8(value);
      }

      await writer.close();

      const reader = StreamReader.from(getData());

      // Read it all back
      for (let i = 0; i < dataSize; i++) {
        const actual = await reader.readUint8();
        expect(actual).toBe(expectedValues[i]);
      }

      expect(reader.bytesRead).toBe(dataSize);
    });

    test("should handle alternating data types", async () => {
      const { writer, getData } = await createWriterAndCollectData();

      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        await writer.writeUint8(i % 256);
        await writer.writeUint16(
          i % 65536,
          i % 2 === 0 ? Endian.Big : Endian.Little,
        );
        await writer.writeUint32(i, Endian.Big);
      }

      await writer.close();

      const reader = StreamReader.from(getData());

      for (let i = 0; i < iterations; i++) {
        const uint8Val = await reader.readUint8();
        expect(uint8Val).toBe(i % 256);

        const uint16Val = await reader.readUint16(
          i % 2 === 0 ? Endian.Big : Endian.Little,
        );
        expect(uint16Val).toBe(i % 65536);

        const uint32Val = await reader.readUint32(Endian.Big);
        expect(uint32Val).toBe(i);
      }
    });
  });
});
