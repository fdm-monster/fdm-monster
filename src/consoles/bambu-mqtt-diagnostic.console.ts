/**
 * Bambu MQTT Diagnostic Console
 *
 * A diagnostic tool for testing and debugging Bambu Lab printer MQTT connections.
 * Useful for diagnosing connection issues with Bambu printers.
 *
 * Usage:
 *   yarn console:bambu-mqtt-diagnostic
 *
 * Environment variables (via .env file):
 *   BAMBU_HOST=<printer_ip>
 *   BAMBU_ACCESS_CODE=<8_character_access_code>
 *   BAMBU_SERIAL=<printer_serial_number>
 *
 * Or via command line arguments:
 *   yarn console:bambu-mqtt-diagnostic <host> <accessCode> <serial>
 *
 * Examples:
 *   yarn console:bambu-mqtt-diagnostic
 *   yarn console:bambu-mqtt-diagnostic 192.168.1.100 12345678 01P00A000000001
 */

import mqtt, { MqttClient } from "mqtt";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

// Configuration from env or args
const host = process.argv[2] || process.env.BAMBU_HOST;
const accessCode = process.argv[3] || process.env.BAMBU_ACCESS_CODE;
const serial = process.argv[4] || process.env.BAMBU_SERIAL;

if (!host || !accessCode || !serial) {
  console.error("Missing required configuration.");
  console.error("");
  console.error("Please provide configuration via .env file:");
  console.error("  BAMBU_HOST=<printer_ip>");
  console.error("  BAMBU_ACCESS_CODE=<8_character_access_code>");
  console.error("  BAMBU_SERIAL=<printer_serial_number>");
  console.error("");
  console.error("Or via command line arguments:");
  console.error("  yarn console:bambu-mqtt-diagnostic <host> <accessCode> <serial>");
  process.exit(1);
}

const MQTT_PORT = 8883;
const MQTT_USERNAME = "bblp";
const RECONNECT_PERIOD = 5000;
const COMMAND_TIMEOUT = 10000;

// State
let client: MqttClient | null = null;
let lastState: any = null;
let messageCount = 0;
let lastMessageTime: Date | null = null;
let connectionStartTime: Date | null = null;
let sequenceIdCounter = 10;
let isVerbose = false;

// MQTT Dump
let dumpEnabled = true; // Enable by default
let dumpStream: fs.WriteStream | null = null;
let dumpFilePath: string | null = null;
let dumpMessageCount = 0;

// Initialize dump file
function initDumpFile(): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dumpDir = path.join(process.cwd(), "mqtt-dumps");

  // Create dumps directory if it doesn't exist
  if (!fs.existsSync(dumpDir)) {
    fs.mkdirSync(dumpDir, { recursive: true });
  }

  dumpFilePath = path.join(dumpDir, `bambu-mqtt-dump-${timestamp}.jsonl`);
  dumpStream = fs.createWriteStream(dumpFilePath, { flags: "a" });

  // Write session header
  const header = {
    _type: "session_start",
    _timestamp: new Date().toISOString(),
    host,
    serial,
    port: MQTT_PORT,
  };
  dumpStream.write(JSON.stringify(header) + "\n");

  log(`MQTT dump file: ${dumpFilePath}`, "INFO");
}

// Write to dump file
function writeToDump(direction: "IN" | "OUT", topic: string, payload: any): void {
  if (!dumpEnabled || !dumpStream) return;

  dumpMessageCount++;
  const entry = {
    _seq: dumpMessageCount,
    _timestamp: new Date().toISOString(),
    _direction: direction,
    topic,
    payload,
  };

  dumpStream.write(JSON.stringify(entry) + "\n");
}

// Close dump file
function closeDumpFile(): void {
  if (dumpStream) {
    const footer = {
      _type: "session_end",
      _timestamp: new Date().toISOString(),
      totalMessages: dumpMessageCount,
    };
    dumpStream.write(JSON.stringify(footer) + "\n");
    dumpStream.end();
    dumpStream = null;
    log(`Dump file closed: ${dumpFilePath} (${dumpMessageCount} messages)`, "INFO");
  }
}

// Logging with timestamps
function log(message: string, level: "INFO" | "WARN" | "ERROR" | "DEBUG" = "INFO") {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  if (level === "ERROR") {
    console.error(`${prefix} ${message}`);
  } else if (level === "DEBUG") {
    if (isVerbose) {
      console.log(`${prefix} ${message}`);
    }
  } else {
    console.log(`${prefix} ${message}`);
  }
}

// Clear screen helper
function clearScreen() {
  process.stdout.write("\x1B[2J\x1B[0f");
}

