declare global {
  interface Uint8Array {
    toBase64(): string;
  }
}

export function uint8ArrayFromBufferSource(
  bufferSource: BufferSource,
): Uint8Array {
  if (bufferSource instanceof ArrayBuffer) {
    return new Uint8Array(bufferSource);
  } else if (bufferSource instanceof Uint8Array) {
    return bufferSource;
  } else if (bufferSource.buffer instanceof ArrayBuffer) {
    return new Uint8Array(bufferSource.buffer);
  }

  throw new TypeError("Unsupported BufferSource type");
}

export function toBase64(data: BufferSource): string {
  const uint8Array = uint8ArrayFromBufferSource(data);

  if (uint8Array.toBase64 != null) {
    return uint8Array.toBase64();
  }

  return btoa(String.fromCharCode(...(uint8Array as Uint8Array)));
}
