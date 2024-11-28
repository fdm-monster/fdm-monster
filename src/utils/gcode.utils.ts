import { createReadStream } from "fs";
import { createInterface } from "node:readline/promises";
import { writeFileSync } from "node:fs";

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
  const maxLines = 10000;
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

    if (index > maxLines) {
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
