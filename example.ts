import { StreamReader, StreamWriter, Endian } from './index.ts';

async function exampleUsage() {
  console.log('🚀 Testing conduit-ts StreamReader and StreamWriter');

  // Create a simple WritableStream that collects data
  const chunks: Uint8Array[] = [];
  const writableStream = new WritableStream({
    write(chunk) {
      chunks.push(new Uint8Array(chunk));
    }
  });

  // Test StreamWriter
  console.log('\n📝 Testing StreamWriter...');
  const writer = new StreamWriter(writableStream);

  await writer.writeString('Hello');
  await writer.writeUint8(255);
  await writer.writeUint16(0x1234, Endian.Big);
  await writer.writeUint32(0x12345678, Endian.Little);
  await writer.writeInt64(BigInt('-9223372036854775808'), Endian.Big);

  await writer.close();

  // Combine all chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combinedData = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combinedData.set(chunk, offset);
    offset += chunk.length;
  }

  console.log('✅ Written data:', combinedData);
  console.log('📊 Data breakdown:');
  console.log('  - String "Hello":', combinedData.slice(0, 5));
  console.log('  - Uint8 255:', combinedData.slice(5, 6));
  console.log('  - Uint16 0x1234 (big-endian):', combinedData.slice(6, 8));
  console.log('  - Uint32 0x12345678 (little-endian):', combinedData.slice(8, 12));
  console.log('  - Int64 min value (big-endian):', combinedData.slice(12, 20));

  // Test StreamReader
  console.log('\n📖 Testing StreamReader...');
  const reader = StreamReader.from(combinedData);

  const readString = await reader.readString(5);
  const readUint8 = await reader.readUint8();
  const readUint16 = await reader.readUint16(Endian.Big);
  const readUint32 = await reader.readUint32(Endian.Little);
  const readInt64 = await reader.readInt64(Endian.Big);

  console.log('✅ Read results:');
  console.log('  - String:', readString);
  console.log('  - Uint8:', readUint8);
  console.log('  - Uint16 (big-endian):', `0x${readUint16.toString(16).toUpperCase()}`);
  console.log('  - Uint32 (little-endian):', `0x${readUint32.toString(16).toUpperCase()}`);
  console.log('  - Int64 (big-endian):', readInt64.toString());
  console.log('  - Bytes read:', reader.bytesRead);

  await reader.close();

  // Verify data integrity
  console.log('\n🔍 Verification:');
  console.log('  - String matches:', readString === 'Hello' ? '✅' : '❌');
  console.log('  - Uint8 matches:', readUint8 === 255 ? '✅' : '❌');
  console.log('  - Uint16 matches:', readUint16 === 0x1234 ? '✅' : '❌');
  console.log('  - Uint32 matches:', readUint32 === 0x12345678 ? '✅' : '❌');
  console.log('  - Int64 matches:', readInt64 === BigInt('-9223372036854775808') ? '✅' : '❌');

  // Test buffer creation
  console.log('\n🧪 Testing buffer utilities...');
  const testBuffer = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
  const bufferReader = StreamReader.from(testBuffer);
  const bufferString = await bufferReader.readString(5);
  console.log('  - Buffer to string:', bufferString);
  console.log('  - Buffer conversion works:', bufferString === 'Hello' ? '✅' : '❌');

  console.log('\n🎉 All tests completed!');
}

// Run the example
exampleUsage().catch(console.error);
