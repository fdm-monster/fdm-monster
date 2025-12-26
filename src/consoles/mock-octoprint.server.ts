import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { Server as WebSocketServer, WebSocket } from "ws";
import http from "http";
import { z } from "zod";
import * as console from "node:console";
import {
  connectionSuccessResponse,
  filesSuccessResponse,
  jobSuccessResponse,
  printerHistorySuccessResponse,
} from "@/consoles/utils/api-messages";
import { currentMessage } from "@/consoles/utils/ws-messages";

const port = process.argv[2] ? parseInt(process.argv[2]) : 1234;
const uploadsDir = path.join(__dirname, "uploads", `server-${port.toString()}`);
const WS_MESSAGE_INTERVAL = 1000; // Send message every 5 seconds by default

if (!fs.existsSync(uploadsDir)) {
  console.log(`[PORT ${port}] Creating uploads folder ${uploadsDir}`);
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
  console.log(`[PORT ${port}] New WebSocket connection established`);
  let authenticated = false;
  let messageInterval: NodeJS.Timeout | null = null;

  ws.on("message", async (message) => {
    try {
      const msgString = message.toString();
      if (msgString.includes("throttle")) {
        console.log(`Throttle message received ${msgString}`);
        return;
      }

      const json = JSON.parse(msgString);

      // Only process auth messages if not already authenticated
      if (!authenticated) {
        if (!json) {
          console.log(`[PORT ${port}] Invalid message JSON format`);
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

          console.log(`[PORT ${port}] Authentication successful for admin`);
          authenticated = true;

          // Add client to tracked clients map
          clients.set(clientId, { ws, authenticated });

          // Send message from the JSON file after 500ms
          setTimeout(async () => {
            try {
              ws.send(JSON.stringify(currentMessage));
            } catch (fileError) {
              console.error(`[PORT ${port}] Error reading message file:`, fileError);
              ws.send(JSON.stringify({ error: "Failed to read message content" }));
            }
          }, 500);

          // Set up interval to send current message periodically
          messageInterval = setupMessageInterval(ws, clientId, WS_MESSAGE_INTERVAL);
        } catch (validationError) {
          console.log(
            `[PORT ${port}] Authentication failed: Invalid token format ${JSON.stringify(json)} ${validationError}`,
          );
          ws.close();
        }
      } else {
        // Handle messages after authentication if needed
        console.log(`[PORT ${port}] Received message from authenticated client`);
      }
    } catch (error) {
      console.error(`[PORT ${port}] Error processing message:`, error);
      ws.close();
    }
  });

  ws.on("close", () => {
    console.log(`[PORT ${port}] WebSocket connection closed ${clientId}`);
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
          ws.send(JSON.stringify(currentMessage));
          console.log(`[PORT ${port}] Periodic message sent to client (ID: ${clientId})`);

          // Schedule next message with randomized interval
          messageInterval = setTimeout(sendPeriodicMessage, getRandomizedInterval(baseInterval));
        } else {
          // Clear timeout if connection is closed
          console.log(`[PORT ${port}] Stopped periodic messages for client (ID: ${clientId})`);
          messageInterval = null;
        }
      } catch (error) {
        console.error(`[PORT ${port}] Error sending periodic message:`, error);
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
  console.log(`[PORT ${port}] ${req.method.toUpperCase()} ${req.url} request`);
  res.status(200).json(printerHistorySuccessResponse);
});

app.get("/api/connection", async (req, res) => {
  console.log(`[PORT ${port}] ${req.method.toUpperCase()} ${req.url} request`);
  res.status(200).json(connectionSuccessResponse);
});

app.get("/api/job", async (req, res) => {
  console.log(`[PORT ${port}] ${req.method.toUpperCase()} ${req.url} request`);
  res.status(200).json(jobSuccessResponse);
});

app.get("/api/files/local", async (req, res) => {
  console.log(`[PORT ${port}] ${req.method.toUpperCase()} ${req.url} request`);
  res.status(200).json(filesSuccessResponse);
});

app.post("/api/login", async (req, res) => {
  res.send({
    _is_external_client: true,
    _login_mechanism: "apikey",
    session: "123123abc123123abc123123abc123ab",
  });
});

// @ts-ignore
app.post("/api/files/local", upload.single("file"), (req, res) => {
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

app.use((req, res) => {
  console.log(`[PORT ${port}] ${req.method.toUpperCase()} ${req.url} Not found`);
  res.status(404).json({ error: "Not Found" });
});

server.listen(port, () => {
  console.log(`[PORT ${port}] Server is running on http://localhost:${port}`);
  console.log(`[PORT ${port}] WebSocket server is available on ws://localhost:${port}`);
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
