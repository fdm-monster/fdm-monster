import express from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { Server as WebSocketServer, WebSocket } from "ws";
import http from "node:http";
import { z } from "zod";
import * as console from "node:console";
import {
  connectionSuccessResponse,
  filesSuccessResponse,
  printerHistorySuccessResponse,
} from "@/consoles/utils/api-messages";

// Shared print state (similar to Bambu mock)
let isPrinting = false;
let isPaused = false;
let isFinished = false; // Transient state to signal completion
let currentPrintFile = "";
let printProgress = 0;
let printStartTime = 0;
const PRINT_DURATION = 20; // 20 seconds for simulation

// Generate dynamic WebSocket "current" message based on print state
function getCurrentMessage() {
  updatePrintProgress();

  const elapsedSeconds = isPrinting ? (Date.now() - printStartTime) / 1000 : 0;
  const remainingSeconds = isPrinting ? Math.max(0, PRINT_DURATION - elapsedSeconds) : null;

  // Determine state text
  let stateText = "Operational";

  if (isPrinting && isPaused) stateText = "Paused";
  else if (isPrinting) stateText = "Printing";

  // Use finishedFileName for the finished state, otherwise current file
  const fileName = isFinished ? finishedFileName : (currentPrintFile || null);
  const hasFile = isPrinting || isFinished;

  return {
    current: {
      state: {
        text: stateText,
        flags: {
          operational: true,
          printing: isPrinting && !isPaused,
          cancelling: false,
          pausing: false,
          resuming: false,
          finishing: false,
          closedOrError: false,
          error: false,
          paused: isPaused,
          ready: !isPrinting && !isFinished,
          sdReady: true,
          finished: isFinished,
        },
        error: "",
      },
      job: {
        file: {
          name: fileName,
          path: fileName,
          display: fileName,
          origin: hasFile ? "local" : null,
          size: hasFile ? 1024000 : null,
          date: hasFile ? printStartTime / 1000 : null,
        },
        estimatedPrintTime: hasFile ? PRINT_DURATION : null,
        averagePrintTime: null,
        lastPrintTime: null,
        filament: hasFile ? { tool0: { length: 1000, volume: 2.4 } } : null,
        user: null,
      },
      currentZ: isPrinting ? Math.floor(printProgress / 5) : null,
      progress: {
        completion: isFinished ? 100 : (isPrinting ? printProgress : null),
        filepos: hasFile ? Math.floor(((isFinished ? 100 : printProgress) / 100) * 1024000) : null,
        printTime: isFinished ? PRINT_DURATION : (isPrinting ? Math.floor(elapsedSeconds) : null),
        printTimeLeft: isFinished ? 0 : (remainingSeconds !== null ? Math.floor(remainingSeconds) : null),
        printTimeLeftOrigin: hasFile ? "estimate" : null,
      },
      offsets: {},
      resends: { count: 0, transmitted: 8, ratio: 0 },
      serverTime: Date.now() / 1000,
      temps: [],
      busyFiles: [],
      logs: [],
      messages: [],
    },
  };
}

// Helper to update progress and generate job response
let finishedFileName = ""; // Store filename for finished state
function updatePrintProgress() {
  // Clear finished state after it's been sent
  if (isFinished) {
    isFinished = false;
    finishedFileName = "";
    currentPrintFile = "";
    printProgress = 0;
    return;
  }

  if (isPrinting && !isPaused) {
    const elapsedSeconds = (Date.now() - printStartTime) / 1000;
    printProgress = Math.min((elapsedSeconds / PRINT_DURATION) * 100, 100);

    if (printProgress >= 100) {
      // Set finished state before clearing print state
      isFinished = true;
      finishedFileName = currentPrintFile;
      isPrinting = false;
      printProgress = 100;
      console.log(`[PORT] Print completed: ${currentPrintFile}`);
    }
  }
}

