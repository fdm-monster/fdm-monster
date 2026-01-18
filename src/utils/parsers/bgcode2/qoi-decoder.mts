interface QOIDecoded {
  width: number;
  height: number;
  channels: 3 | 4;
  colorspace: 0 | 1;
  data: Buffer;
}

const QOI_OP_INDEX = 0x00; // 00xxxxxx
const QOI_OP_DIFF = 0x40;  // 01xxxxxx
const QOI_OP_LUMA = 0x80;  // 10xxxxxx
const QOI_OP_RUN = 0xc0;   // 11xxxxxx
const QOI_OP_RGB = 0xfe;   // 11111110
const QOI_OP_RGBA = 0xff;  // 11111111

const QOI_MAGIC = 0x716f6966; // "qoif"

function hashColor(r: number, g: number, b: number, a: number): number {
  return (r * 3 + g * 5 + b * 7 + a * 11) % 64;
}

export function decodeQOI(buffer: Buffer): QOIDecoded {
  let pos = 0;

  // Read header (14 bytes)
  if (buffer.length < 14) {
    throw new Error('Invalid QOI file: too short');
  }

  const magic = buffer.readUInt32BE(pos);
  pos += 4;
  if (magic !== QOI_MAGIC) {
    throw new Error(`Invalid QOI magic: expected ${QOI_MAGIC.toString(16)}, got ${magic.toString(16)}`);
  }

  const width = buffer.readUInt32BE(pos);
  pos += 4;
  const height = buffer.readUInt32BE(pos);
  pos += 4;
  const channels = buffer.readUInt8(pos) as 3 | 4;
  pos += 1;
  const colorspace = buffer.readUInt8(pos) as 0 | 1;
  pos += 1;

  if (channels !== 3 && channels !== 4) {
    throw new Error(`Invalid QOI channels: ${channels}`);
  }

  // Allocate output buffer
  const pixelCount = width * height;
  const outputSize = pixelCount * 4; // Always output RGBA
  const output = Buffer.alloc(outputSize);

  // Initialize state
  const colorArray: Array<[number, number, number, number]> = new Array(64);
  for (let i = 0; i < 64; i++) {
    colorArray[i] = [0, 0, 0, 0];
  }

  let r = 0, g = 0, b = 0, a = 255;
  let outPos = 0;

  // Decode chunks
  while (outPos < outputSize) {
    // Check for end marker (7 bytes of 0x00 followed by 0x01)
    if (pos + 8 <= buffer.length) {
      let isEnd = true;
      for (let i = 0; i < 7; i++) {
        if (buffer[pos + i] !== 0x00) {
          isEnd = false;
          break;
        }
      }
      if (isEnd && buffer[pos + 7] === 0x01) {
        break;
      }
    }

    if (pos >= buffer.length) {
      throw new Error('Unexpected end of QOI data');
    }

    const byte1 = buffer[pos++];

    if (byte1 === QOI_OP_RGB) {
      // QOI_OP_RGB: full RGB
      r = buffer[pos++];
      g = buffer[pos++];
      b = buffer[pos++];
    } else if (byte1 === QOI_OP_RGBA) {
      // QOI_OP_RGBA: full RGBA
      r = buffer[pos++];
      g = buffer[pos++];
      b = buffer[pos++];
      a = buffer[pos++];
    } else {
      const tag = byte1 & 0xc0;

      if (tag === QOI_OP_INDEX) {
        // QOI_OP_INDEX: 00xxxxxx
        const index = byte1 & 0x3f;
        [r, g, b, a] = colorArray[index];
      } else if (tag === QOI_OP_DIFF) {
        // QOI_OP_DIFF: 01xxxxxx
        const dr = ((byte1 >> 4) & 0x03) - 2;
        const dg = ((byte1 >> 2) & 0x03) - 2;
        const db = (byte1 & 0x03) - 2;
        r = (r + dr) & 0xff;
        g = (g + dg) & 0xff;
        b = (b + db) & 0xff;
      } else if (tag === QOI_OP_LUMA) {
        // QOI_OP_LUMA: 10xxxxxx
        const byte2 = buffer[pos++];
        const dg = (byte1 & 0x3f) - 32;
        const dr_dg = ((byte2 >> 4) & 0x0f) - 8;
        const db_dg = (byte2 & 0x0f) - 8;
        g = (g + dg) & 0xff;
        r = (r + dg + dr_dg) & 0xff;
        b = (b + dg + db_dg) & 0xff;
      } else if (tag === QOI_OP_RUN) {
        // QOI_OP_RUN: 11xxxxxx
        const run = (byte1 & 0x3f) + 1;
        for (let i = 0; i < run; i++) {
          output[outPos++] = r;
          output[outPos++] = g;
          output[outPos++] = b;
          output[outPos++] = a;
        }
        // Update color array for the last pixel in run
        const hash = hashColor(r, g, b, a);
        colorArray[hash] = [r, g, b, a];
        continue;
      }
    }

    // Write pixel
    output[outPos++] = r;
    output[outPos++] = g;
    output[outPos++] = b;
    output[outPos++] = a;

    // Update color array
    const hash = hashColor(r, g, b, a);
    colorArray[hash] = [r, g, b, a];
  }

  return {
    width,
    height,
    channels,
    colorspace,
    data: output
  };
}