// Format temperature display
function formatTemp(current: number | undefined, target: number | undefined): string {
  if (current === undefined || current === null) return "N/A";
  const curr = current.toFixed(1).padStart(6);
  if (target !== undefined && target !== null && target > 0) {
    return `${curr}C -> ${target.toFixed(1)}C`;
  }
  return `${curr}C`;
}

// Format time duration
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

// Format remaining time (from minutes)
function formatTimeRemaining(minutes: number | undefined): string {
  if (minutes === undefined || minutes === null || minutes <= 0) return "N/A";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

// Create a progress bar
function createProgressBar(percent: number, width: number): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return "[" + "=".repeat(filled) + "-".repeat(empty) + "]";
}

// Print connection diagnostics
function printDiagnostics() {
  console.log("\n==================================================================");
  console.log("                    BAMBU MQTT DIAGNOSTIC                        ");
  console.log("==================================================================");
  console.log(`  Host:           ${host}:${MQTT_PORT}`);
  console.log(`  Serial:         ${serial}`);
  console.log(`  Access Code:    ${"*".repeat(accessCode?.length || 0)}`);
  console.log(`  Topic:          device/${serial}/report`);
  console.log("------------------------------------------------------------------");
  console.log(`  Connection:     ${client?.connected ? "CONNECTED" : "DISCONNECTED"}`);
  if (connectionStartTime) {
    console.log(`  Uptime:         ${formatDuration(Date.now() - connectionStartTime.getTime())}`);
  }
  console.log(`  Messages:       ${messageCount}`);
  if (lastMessageTime) {
    console.log(`  Last Message:   ${lastMessageTime.toISOString()}`);
    console.log(`  Time Since:     ${formatDuration(Date.now() - lastMessageTime.getTime())} ago`);
  }
  console.log("------------------------------------------------------------------");
  console.log(`  Dump Enabled:   ${dumpEnabled ? "YES" : "NO"}`);
  if (dumpFilePath) {
    console.log(`  Dump File:      ${path.basename(dumpFilePath)}`);
    console.log(`  Dumped Msgs:    ${dumpMessageCount}`);
  }
  console.log("==================================================================");
}

// Print printer state
function printState() {
  if (!lastState) {
    console.log("\n  Waiting for printer state...\n");
    return;
  }

  console.log("\n------------------------------------------------------------------");
  console.log("                        PRINTER STATE                            ");
  console.log("------------------------------------------------------------------");

  // Basic status
  const gcodeState = lastState.gcode_state || "UNKNOWN";
  const gcodeFile = lastState.gcode_file || lastState.subtask_name || "None";
  const progress = lastState.mc_percent;
  const remaining = lastState.mc_remaining_time;
  const stage = lastState.mc_print_stage || "N/A";

  console.log(`  Status:         ${gcodeState}`);
  console.log(`  Stage:          ${stage}`);
  console.log(`  File:           ${gcodeFile.substring(0, 50)}`);

  if (progress !== undefined && progress !== null) {
    const progressBar = createProgressBar(progress, 30);
    console.log(`  Progress:       ${progressBar} ${progress.toFixed(1)}%`);
  }

  if (remaining !== undefined && remaining !== null && remaining > 0) {
    console.log(`  Remaining:      ${formatTimeRemaining(remaining)}`);
  }

  // Layer info
  if (lastState.layer_num !== undefined && lastState.total_layer_num !== undefined) {
    console.log(`  Layer:          ${lastState.layer_num} / ${lastState.total_layer_num}`);
  }

  // Temperatures
  console.log("------------------------------------------------------------------");
  console.log("  TEMPERATURES");
  console.log(`    Nozzle:       ${formatTemp(lastState.nozzle_temper, lastState.nozzle_target_temper)}`);
  console.log(`    Bed:          ${formatTemp(lastState.bed_temper, lastState.bed_target_temper)}`);
  if (lastState.chamber_temper !== undefined) {
    console.log(`    Chamber:      ${formatTemp(lastState.chamber_temper, undefined)}`);
  }

  // Fan speeds
  console.log("------------------------------------------------------------------");
  console.log("  FANS");
  console.log(`    Heatbreak:    ${lastState.heatbreak_fan_speed ?? "N/A"}`);
  console.log(`    Cooling:      ${lastState.cooling_fan_speed ?? "N/A"}`);
  console.log(`    Big Fan 1:    ${lastState.big_fan1_speed ?? "N/A"}`);
  console.log(`    Big Fan 2:    ${lastState.big_fan2_speed ?? "N/A"}`);

  // Speed
  if (lastState.spd_lvl !== undefined) {
    const speedNames: Record<number, string> = { 1: "Silent", 2: "Standard", 3: "Sport", 4: "Ludicrous" };
    console.log("------------------------------------------------------------------");
    console.log(`  Speed Level:    ${speedNames[lastState.spd_lvl] || lastState.spd_lvl} (${lastState.spd_mag ?? 100}%)`);
  }

  // WiFi
  if (lastState.wifi_signal) {
    console.log("------------------------------------------------------------------");
    console.log(`  WiFi Signal:    ${lastState.wifi_signal}`);
  }

  // Print error
  if (lastState.print_error !== undefined && lastState.print_error !== 0) {
    console.log("------------------------------------------------------------------");
    console.log(`  ERROR CODE:     ${lastState.print_error}`);
  }

  // Lifecycle
  if (lastState.lifecycle) {
    console.log(`  Lifecycle:      ${lastState.lifecycle}`);
  }

  console.log("==================================================================");
}

