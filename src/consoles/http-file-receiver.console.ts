import express, { Request, Response } from "express";
import multer from "multer";

// Custom storage to introduce artificial delay
const delayedMemoryStorage = (): multer.StorageEngine => {
  return {
    _handleFile(req, file, cb) {
      let chunks: Buffer[] = [];
      let processingComplete = Promise.resolve();

      console.log(`Processing file upload name ${file.originalname} field ${file.fieldname} size ${file.size}`);

      file.stream.on("data", (chunk) => {
        chunks.push(chunk);
        // processingComplete = processingComplete.then(
        //   () => chunks.push(chunk)
        //   // new Promise((resolve) => {
        //   //   setTimeout(() => {
        //   //     chunks.push(chunk);
        //   //     resolve(null);
        //   //   }, 1); // ~1ms delay per chunk
        //   // })
        // );
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
const port = process.argv[2] ? parseInt(process.argv[2]) : 1234;

const upload = multer({ storage: delayedMemoryStorage() });

const app = express();

// @ts-ignore
app.post("/api/files/local", upload.single("file"), (req: Request, res: Response) => {
  const { select, print } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "Missing file" });
  }
  if (typeof select === "undefined" || typeof print === "undefined") {
    return res.status(400).json({ error: "Missing required fields: select, print" });
  }
  if (Object.keys(req.body).length !== 2) {
    return res.status(400).json({ error: "Only fields 'select' and 'print' are allowed" });
  }
  if (!["true", "false"].includes(select) || !["true", "false"].includes(print)) {
    return res.status(400).json({ error: "Fields 'select' and 'print' must be boolean values (true/false)" });
  }

  console.log(`[PORT ${port}] Received file:`, file.originalname);
  console.log(`[PORT ${port}] File size:`, file.size);
  console.log(`[PORT ${port}] MIME type:`, file.mimetype);
  console.log(`[PORT ${port}] select:`, select, `\n[PORT ${port}] print:`, print, `\n-----`);

  res.json({ message: "File received successfully" });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
