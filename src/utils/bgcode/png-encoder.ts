/**
 * Simple PNG Encoder
 * Creates PNG files from RGBA pixel data
 */

import { deflateSync } from 'node:zlib';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

function crc32(buffer: Buffer): number {
  // Simple CRC32 implementation
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crcBuffer = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcBuffer), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

export function encodePNG(width: number, height: number, rgba: Buffer): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);  // bit depth
  ihdr.writeUInt8(6, 9);  // color type (6 = RGBA)
  ihdr.writeUInt8(0, 10); // compression method
  ihdr.writeUInt8(0, 11); // filter method
  ihdr.writeUInt8(0, 12); // interlace method

  // Prepare image data with filter bytes (0 = no filter for each scanline)
  const bytesPerPixel = 4;
  const scanlineLength = width * bytesPerPixel;
  const filteredData = Buffer.alloc(height * (scanlineLength + 1));

  for (let y = 0; y < height; y++) {
    const scanlineOffset = y * (scanlineLength + 1);
    filteredData[scanlineOffset] = 0; // Filter type: None
    rgba.copy(filteredData, scanlineOffset + 1, y * scanlineLength, (y + 1) * scanlineLength);
  }

  // Compress image data
  const compressed = deflateSync(filteredData);

  // Build PNG
  const chunks = [
    PNG_SIGNATURE,
    writeChunk('IHDR', ihdr),
    writeChunk('IDAT', compressed),
    writeChunk('IEND', Buffer.alloc(0))
  ];

  return Buffer.concat(chunks);
}