function getJobResponse() {
  updatePrintProgress();

  const fileName = isFinished ? finishedFileName : currentPrintFile;
  const hasJob = isPrinting || isFinished;

  if (!hasJob) {
    return {
      job: { file: { name: null, origin: null, size: null, date: null }, estimatedPrintTime: null, filament: null },
      progress: { completion: null, filepos: null, printTime: null, printTimeLeft: null },
      state: "Operational",
    };
  }

  const elapsedSeconds = (Date.now() - printStartTime) / 1000;
  const remainingSeconds = Math.max(0, PRINT_DURATION - elapsedSeconds);

  let state = "Printing";
  if (isFinished) state = "Operational";
  else if (isPaused) state = "Paused";

  return {
    job: {
      file: { name: fileName, origin: "local", size: 1024000, date: printStartTime / 1000 },
      estimatedPrintTime: PRINT_DURATION,
      filament: { tool0: { length: 1000, volume: 2.4 } },
    },
    progress: {
      completion: isFinished ? 100 : printProgress,
      filepos: Math.floor(((isFinished ? 100 : printProgress) / 100) * 1024000),
      printTime: isFinished ? PRINT_DURATION : Math.floor(elapsedSeconds),
      printTimeLeft: isFinished ? 0 : Math.floor(remainingSeconds),
    },
    state,
  };
}

const port = process.argv[2] ? Number.parseInt(process.argv[2]) : 1234;
const uploadsDir = path.join(__dirname, "uploads", `server-${ port.toString() }`);
const WS_MESSAGE_INTERVAL = 1000; // Send message every 5 seconds by default

if (!fs.existsSync(uploadsDir)) {
  console.log(`[PORT ${ port }] Creating uploads folder ${ uploadsDir }`);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Clean up on startup
cleanupUploads();

const upload = multer({ dest: uploadsDir });

const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocketServer({ server });

// Store all active connections for broadcasting
const clients = new Map();

// Zod schema for auth token
const AuthSchema = z.object({
  command: z.literal("auth"),
  user: z.literal("admin"),
  token: z.string().regex(/^[a-zA-Z0-9]{32}$/),
});

// WebSocket connection handler
wss.on("connection", (ws) => {
  const clientId = Date.now().toString();
  console.log(`[PORT ${ port }] New WebSocket connection established`);
  let authenticated = false;
  let messageInterval: NodeJS.Timeout | null = null;

  ws.on("message", async (message) => {
    try {
      const msgString = message.toString();
      if (msgString.includes("throttle")) {
        console.log(`Throttle message received ${ msgString }`);
        return;
      }

      const json = JSON.parse(msgString);

      // Only process auth messages if not already authenticated
      if (authenticated) {
        // Handle messages after authentication if needed
        console.log(`[PORT ${ port }] Received message from authenticated client`);
        return;
      }

      if (!json) {
        console.log(`[PORT ${ port }] Invalid message JSON format`);
        ws.close();
        return;
      }

      try {
        // Validate the auth message format
        const parts = json.auth.split(":");
        AuthSchema.parse({
          command: "auth",
          user: parts[0],
          token: parts[1],
        });

        console.log(`[PORT ${ port }] Authentication successful for admin`);
        authenticated = true;

        // Add client to tracked clients map
        clients.set(clientId, { ws, authenticated });

        // Send message from the JSON file after 500ms
        setTimeout(async () => {
          try {
            ws.send(JSON.stringify(getCurrentMessage()));
          } catch (fileError) {
            console.error(`[PORT ${ port }] Error reading message file:`, fileError);
            ws.send(JSON.stringify({ error: "Failed to read message content" }));
          }
        }, 500);

        // Set up interval to send current message periodically
        messageInterval = setupMessageInterval(ws, clientId, WS_MESSAGE_INTERVAL);
      } catch (validationError) {
        console.log(
          `[PORT ${ port }] Authentication failed: Invalid token format ${ JSON.stringify(json) } ${ validationError }`,
        );
        ws.close();
      }

    } catch (error) {
      console.error(`[PORT ${ port }] Error processing message:`, error);
      ws.close();
    }
  });

  ws.on("close", () => {
    console.log(`[PORT ${ port }] WebSocket connection closed ${ clientId }`);
    // Clear interval when connection closes
    if (messageInterval) {
      clearInterval(messageInterval);
      messageInterval = null;
    }
    // Remove client from tracked clients
    clients.delete(clientId);
  });

  // Set up interval to send current message periodically with randomization
  const setupMessageInterval = (ws: WebSocket, clientId: string, baseInterval: number) => {
    // Clear any existing interval
    if (messageInterval) {
      clearInterval(messageInterval);
      messageInterval = null;
    }

    // Function to calculate randomized interval
    const getRandomizedInterval = (baseMs: number) => {
      // Add random variation of ±15% to prevent synchronized load
      const variationFactor = 0.85 + Math.random() * 0.3; // Range: 0.85 to 1.15
      return Math.floor(baseMs * variationFactor);
    };

    // Function to send a message and schedule the next one
    const sendPeriodicMessage = () => {
      try {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify(getCurrentMessage()));
          console.log(`[PORT ${ port }] Periodic message sent to client (ID: ${ clientId })`);

          // Schedule next message with randomized interval
          messageInterval = setTimeout(sendPeriodicMessage, getRandomizedInterval(baseInterval));
        } else {
          // Clear timeout if connection is closed
          console.log(`[PORT ${ port }] Stopped periodic messages for client (ID: ${ clientId })`);
          messageInterval = null;
        }
      } catch (error) {
        console.error(`[PORT ${ port }] Error sending periodic message:`, error);
        // No need to clear timeout as we're using recursive setTimeout
        messageInterval = null;
      }
    };

    // Initial send with randomized delay
    messageInterval = setTimeout(sendPeriodicMessage, getRandomizedInterval(baseInterval));
    return messageInterval;
  };
});

