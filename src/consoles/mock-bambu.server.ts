/**
 * Mock Bambu Lab 3D Printer Server
 *
 * This console script simulates a Bambu Lab printer with both FTP and MQTT interfaces.
 * It's designed for testing the bambu-js client library and printer integrations.
 *
 * Features:
 * - FTP server on port 990 (configurable) for file operations
 * - MQTT client that publishes printer state to device/{serial}/report
 * - Simulates a print job with progress, temperatures, and state changes
 * - Responds to MQTT commands on device/{serial}/request
 *
 * Usage:
 *   yarn console:mock-bambu [ftpPort] [mqttPort] [serial] [accessCode]
 *
 * Examples:
 *   yarn console:mock-bambu
 *   yarn console:mock-bambu 990 1883 01P00A000000001 12345678
 *
 * Defaults:
 *   FTP Port: 990
 *   MQTT Port: 1883
 *   Serial: 01P00A000000001
 *   Access Code: 12345678
 *   Username: bblp (standard for Bambu Lab printers)
 *
 * Prerequisites:
 *   - MQTT broker must be running on localhost:1883 (or specified port)
 *   - You can use Mosquitto or any other MQTT broker
 *
 * Testing with bambu-js:
 *   const printer = PrinterController.create({
 *     model: 'P1S',
 *     host: 'localhost',
 *     accessCode: '12345678',
 *     serial: '01P00A000000001'
 *   });
 *   await printer.connect();
 */

import FtpSrv from "ftp-srv";
import mqtt from "mqtt";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import selfsigned from "selfsigned";
import { SecureVersion } from "tls";

const DEFAULT_PORT = 990;
const DEFAULT_MQTT_PORT = 1883;
const DEFAULT_SERIAL = "01P00A000000001";
const DEFAULT_ACCESS_CODE = "12345678";
const MESSAGE_INTERVAL = 1000;

const port = process.argv[2] ? Number.parseInt(process.argv[2]) : DEFAULT_PORT;
const mqttPort = process.argv[3] ? Number.parseInt(process.argv[3]) : DEFAULT_MQTT_PORT;
const serial = process.argv[4] || DEFAULT_SERIAL;
const accessCode = process.argv[5] || DEFAULT_ACCESS_CODE;

console.log(`[BAMBU MOCK] Starting Bambu Lab mock server`);
console.log(`[BAMBU MOCK] Configuration:`);
console.log(`[BAMBU MOCK]   FTP Port: ${port}`);
console.log(`[BAMBU MOCK]   MQTT Broker: localhost:${mqttPort}`);
console.log(`[BAMBU MOCK]   Serial: ${serial}`);
console.log(`[BAMBU MOCK]   Access Code: ${accessCode}`);
console.log(`[BAMBU MOCK]   Username: bblp`);

const ftpDir = path.join(os.tmpdir(), "bambu-mock-ftp", serial);
const sdcardDir = path.join(ftpDir, "sdcard");

if (!fs.existsSync(ftpDir)) {
  console.log(`[BAMBU MOCK] Creating FTP directory: ${ftpDir}`);
  fs.mkdirSync(ftpDir, { recursive: true });
}

if (!fs.existsSync(sdcardDir)) {
  console.log(`[BAMBU MOCK] Creating sdcard directory: ${sdcardDir}`);
  fs.mkdirSync(sdcardDir, { recursive: true });
}

/**
 * Generate a self-signed certificate for TLS
 * Matches real Bambu Lab printer FTP behavior (implicit TLS on port 990)
 */
async function generateSelfSignedCert() {
  console.log(`[BAMBU MOCK] Generating self-signed certificate for TLS...`);

  const attrs = [
    { name: 'commonName', value: 'BambuLab Mock Printer' },
    { name: 'countryName', value: 'US' },
    { name: 'organizationName', value: 'Bambu Lab Mock' },
  ];

  const options = {
    days: 365,
    algorithm: 'sha256',
    keySize: 2048,
  };

  const pems = await selfsigned.generate(attrs, options);

  console.log(`[BAMBU MOCK] Self-signed certificate generated successfully`);

  return {
    key: pems.private,
    cert: pems.cert,
    // Add TLS options for better compatibility
    minVersion: 'TLSv1.2' satisfies SecureVersion as SecureVersion,
    ciphers: 'HIGH:!aNULL:!MD5',
  };
}