// Print command menu
function printMenu() {
  console.log("\n------------------------------------------------------------------");
  console.log("  COMMANDS");
  console.log("------------------------------------------------------------------");
  console.log("  [r] Refresh (send pushall)    [s] Show state");
  console.log("  [d] Show diagnostics          [v] Toggle verbose mode");
  console.log("  [c] Clear screen              [j] Show raw JSON");
  console.log("  [p] Pause print               [u] Resume print");
  console.log("  [x] Stop print                [g] Send GCode");
  console.log(`  [l] Toggle dump (${dumpEnabled ? "ON" : "OFF"})           [f] Show dump file path`);
  console.log("  [q] Quit");
  console.log("------------------------------------------------------------------");
  process.stdout.write("\n> ");
}

// Send pushall command to request current state
async function sendPushall(): Promise<void> {
  if (!client?.connected) {
    log("Cannot send pushall: not connected", "ERROR");
    return;
  }

  const payload = {
    pushing: {
      sequence_id: sequenceIdCounter++,
      command: "pushall",
      version: 1,
      push_target: 1,
    },
  };

  const topic = `device/${serial}/report`;
  const message = JSON.stringify(payload);

  log(`Sending pushall command (seq: ${payload.pushing.sequence_id})`, "DEBUG");
  writeToDump("OUT", topic, payload);

  client.publish(topic, message, { qos: 0 }, (err) => {
    if (err) {
      log(`Failed to send pushall: ${err.message}`, "ERROR");
    } else {
      log("Pushall command sent", "INFO");
    }
  });
}

// Send a print command
async function sendPrintCommand(command: string, params?: Record<string, any>): Promise<void> {
  if (!client?.connected) {
    log("Cannot send command: not connected", "ERROR");
    return;
  }

  const payload: Record<string, any> = {
    print: {
      command,
      sequence_id: sequenceIdCounter++,
      ...params,
    },
  };

  const topic = `device/${serial}/report`;
  const message = JSON.stringify(payload);

  log(`Sending command: ${command} (seq: ${payload.print.sequence_id})`, "DEBUG");
  writeToDump("OUT", topic, payload);

  client.publish(topic, message, { qos: 0 }, (err) => {
    if (err) {
      log(`Failed to send command: ${err.message}`, "ERROR");
    } else {
      log(`Command '${command}' sent`, "INFO");
    }
  });
}

// Send GCode
async function sendGcode(gcode: string): Promise<void> {
  await sendPrintCommand("gcode_line", { param: gcode });
}

// Handle incoming MQTT message
function handleMessage(topic: string, message: Buffer): void {
  messageCount++;
  lastMessageTime = new Date();

  try {
    const payload = JSON.parse(message.toString());

    // Write to dump file
    writeToDump("IN", topic, payload);

    // Skip logging our own commands (push_status responses)
    if (payload.print?.command === "push_status") {
      // This is a status update
      lastState = payload.print;
      log(`State update received (gcode_state: ${lastState.gcode_state || "N/A"})`, "DEBUG");
    } else if (payload.print) {
      lastState = payload.print;
      log(`Print data received`, "DEBUG");
    } else if (payload.pushing) {
      log(`Pushing response received (seq: ${payload.pushing.sequence_id})`, "DEBUG");
    } else {
      log(`Unknown message type received`, "DEBUG");
    }

    if (isVerbose) {
      log(`Raw message: ${JSON.stringify(payload).substring(0, 200)}...`, "DEBUG");
    }
  } catch (error) {
    log(`Failed to parse message: ${error}`, "ERROR");
    // Still try to dump raw message on parse error
    writeToDump("IN", topic, { _raw: message.toString(), _error: String(error) });
  }
}

