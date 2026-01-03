import express from "express";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_IMAGE_BASE64 } from "./default-image.js";

const port = process.argv[2] ? Number.parseInt(process.argv[2]) : 8181;
const fps = process.argv[3] ? Number.parseInt(process.argv[3]) : 10;
const frameInterval = 1000 / fps;

const app = express();
const server = http.createServer(app);

// Track active intervals for graceful shutdown
const activeIntervals = new Set<NodeJS.Timeout>();

// Directory for custom frames (optional)
const framesDir = path.join(process.cwd(), "media", "mock-camera");

// Create frames directory if it doesn't exist
if (!fs.existsSync(framesDir)) {
  console.log(`[CAMERA:${port}] Creating frames folder ${framesDir}`);
  console.log(`[CAMERA:${port}] You can place custom .jpg/.jpeg/.png images here to use as frames`);
  fs.mkdirSync(framesDir, { recursive: true });
}

// Load custom frames if available
interface Frame {
  data: Buffer;
  contentType: string;
}

let customFrames: Frame[] = [];
try {
  const files = fs.readdirSync(framesDir)
    .filter(f => {
      const lower = f.toLowerCase();
      return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png');
    })
    .sort((a, b) => a.localeCompare(b));

  if (files.length > 0) {
    console.log(`[CAMERA:${port}] Loading ${files.length} custom frame(s) from ${framesDir}`);
    customFrames = files.map(f => {
      const filePath = path.join(framesDir, f);
      const data = fs.readFileSync(filePath);
      const contentType = f.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      return { data, contentType };
    });
    console.log(`[CAMERA:${port}] Loaded custom frames: ${files.join(', ')}`);
  }
} catch (error) {
  console.error(`[CAMERA:${port}] Error loading custom frames:`, error);
}

// Load default frame from embedded base64
const defaultFrame: Frame = {
  data: Buffer.from(DEFAULT_IMAGE_BASE64, 'base64'),
  contentType: 'image/jpeg'
};
console.log(`[CAMERA:${port}] Loaded default frame from embedded image`);

// Generate a frame - returns both data and content type
function generateFrame(): Frame {
  if (customFrames.length > 0) {
    // Cycle through custom frames
    const frameIndex = Math.floor(Date.now() / 1000) % customFrames.length;
    return customFrames[frameIndex];
  }

  // Fallback to default frame
  return defaultFrame;
}

// MJPEG stream endpoint
app.get("/", (req, res) => {
  console.log(`[CAMERA:${port}] New MJPEG stream connection from ${req.ip}`);

  // Set headers for MJPEG stream
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=--FRAME',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Connection': 'close'
  });

  // Send frames at specified FPS
  const intervalId = setInterval(() => {
    try {
      const frame = generateFrame();

      // Write multipart frame with boundary
      res.write('--FRAME\r\n');
      res.write(`Content-Type: ${frame.contentType}\r\n`);
      res.write(`Content-Length: ${frame.data.length}\r\n`);
      res.write('\r\n');
      res.write(frame.data);
      res.write('\r\n');
    } catch (error) {
      console.error(`[CAMERA:${port}] Error sending frame:`, error);
      clearInterval(intervalId);
      activeIntervals.delete(intervalId);
      res.end();
    }
  }, frameInterval);

  // Track this interval for graceful shutdown
  activeIntervals.add(intervalId);

  // Clean up on client disconnect
  req.on('close', () => {
    console.log(`[CAMERA:${port}] Client disconnected`);
    clearInterval(intervalId);
    activeIntervals.delete(intervalId);
  });

  res.on('error', (error) => {
    console.error(`[CAMERA:${port}] Response error:`, error);
    clearInterval(intervalId);
    activeIntervals.delete(intervalId);
  });
});

// Snapshot endpoint (single image)
app.get("/snapshot", (req, res) => {
  console.log(`[CAMERA:${port}] Snapshot request from ${req.ip}`);

  try {
    const frame = generateFrame();
    res.writeHead(200, {
      'Content-Type': frame.contentType,
      'Content-Length': frame.data.length,
      'Cache-Control': 'no-cache'
    });
    res.end(frame.data);
  } catch (error) {
    console.error(`[CAMERA:${port}] Error generating snapshot:`, error);
    res.status(500).json({ error: 'Failed to generate snapshot' });
  }
});

// Status endpoint
app.get("/status", (req, res) => {
  res.json({
    status: 'online',
    fps: fps,
    customFrames: customFrames.length,
    framesDir: framesDir
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`[CAMERA:${port}] ${req.method.toUpperCase()} ${req.url} Not found`);
  res.status(404).json({ error: 'Not Found' });
});

server.listen(port, () => {
  console.log(`[CAMERA:${port}] Mock camera server running on http://localhost:${port}`);
  console.log(`[CAMERA:${port}] MJPEG stream: http://localhost:${port}/`);
  console.log(`[CAMERA:${port}] Snapshot: http://localhost:${port}/snapshot`);
  console.log(`[CAMERA:${port}] Status: http://localhost:${port}/status`);
  console.log(`[CAMERA:${port}] FPS: ${fps}`);
  const framesString = customFrames.length > 0 ? `${customFrames.length} loaded` : 'none (using placeholder)';
  console.log(`[CAMERA:${port}] Custom frames: ${framesString}`);
  if (customFrames.length === 0) {
    console.log(`[CAMERA:${port}] Tip: Add .jpg or .png files to ${framesDir} to use custom frames`);
  }
});

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`\n[CAMERA:${port}] Received ${signal} signal. Shutting down gracefully...`);

  // Clear all active intervals
  console.log(`[CAMERA:${port}] Clearing ${activeIntervals.size} active stream(s)...`);
  activeIntervals.forEach(interval => clearInterval(interval));
  activeIntervals.clear();

  // Close the server
  server.close(() => {
    console.log(`[CAMERA:${port}] Server closed`);
    process.exit(0);
  });

  // Force exit after 5 seconds if graceful shutdown hangs
  setTimeout(() => {
    console.error(`[CAMERA:${port}] Could not close connections in time, forcefully shutting down`);
    process.exit(1);
  }, 5000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
