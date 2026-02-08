import { spawn } from "node:child_process";
import path from "node:path";
import { getDirname } from "@/utils/fs.utils";

const __dirname = getDirname(import.meta.url);
const startPort = 1234;
const instanceCount = 10; // Start with 5 printers, adjust as needed

console.log(`Starting ${instanceCount} fake OctoPrint servers...`);

for (let i = 0; i < instanceCount; i++) {
  const port = startPort + i;
  const process = spawn("node", [path.join(__dirname, "./mock-octoprint.server.js"), port.toString()]);

  process.stdout.on("data", (data) => {
    console.log(`[Server ${i + 1} - Port ${port}]: ${data.toString().trim()}`);
  });

  process.stderr.on("data", (data) => {
    console.error(`[Server ${i + 1} - Port ${port}] ERROR: ${data.toString().trim()}`);
  });

  console.log(`Started server ${i + 1} on port ${port}`);
}

console.log("All servers started. Press Ctrl+C to stop all servers.");