// Connect to the printer
function connect(): void {
  const mqttUrl = `mqtts://${host}:${MQTT_PORT}`;
  const topic = `device/${serial}/report`;

  // Initialize dump file
  if (dumpEnabled) {
    initDumpFile();
  }

  log(`Connecting to ${mqttUrl}...`, "INFO");
  log(`Username: ${MQTT_USERNAME}`, "DEBUG");
  log(`Topic: ${topic}`, "DEBUG");

  client = mqtt.connect(mqttUrl, {
    username: MQTT_USERNAME,
    password: accessCode,
    reconnectPeriod: RECONNECT_PERIOD,
    rejectUnauthorized: false,
    connectTimeout: 30000,
  });

  client.on("connect", () => {
    connectionStartTime = new Date();
    log("MQTT connected successfully", "INFO");

    client!.subscribe(topic, { qos: 0 }, (err) => {
      if (err) {
        log(`Failed to subscribe: ${err.message}`, "ERROR");
      } else {
        log(`Subscribed to ${topic}`, "INFO");

        // Send initial pushall to get current state
        setTimeout(() => {
          sendPushall();
        }, 500);
      }
    });
  });

  client.on("message", (topic, message) => {
    handleMessage(topic, message);
  });

  client.on("error", (error) => {
    log(`MQTT error: ${error.message}`, "ERROR");
  });

  client.on("disconnect", () => {
    log("MQTT disconnected", "WARN");
  });

  client.on("reconnect", () => {
    log("MQTT attempting to reconnect...", "INFO");
  });

  client.on("close", () => {
    log("MQTT connection closed", "WARN");
  });

  client.on("offline", () => {
    log("MQTT client offline", "WARN");
  });
}

// Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Handle user commands
async function handleCommand(input: string) {
  const cmd = input.trim().toLowerCase();

  switch (cmd) {
    case "r":
      await sendPushall();
      break;

    case "s":
      clearScreen();
      printDiagnostics();
      printState();
      break;

    case "d":
      clearScreen();
      printDiagnostics();
      break;

    case "v":
      isVerbose = !isVerbose;
      log(`Verbose mode: ${isVerbose ? "ON" : "OFF"}`, "INFO");
      break;

    case "c":
      clearScreen();
      printDiagnostics();
      break;

    case "j":
      console.log("\n--- RAW STATE JSON ---");
      console.log(JSON.stringify(lastState, null, 2));
      console.log("--- END JSON ---");
      break;

    case "p":
      log("Sending pause command...", "INFO");
      await sendPrintCommand("pause");
      break;

    case "u":
      log("Sending resume command...", "INFO");
      await sendPrintCommand("resume");
      break;

    case "x":
      log("Sending stop command...", "INFO");
      await sendPrintCommand("stop");
      break;

    case "g":
      rl.question("Enter GCode: ", async (gcode) => {
        if (gcode.trim()) {
          await sendGcode(gcode.trim());
        }
        printMenu();
      });
      return;

    case "l":
      dumpEnabled = !dumpEnabled;
      if (dumpEnabled && !dumpStream) {
        initDumpFile();
      } else if (!dumpEnabled && dumpStream) {
        closeDumpFile();
      }
      log(`MQTT dump: ${dumpEnabled ? "ENABLED" : "DISABLED"}`, "INFO");
      break;

    case "f":
      if (dumpFilePath) {
        console.log(`\nDump file: ${dumpFilePath}`);
        console.log(`Messages dumped: ${dumpMessageCount}`);
      } else {
        console.log("\nNo dump file active.");
      }
      break;

    case "q":
      log("Disconnecting...", "INFO");
      closeDumpFile();
      if (client) {
        client.end(false, {}, () => {
          log("Disconnected. Goodbye!", "INFO");
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
      return;

    default:
      if (cmd) {
        log(`Unknown command: ${cmd}`, "WARN");
      }
  }

  printMenu();
}

// Handle readline input
rl.on("line", (input) => {
  handleCommand(input);
});

// Handle process termination
process.on("SIGINT", () => {
  log("\nReceived SIGINT. Shutting down...", "INFO");
  closeDumpFile();
  if (client) {
    client.end(false, {}, () => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on("SIGTERM", () => {
  log("\nReceived SIGTERM. Shutting down...", "INFO");
  closeDumpFile();
  if (client) {
    client.end(false, {}, () => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Main entry point
console.log("BAMBU MQTT DIAGNOSTIC CONSOLE");
console.log("=============================");
console.log("");
connect();
printMenu();