app.get("/api/version", async (req, res) => {
  res.send({
    server: "1",
    api: "2",
    text: "3",
  });
});

app.get("/api/currentuser", async (req, res) => {
  res.send({
    name: "admin",
    permissions: [],
    groups: [],
  });
});

app.get("/api/printer", async (req, res) => {
  console.log(`[PORT ${ port }] ${ req.method.toUpperCase() } ${ req.url } request`);
  res.status(200).json(printerHistorySuccessResponse);
});

app.get("/api/connection", async (req, res) => {
  console.log(`[PORT ${ port }] ${ req.method.toUpperCase() } ${ req.url } request`);
  res.status(200).json(connectionSuccessResponse);
});

app.get("/api/job", async (req, res) => {
  console.log(`[PORT ${ port }] ${ req.method.toUpperCase() } ${ req.url } request`);
  res.status(200).json(getJobResponse());
});

// POST /api/job - Handle job commands (pause, resume, cancel)
app.post("/api/job", express.json(), async (req, res) => {
  const { command, action } = req.body;
  console.log(`[PORT ${ port }] POST /api/job - command: ${ command }, action: ${ action }`);

  if (command === "cancel") {
    if (isPrinting) {
      isPrinting = false;
      isPaused = false;
      printProgress = 0;
      currentPrintFile = "";
      console.log(`[PORT ${ port }] Print cancelled`);
    }
    return res.status(204).send();
  }

  if (command === "pause") {
    if (action === "pause" && isPrinting && !isPaused) {
      isPaused = true;
      console.log(`[PORT ${ port }] Print paused at ${ Math.round(printProgress) }%`);
    } else if (action === "resume" && isPrinting && isPaused) {
      isPaused = false;
      // Adjust start time to account for pause duration
      const pausedProgress = printProgress;
      printStartTime = Date.now() - (pausedProgress / 100) * PRINT_DURATION * 1000;
      console.log(`[PORT ${ port }] Print resumed from ${ Math.round(pausedProgress) }%`);
    }
    return res.status(204).send();
  }

  res.status(400).json({ error: "Unknown command" });
});

app.get("/api/files/local", async (req, res) => {
  console.log(`[PORT ${ port }] ${ req.method.toUpperCase() } ${ req.url } request`);
  res.status(200).json(filesSuccessResponse);
});

