import { Request } from "express";
import { StorageEngine } from "multer";

/**
 * Custom storage to introduce artificial delay
 */
export const delayedMemoryStorage = (): StorageEngine => {
  return {
    _handleFile(req: Request, file, cb) {
      let chunks: Buffer[] = [];
      let processingComplete = Promise.resolve();

      console.log(`Processing file upload name ${file.originalname} field ${file.fieldname} size ${file.size}`);

      file.stream.on("data", (chunk) => {
        chunks.push(chunk);
        processingComplete = processingComplete.then(
          // () => chunks.push(chunk)
          // @ts-ignore
          new Promise((resolve) => {
            return setTimeout(() => {
              chunks.push(chunk);
              resolve(null);
            }, 1); // ~1ms delay per chunk
          }),
        );
      });

      file.stream.on("end", () => {
        cb(null, { buffer: Buffer.concat(chunks), size: Buffer.concat(chunks).length });
        // processingComplete.then(() => {
        // });
      });

      file.stream.on("error", (err) => {
        cb(err);
      });
    },
    _removeFile(req, file, cb) {
      cb(null);
    },
  };
};
