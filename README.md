# conduit-ts

A TypeScript streaming library providing `StreamReader` and `StreamWriter` classes for efficient binary data processing. Inspired by the `Reader` and `Writer` interfaces from [Zig](https://ziglang.org]

## Features

- **StreamReader**: Read binary data from streams with support for various data types
- **StreamWriter**: Write binary data to streams with type-safe methods
- **Endianness Support**: Handle both Big-endian and Little-endian byte order
- **Buffer Management**: Efficient internal buffering for optimal performance
- **Type Safety**: Full TypeScript support with proper type definitions

## Performance

The library includes multiple `ValueReader` implementations optimized for different scenarios:

- **BitOpsValueReader**: Uses bit manipulation operations
- **DataViewValueReader**: Uses JavaScript's built-in DataView
- **PerformanceValueReader**: Hybrid approach using BitOps for 8-16 bit values and DataView for 32-64 bit values (used as DefaultValueReader)

### Benchmark Results

Performance comparison on **MacBook Pro (M1 Pro, 32GB RAM)** using Playwright (Chromium & Firefox):

| Operation | BitOps (ms) | DataView (ms) | Performance (ms) | Winner |
|-----------|-------------|---------------|------------------|---------|
| Int8 (1M iterations) | 8.18 | 34.29 | **7.85** | PerformanceValueReader |
| Int16 BE (500K iterations) | 12.43 | 20.44 | **11.13** | PerformanceValueReader |
| Int32 BE (200K iterations) | 16.63 | **15.11** | **15.16** | DataView (tied) |
| Uint64 BE (20K iterations) | 10.03 | 2.63 | **1.63** | PerformanceValueReader |
| Int64 BE (20K iterations) | 8.96 | 1.74 | **1.61** | PerformanceValueReader |

**Key Takeaways:**
- `PerformanceValueReader` provides the best overall performance across all data types
- For 8-16 bit operations, bit manipulation is significantly faster than DataView
- For 64-bit operations, the hybrid approach outperforms even pure DataView by ~40%
- `PerformanceValueReader` is used as the `DefaultValueReader` throughout the library
- Results are consistent across both Chromium and Firefox browsers

## Installation

Install directly from GitHub:

```bash
# Using npm
npm install github:username/conduit-ts

# Using yarn
yarn add github:username/conduit-ts

# Using pnpm
pnpm add github:username/conduit-ts

# Using bun
bun add github:username/conduit-ts
```

**Requirements:**
- TypeScript-compatible runtime (Bun, Deno) or bundler (Vite, Webpack, etc.)

## Usage

### StreamReader

```typescript
import { StreamReader, Endian } from 'conduit-ts';

// Create from a ReadableStream
const reader = new StreamReader(someReadableStream);

// Or create from a buffer
const reader = StreamReader.from(new Uint8Array([1, 2, 3, 4]));

// Read various data types
const uint8Value = await reader.readUint8();
const uint16Value = await reader.readUint16(Endian.Little);
const uint32Value = await reader.readUint32();
const stringValue = await reader.readString(10);

// Read raw bytes
const bytes = await reader.read(5);

// Read until end of stream
const allBytes = await reader.readUntilEof();

// Clean up
await reader.close();
```

### StreamWriter

```typescript
import { StreamWriter, Endian } from 'conduit-ts';

// Create with a WritableStream
const writer = new StreamWriter(someWritableStream);

// Write various data types
await writer.writeUint8(255);
await writer.writeUint16(65535, Endian.Little);
await writer.writeUint32(4294967295);
await writer.writeString("Hello, World!");

// Write raw bytes
await writer.write(new Uint8Array([1, 2, 3, 4]));

// Clean up
await writer.close();
```

## API Reference

### StreamReader

#### Constructor
- `new StreamReader(stream: ReadableStream<Uint8Array>)`
- `StreamReader.from(bufferSource: BufferSource)` - Create from buffer

#### Reading Methods
- `read(len: number | bigint): Promise<Uint8Array>` - Read raw bytes
- `readString(len: number | bigint): Promise<string>` - Read UTF-8 string
- `readUint8(): Promise<number>` - Read unsigned 8-bit integer
- `readInt8(): Promise<number>` - Read signed 8-bit integer
- `readUint16(endian?: Endian): Promise<number>` - Read unsigned 16-bit integer
- `readInt16(endian?: Endian): Promise<number>` - Read signed 16-bit integer
- `readUint32(endian?: Endian): Promise<number>` - Read unsigned 32-bit integer
- `readInt32(endian?: Endian): Promise<number>` - Read signed 32-bit integer
- `readUint64(endian?: Endian): Promise<bigint>` - Read unsigned 64-bit integer
- `readInt64(endian?: Endian): Promise<bigint>` - Read signed 64-bit integer
- `readUntilEof(): Promise<Uint8Array>` - Read all remaining bytes

#### Properties
- `bytesRead: number` - Total bytes read so far

#### Methods
- `close(): Promise<void>` - Close the reader and release resources

### StreamWriter

#### Constructor
- `new StreamWriter(stream: WritableStream)`

#### Writing Methods
- `write(buffer: BufferSource): Promise<number>` - Write raw bytes
- `writeString(value: string): Promise<number>` - Write UTF-8 string
- `writeUint8(value: number): Promise<number>` - Write unsigned 8-bit integer
- `writeInt8(value: number): Promise<number>` - Write signed 8-bit integer
- `writeUint16(value: number, endian?: Endian): Promise<number>` - Write unsigned 16-bit integer
- `writeInt16(value: number, endian?: Endian): Promise<number>` - Write signed 16-bit integer
- `writeUint32(value: number, endian?: Endian): Promise<number>` - Write unsigned 32-bit integer
- `writeInt32(value: number, endian?: Endian): Promise<number>` - Write signed 32-bit integer
- `writeUint64(value: bigint, endian?: Endian): Promise<number>` - Write unsigned 64-bit integer
- `writeInt64(value: bigint, endian?: Endian): Promise<number>` - Write signed 64-bit integer

#### Methods
- `close(): Promise<void>` - Close the writer and flush any pending data

### Endian Enum

```typescript
enum Endian {
  Little,
  Big
}
```

### Utility Functions

- `uint8ArrayFromBufferSource(bufferSource: BufferSource): Uint8Array` - Convert BufferSource to Uint8Array
- `toBase64(data: BufferSource): string` - Convert binary data to base64 string

## TODO

- [ ] Publish package to npmjs

## License

MIT