app.post("/api/login", async (req, res) => {
  res.send({
    _is_external_client: true,
    _login_mechanism: "apikey",
    session: "123123abc123123abc123123abc123ab",
  });
});

// POST /api/files/local/:path - Select file and optionally start print (postSelectPrintFile)
app.post("/api/files/local/:path(*)", express.json(), (req, res) => {
  const filePath = req.params["path(*)"];
  const { command, print } = req.body;

  console.log(`[PORT ${ port }] POST /api/files/local/${ filePath } - command: ${ command }, print: ${ print }`);

  if (command === "select") {
    // Validate file extension
    if (!filePath.endsWith(".gcode") && !filePath.endsWith(".bgcode") && !filePath.endsWith(".3mf")) {
      console.log(`[PORT ${ port }] Rejected - invalid file extension: ${ filePath }`);
      return res.status(400).json({ error: "Invalid file extension. Only .gcode, .bgcode, and .3mf files are supported" });
    }

    currentPrintFile = filePath;
    console.log(`[PORT ${ port }] File selected: ${ filePath }`);

    // If print=true, start printing immediately
    if (print === true) {
      isPrinting = true;
      isPaused = false;
      printStartTime = Date.now();
      printProgress = 0;
      console.log(`[PORT ${ port }] Starting print: ${ filePath } (${ PRINT_DURATION } second duration)`);
    }

    return res.status(204).send();
  }

  if (command === "move") {
    console.log(`[PORT ${ port }] Move command received for: ${ filePath }`);
    return res.status(204).send();
  }

  res.status(400).json({ error: "Unknown command" });
});

// @ts-ignore
app.post("/api/files/local", upload.single("file"), (req, res) => {
  const { print } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "Missing file" });
  }

  console.log(`[PORT ${ port }] Received file:`, file.originalname);
  console.log(`[PORT ${ port }] File size:`, file.size);
  console.log(`[PORT ${ port }] MIME type:`, file.mimetype);
  console.log(`[PORT ${ port }] print:`, print, `\n-----`);

  // If print=true, start printing immediately (OctoPrint select is implicit)
  if (print === "true") {
    currentPrintFile = file.originalname;
    isPrinting = true;
    isPaused = false;
    printStartTime = Date.now();
    printProgress = 0;
    console.log(`[PORT ${ port }] Starting print: ${ file.originalname } (${ PRINT_DURATION } second duration)`);
  }

  res.json({
    done: true,
    files: {
      local: {
        name: file.originalname,
        origin: "local",
        refs: { resource: `/api/files/local/${ file.originalname }` },
      },
    },
  });
});

app.use((req, res) => {
  console.log(`[PORT ${ port }] ${ req.method.toUpperCase() } ${ req.url } Not found`);
  res.status(404).json({ error: "Not Found" });
});

server.listen(port, () => {
  console.log(`[PORT ${ port }] Server is running on http://localhost:${ port }`);
  console.log(`[PORT ${ port }] WebSocket server is available on ws://localhost:${ port }`);
});

// Clean up on server shutdown
process.on("SIGINT", () => {
  console.log("\n[PORT ${port}] Received SIGINT signal (Ctrl+C). Shutting down gracefully...");
  cleanupUploads();
  server.close(() => {
    console.log("[PORT ${port}] Server closed");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\n[PORT ${port}] Received SIGTERM signal. Shutting down gracefully...");
  cleanupUploads();
  server.close(() => {
    console.log("[PORT ${port}] Server closed");
    process.exit(0);
  });
});

function cleanupUploads() {
  try {
    console.log(`[PORT ${ port }] Cleaning up uploads folder...`);
    const files = fs.readdirSync(uploadsDir);

    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      fs.unlinkSync(filePath);
      console.log(`[PORT ${ port }] Deleted: ${ filePath }`);
    }

    console.log(`[PORT ${ port }] Uploads folder cleanup complete`);
  } catch (error) {
    console.error(`[PORT ${ port }] Error cleaning up uploads folder:`, error);
  }
}
