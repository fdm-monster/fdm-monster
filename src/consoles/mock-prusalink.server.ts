import path from "path";
import fs from "fs";
import console from "node:console";
import multer from "multer";
import express from "express";
import http from "http";

const port = process.argv[2] ? parseInt(process.argv[2]) : 2234;
const uploadsDir = path.join(__dirname, "uploads", `server-${port.toString()}`);

if (!fs.existsSync(uploadsDir)) {
  console.log(`[PORT ${port}] Creating uploads folder ${uploadsDir}`);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Clean up on startup
cleanupUploads();

const upload = multer({ dest: uploadsDir });

const app = express();
const server = http.createServer(app);

app.get("/api/version", async (req, res) => {
  res.send({
    api: "2.0.0",
    server: "2.1.2",
    nozzle_diameter: 0.4,
    text: "PrusaLink",
    hostname: "prusa-mini",
    capabilities: {
      "upload-by-put": true,
    },
  });
});

function cleanupUploads() {
  try {
    console.log(`[PORT ${port}] Cleaning up uploads folder...`);
    const files = fs.readdirSync(uploadsDir);

    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      fs.unlinkSync(filePath);
      console.log(`[PORT ${port}] Deleted: ${filePath}`);
    }

    console.log(`[PORT ${port}] Uploads folder cleanup complete`);
  } catch (error) {
    console.error(`[PORT ${port}] Error cleaning up uploads folder:`, error);
  }
}
