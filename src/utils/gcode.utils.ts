import { createReadStream } from "fs";
import { createInterface } from "node:readline/promises";
import { writeFileSync } from "node:fs";
import { open } from "node:fs/promises";

export const gcodeScanningChunkSize = 64 * 1024; // 64 KB
export const gcodeMaxLinesToRead = 10000;

export async function extractThumbnailBase64(gcodePath: string, thumbnailPath: string) {
  const fileStream = createReadStream(gcodePath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity, // Handles cross-platform line endings
  });

  let collecting = false;
  let currentThumbnailBase64 = "";

  // Only PNG is supported, not JPG or QOI (for now)
  let index = 0;
  for await (const line of rl) {
    if (line.startsWith("; thumbnail begin")) {
      collecting = true;
      currentThumbnailBase64 = "";
    } else if (collecting && line.startsWith("; thumbnail") && line.includes("end")) {
      collecting = false;

      rl.close();
      break;
    } else if (collecting) {
      const trim = line.trim().replace(/^;/, "").trim();
      currentThumbnailBase64 += trim;
    }

    if (index > gcodeMaxLinesToRead) {
      throw new Error("Thumbnail not found (within 10000 lines).");
    }
    index++;
  }

  if (!currentThumbnailBase64?.length) {
    throw new Error("Thumbnail not found (within 10000 lines).");
  }

  // Validation, data unused
  Buffer.from(currentThumbnailBase64, "base64");
  writeFileSync(thumbnailPath, currentThumbnailBase64);

  return currentThumbnailBase64;
}

/**
 * Read local GCode metadata or thumbnails
 * @param filePath
 * @param numberOfLines
 */
export async function readLastLinesLocal(filePath: string, numberOfLines: number) {
  const file = await open(filePath, "r");

  try {
    const buffer = Buffer.alloc(gcodeScanningChunkSize);
    const fileSize = await file.stat();
    let lines: string[] = [];
    let position = fileSize.size;
    let iterationsLeft = 100;

    while (lines.length <= numberOfLines && position > 0) {
      iterationsLeft--;
      if (iterationsLeft <= 0) {
        throw new Error("Too many iterations reached, 'readLastLines' aborted");
      }

      const bytesToRead = Math.min(gcodeScanningChunkSize, position);
      position -= bytesToRead;

      await file.read(buffer, 0, bytesToRead, position);
      const chunk = buffer.toString("utf-8", 0, bytesToRead);

      // Prepend the chunk's lines
      lines = chunk.split("\n").concat(lines);

      await file.close();
    }

    return lines.slice(-numberOfLines);
  } catch (e) {
    await file.close();
    throw e;
  }
}
