import { describe, test, expect } from "bun:test";
import { uint8ArrayFromBufferSource, toBase64 } from "../index";

describe("Buffer utilities", () => {
  describe("uint8ArrayFromBufferSource", () => {
    test("should convert Uint8Array to Uint8Array", () => {
      const input = new Uint8Array([1, 2, 3, 4, 5]);
      const result = uint8ArrayFromBufferSource(input);

      expect(result).toBe(input); // Should return the same instance
      expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
    });

    test("should convert ArrayBuffer to Uint8Array", () => {
      const buffer = new ArrayBuffer(5);
      const view = new Uint8Array(buffer);
      view.set([1, 2, 3, 4, 5]);

      const result = uint8ArrayFromBufferSource(buffer);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
      expect(result.buffer).toBe(buffer);
    });

    test("should convert Int8Array to Uint8Array", () => {
      const input = new Int8Array([-1, -2, 3, 4, 5]);
      const result = uint8ArrayFromBufferSource(input);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toEqual(new Uint8Array([0xff, 0xfe, 3, 4, 5])); // -1 becomes 0xff, -2 becomes 0xfe
    });

    test("should convert Uint16Array to Uint8Array", () => {
      const input = new Uint16Array([0x0102, 0x0304]);
      const result = uint8ArrayFromBufferSource(input);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(4); // 2 uint16 values = 4 bytes
    });

    test("should convert Int32Array to Uint8Array", () => {
      const input = new Int32Array([0x01020304]);
      const result = uint8ArrayFromBufferSource(input);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(4); // 1 int32 value = 4 bytes
    });

    test("should convert Float32Array to Uint8Array", () => {
      const input = new Float32Array([1.5, 2.5]);
      const result = uint8ArrayFromBufferSource(input);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(8); // 2 float32 values = 8 bytes
    });

    test("should convert DataView to Uint8Array", () => {
      const buffer = new ArrayBuffer(4);
      const dataView = new DataView(buffer);
      dataView.setUint32(0, 0x01020304, false); // big-endian

      const result = uint8ArrayFromBufferSource(dataView);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toEqual(new Uint8Array([0x01, 0x02, 0x03, 0x04]));
    });

    test("should handle empty ArrayBuffer", () => {
      const buffer = new ArrayBuffer(0);
      const result = uint8ArrayFromBufferSource(buffer);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });

    test("should handle empty Uint8Array", () => {
      const input = new Uint8Array([]);
      const result = uint8ArrayFromBufferSource(input);

      expect(result).toBe(input);
      expect(result.length).toBe(0);
    });

    test("should throw TypeError for unsupported types", () => {
      expect(() => uint8ArrayFromBufferSource("not a buffer" as any)).toThrow(
        TypeError,
      );
      expect(() => uint8ArrayFromBufferSource("not a buffer" as any)).toThrow(
        "Unsupported BufferSource type",
      );

      expect(() => uint8ArrayFromBufferSource(123 as any)).toThrow(TypeError);
      expect(() => uint8ArrayFromBufferSource(null as any)).toThrow(TypeError);
      expect(() => uint8ArrayFromBufferSource(undefined as any)).toThrow(
        TypeError,
      );
      expect(() => uint8ArrayFromBufferSource({} as any)).toThrow(TypeError);
    });

    test("should handle large buffers", () => {
      const size = 10000;
      const buffer = new ArrayBuffer(size);
      const view = new Uint8Array(buffer);

      // Fill with pattern
      for (let i = 0; i < size; i++) {
        view[i] = i % 256;
      }

      const result = uint8ArrayFromBufferSource(buffer);

      expect(result.length).toBe(size);
      expect(result[0]).toBe(0x00);
      expect(result[255]).toBe(0xff);
      expect(result[256]).toBe(0x00); // wraps around
    });
  });

  describe("toBase64", () => {
    test("should convert Uint8Array to base64", () => {
      const input = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
      const result = toBase64(input);

      expect(result).toBe("SGVsbG8=");
    });

    test("should convert ArrayBuffer to base64", () => {
      const buffer = new ArrayBuffer(5);
      const view = new Uint8Array(buffer);
      view.set([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"

      const result = toBase64(buffer);

      expect(result).toBe("SGVsbG8=");
    });

    test("should handle empty buffer", () => {
      const input = new Uint8Array([]);
      const result = toBase64(input);

      expect(result).toBe("");
    });

    test("should handle single byte", () => {
      const input = new Uint8Array([0x41]); // "A"
      const result = toBase64(input);

      expect(result).toBe("QQ==");
    });

    test("should handle two bytes", () => {
      const input = new Uint8Array([0x41, 0x42]); // "AB"
      const result = toBase64(input);

      expect(result).toBe("QUI=");
    });

    test("should handle three bytes", () => {
      const input = new Uint8Array([0x41, 0x42, 0x43]); // "ABC"
      const result = toBase64(input);

      expect(result).toBe("QUJD");
    });

    test("should handle binary data", () => {
      const input = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0xfe, 0xff]);
      const result = toBase64(input);

      // Verify it's a valid base64 string
      expect(result).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
      expect(result.length % 4).toBe(0);
    });

    test("should handle all possible byte values", () => {
      const input = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        input[i] = i;
      }

      const result = toBase64(input);

      // Verify it's a valid base64 string
      expect(result).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
      expect(result.length % 4).toBe(0);
    });

    test("should use native toBase64 if available", () => {
      const input = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"

      // Mock the native toBase64 method
      const originalToBase64 = input.toBase64;
      input.toBase64 = () => "MOCKED_BASE64";

      const result = toBase64(input);
      expect(result).toBe("MOCKED_BASE64");

      // Restore original method
      if (originalToBase64) {
        input.toBase64 = originalToBase64;
      } else {
        delete (input as any).toBase64;
      }
    });

    test("should fall back to btoa when native toBase64 not available", () => {
      const input = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"

      // Ensure toBase64 is not available
      const originalToBase64 = (input as any).toBase64;
      delete (input as any).toBase64;

      const result = toBase64(input);
      expect(result).toBe("SGVsbG8=");

      // Restore if it existed
      if (originalToBase64) {
        (input as any).toBase64 = originalToBase64;
      }
    });

    test("should handle TypedArray views", () => {
      const buffer = new ArrayBuffer(8);
      const int32View = new Int32Array(buffer);
      int32View[0] = 0x48656c6c; // "Hell" in big-endian
      int32View[1] = 0x6f000000; // "o\0\0\0" in big-endian

      const result = toBase64(int32View);

      // Should convert the underlying buffer data
      expect(result).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
      expect(result.length % 4).toBe(0);
    });

    test("should handle DataView", () => {
      const buffer = new ArrayBuffer(4);
      const dataView = new DataView(buffer);
      dataView.setUint8(0, 0x48); // "H"
      dataView.setUint8(1, 0x65); // "e"
      dataView.setUint8(2, 0x6c); // "l"
      dataView.setUint8(3, 0x6c); // "l"

      const result = toBase64(dataView);
      expect(result).toBe("SGVsbA==");
    });

    test("should produce consistent results", () => {
      const input = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

      const result1 = toBase64(input);
      const result2 = toBase64(input);

      expect(result1).toBe(result2);
      expect(result1).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
    });

    test("should handle large buffers", () => {
      const size = 10000;
      const input = new Uint8Array(size);

      // Fill with predictable pattern
      for (let i = 0; i < size; i++) {
        input[i] = i % 256;
      }

      const result = toBase64(input);

      // Verify it's a valid base64 string
      expect(result).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
      expect(result.length % 4).toBe(0);

      // Base64 encoding increases size by ~33%
      const expectedMinLength = Math.floor((size * 4) / 3);
      expect(result.length).toBeGreaterThanOrEqual(expectedMinLength);
    });
  });

  describe("integration", () => {
    test("should work together for various buffer types", () => {
      const testCases: BufferSource[] = [
        new Uint8Array([1, 2, 3, 4]),
        new ArrayBuffer(4),
        new Int8Array([-1, -2, 3, 4]),
        new Uint16Array([0x0102, 0x0304]),
        new Int32Array([0x01020304]),
      ];

      for (const bufferSource of testCases) {
        const uint8Array = uint8ArrayFromBufferSource(bufferSource);
        const base64 = toBase64(bufferSource);

        expect(uint8Array).toBeInstanceOf(Uint8Array);
        expect(typeof base64).toBe("string");
        expect(base64).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
      }
    });

    test("should maintain data integrity through conversion chain", () => {
      const originalData = [
        0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x57, 0x6f, 0x72, 0x6c, 0x64,
      ]; // "Hello World"
      const buffer = new ArrayBuffer(originalData.length);
      const view = new Uint8Array(buffer);
      view.set(originalData);

      // Convert through the utility functions
      const uint8Array = uint8ArrayFromBufferSource(buffer);
      const base64 = toBase64(uint8Array);

      // Verify the data is preserved
      expect(uint8Array).toEqual(new Uint8Array(originalData));
      expect(base64).toBe("SGVsbG8gV29ybGQ=");

      // Verify we can decode it back (using browser's atob if available)
      if (typeof atob !== "undefined") {
        const decoded = atob(base64);
        const decodedArray = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
          decodedArray[i] = decoded.charCodeAt(i);
        }
        expect(decodedArray).toEqual(new Uint8Array(originalData));
      }
    });
  });
});
