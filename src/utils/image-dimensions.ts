export function getImageDimensions(imageData: Buffer, format: string): { width: number; height: number } {
  if (format === "PNG") {
    return getPngDimensions(imageData);
  } else if (format === "JPG" || format === "JPEG") {
    return getJpgDimensions(imageData);
  }
  return { width: 0, height: 0 };
}

function getPngDimensions(data: Buffer): { width: number; height: number } {
  if (data.length < 24) {
    return { width: 0, height: 0 };
  }

  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);

  return { width, height };
}

function getJpgDimensions(data: Buffer): { width: number; height: number } {
  let offset = 2;

  while (offset < data.length) {
    if (data[offset] !== 0xFF) break;

    const marker = data[offset + 1];
    offset += 2;

    if (marker === 0xC0 || marker === 0xC2) {
      if (offset + 5 < data.length) {
        const height = data.readUInt16BE(offset + 1);
        const width = data.readUInt16BE(offset + 3);
        return { width, height };
      }
      break;
    }

    const segmentLength = data.readUInt16BE(offset);
    offset += segmentLength;
  }

  return { width: 0, height: 0 };
}