// Shared state between FTP and MQTT
let isPrinting = false;
let currentPrintFile = "";
let printProgress = 0;
let isPaused = false;
let nozzleTemp = 25;
let bedTemp = 25;
let printStartTime = 0;
const PRINT_DURATION = 20; // 20 seconds

// Generate TLS certificates and start server
(async () => {
  const tlsCerts = await generateSelfSignedCert();

const ftpServer = new FtpSrv({
  url: `ftp://0.0.0.0:${port}`,
  pasv_url: "127.0.0.1",
  pasv_min: 1024,
  pasv_max: 1048,
  tls: tlsCerts,
  anonymous: false,
  greeting: ["Welcome to Bambu Lab Mock FTP Server"],
});

ftpServer.on("login", ({ connection, username, password }, resolve, reject) => {
  console.log(`[BAMBU MOCK FTP] Login attempt - Username: ${username}`);

  if (username === "bblp" && password === accessCode) {
    console.log(`[BAMBU MOCK FTP] Authentication successful`);
    resolve({ root: ftpDir });
  } else {
    console.log(`[BAMBU MOCK FTP] Authentication failed`);
    reject(new Error("Invalid username or password"));
  }
});

ftpServer.on("client-error", ({ connection, context, error }) => {
  console.error(`[BAMBU MOCK FTP] Client error:`, error);
});

ftpServer.listen().then(() => {
  console.log(`[BAMBU MOCK FTP] FTP server is running on port ${port}`);
  console.log(`[BAMBU MOCK FTP] FTP directory: ${ftpDir}`);
});

const mqttClient = mqtt.connect(`mqtt://localhost:${mqttPort}`, {
  clientId: `bambu_mock_${serial}_${Date.now()}`,
});

mqttClient.on("connect", () => {
  console.log(`[BAMBU MOCK MQTT] Connected to MQTT broker at localhost:${mqttPort}`);
  console.log(`[BAMBU MOCK MQTT] Publishing to topic: device/${serial}/report`);

  const reportTopic = `device/${serial}/report`;
  const requestTopic = `device/${serial}/request`;

  mqttClient.subscribe(requestTopic, (err) => {
    if (err) {
      console.error(`[BAMBU MOCK MQTT] Failed to subscribe to ${requestTopic}:`, err);
    } else {
      console.log(`[BAMBU MOCK MQTT] Subscribed to topic: ${requestTopic}`);
    }
  });

  const publishState = () => {
    if (isPrinting && !isPaused) {
      // Calculate progress based on elapsed time (20 second print)
      const elapsedSeconds = (Date.now() - printStartTime) / 1000;
      printProgress = Math.min((elapsedSeconds / PRINT_DURATION) * 100, 100);

      // Heat up quickly at start, then maintain
      if (printProgress < 10) {
        nozzleTemp = Math.min(nozzleTemp + 10, 220);
        bedTemp = Math.min(bedTemp + 5, 60);
      } else {
        nozzleTemp = 220;
        bedTemp = 60;
      }

      if (printProgress >= 100) {
        isPrinting = false;
        printProgress = 0;
        currentPrintFile = "";
        console.log(`[BAMBU MOCK MQTT] Print completed`);
      }
    }

    if (!isPrinting && nozzleTemp > 25) {
      nozzleTemp = Math.max(nozzleTemp - 2, 25);
      bedTemp = Math.max(bedTemp - 1, 25);
    }

    const state = {
      print: {
        nozzle_temper: Math.round(nozzleTemp),
        nozzle_target_temper: isPrinting ? 220 : 0,
        bed_temper: Math.round(bedTemp),
        bed_target_temper: isPrinting ? 60 : 0,
        chamber_temper: 30,
        mc_percent: Math.round(printProgress),
        mc_remaining_time: isPrinting ? Math.round((PRINT_DURATION - (Date.now() - printStartTime) / 1000)) : 0,
        mc_print_stage: isPrinting ? (isPaused ? "paused" : "printing") : "idle",
        gcode_state: isPrinting ? "PRINTING" : "IDLE",
        gcode_file: isPrinting ? currentPrintFile : "",
        wifi_signal: "-45dBm",
        layer_num: isPrinting ? Math.floor(printProgress / 2) : 0,
        total_layer_num: isPrinting ? 50 : 0,
        subtask_name: isPrinting ? currentPrintFile : "",
        heatbreak_fan_speed: isPrinting ? "5000" : "0",
        cooling_fan_speed: isPrinting ? "8000" : "0",
        big_fan1_speed: isPrinting ? "3000" : "0",
        big_fan2_speed: isPrinting ? "3000" : "0",
        spd_lvl: 2,
        spd_mag: 100,
        print_error: 0,
        lifecycle: "product",
        command: "push_status",
        msg: 0,
        sequence_id: String(Date.now()),
      },
    };

    mqttClient.publish(reportTopic, JSON.stringify(state), { qos: 0 }, (err) => {
      if (err) {
        console.error(`[BAMBU MOCK MQTT] Failed to publish state:`, err);
      }
    });
  };

  setInterval(publishState, MESSAGE_INTERVAL);

  publishState();
});

mqttClient.on("message", (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    console.log(`[BAMBU MOCK MQTT] Received command on ${topic}:`, JSON.stringify(payload));

    if (payload.print && payload.print.command) {
      const command = payload.print.command;
      console.log(`[BAMBU MOCK MQTT] Processing command: ${command}`);

      if (command === "project_file" || command === "start") {
        // Extract filename from command
        const filename = payload.print.param || payload.print.subtask_name || "unknown.gcode";

        // Validate file extension (only .gcode and .3mf files)
        if (filename.endsWith('.gcode') || filename.endsWith('.3mf')) {
          isPrinting = true;
          isPaused = false;
          printStartTime = Date.now();
          printProgress = 0;
          currentPrintFile = filename;
          console.log(`[BAMBU MOCK MQTT] Starting print: ${filename} (20 second duration)`);
        } else {
          console.log(`[BAMBU MOCK MQTT] Rejected print - invalid file extension: ${filename}`);
        }
      } else if (command === "pause") {
        if (isPrinting) {
          isPaused = true;
          console.log(`[BAMBU MOCK MQTT] Pausing print`);
        }
      } else if (command === "resume") {
        if (isPrinting && isPaused) {
          isPaused = false;
          // Adjust start time to account for pause duration
          const pausedProgress = printProgress;
          printStartTime = Date.now() - (pausedProgress / 100 * PRINT_DURATION * 1000);
          console.log(`[BAMBU MOCK MQTT] Resuming print from ${Math.round(pausedProgress)}%`);
        }
      } else if (command === "stop") {
        if (isPrinting) {
          isPrinting = false;
          isPaused = false;
          printProgress = 0;
          currentPrintFile = "";
          console.log(`[BAMBU MOCK MQTT] Stopping print`);
        }
      }
    }
  } catch (error) {
    console.error(`[BAMBU MOCK MQTT] Error processing message:`, error);
  }
});

mqttClient.on("error", (error) => {
  console.error(`[BAMBU MOCK MQTT] MQTT error:`, error);
});

mqttClient.on("disconnect", () => {
  console.log(`[BAMBU MOCK MQTT] Disconnected from MQTT broker`);
});

process.on("SIGINT", async () => {
  console.log("\n[BAMBU MOCK] Shutting down gracefully...");

  if (mqttClient.connected) {
    console.log("[BAMBU MOCK MQTT] Disconnecting from MQTT broker...");
    await mqttClient.endAsync();
  }

  console.log("[BAMBU MOCK FTP] Closing FTP server...");
  await ftpServer.close();

  console.log("[BAMBU MOCK] Cleanup complete. Exiting.");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n[BAMBU MOCK] Received SIGTERM. Shutting down...");

  if (mqttClient.connected) {
    await mqttClient.endAsync();
  }

  await ftpServer.close();
  process.exit(0);
});

console.log(`[BAMBU MOCK] Mock server is running. Press Ctrl+C to stop.`);
})().catch((error) => {
  console.error('[BAMBU MOCK] Fatal error during startup:', error);
  process.exit(1);
});
