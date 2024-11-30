import { open } from "node:fs/promises";

export const gcodeScanningChunkSize = 64 * 1024; // 64 KB
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
