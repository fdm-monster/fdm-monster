import net from "net";
import cluster, { Worker } from "cluster";
import { cpus } from "os";

interface ScanResult {
  port: number;
  status: "open" | "closed";
  service?: string;
}

const numCPUs = cpus().length;

// Common service names for well-known ports
const commonServices: { [key: number]: string } = {
  80: "HTTP",
  443: "HTTPS",
  22: "SSH",
  21: "FTP",
  3306: "MySQL",
  5432: "PostgreSQL",
  27017: "MongoDB",
  6379: "Redis",
  8080: "HTTP-Alternate",
  8443: "HTTPS-Alternate",
};

async function checkPort(host: string, port: number): Promise<ScanResult> {
  console.log("Worker defined " + host + ":" + port);
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 1000; // 1 second timeout

    socket.setTimeout(timeout);

    socket.on("connect", () => {
      socket.destroy();
      resolve({
        port,
        status: "open",
        service: commonServices[port],
      });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({
        port,
        status: "closed",
      });
    });

    socket.on("error", () => {
      socket.destroy();
      resolve({
        port,
        status: "closed",
      });
    });

    socket.connect(port, host);
  });
}

async function scanPortRange(host: string, start: number, end: number, specificPorts: number[] = []): Promise<ScanResult[]> {
  // Combine range and specific ports, removing duplicates
  const portsToScan = [...Array.from({ length: end - start + 1 }, (_, i) => start + i), ...specificPorts].filter(
    (value, index, self) => self.indexOf(value) === index
  );

  // Split ports into chunks for parallel processing
  const chunkSize = Math.ceil(portsToScan.length / numCPUs);
  const chunks = Array.from({ length: numCPUs }, (_, i) => portsToScan.slice(i * chunkSize, (i + 1) * chunkSize));

  if (cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`);
    console.log(`Starting scan on ${host} for ports ${start}-${end} and specific ports: ${specificPorts.join(", ")}`);
    console.log(`Number of CPU cores: ${numCPUs}`);

    const results: ScanResult[] = [];
    const workers = new Set<Worker>();

    // Set up worker event handlers before creating workers
    cluster.on("exit", (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died. Signal: ${signal}. Code: ${code}`);
      workers.delete(worker);

      if (workers.size === 0) {
        console.log("All workers completed");
        process.emit("allWorkersCompleted", results);
      }
    });

    // Return a promise that resolves when all workers complete
    return new Promise((resolve, reject) => {
      // Set a timeout for the entire scan
      const timeout = setTimeout(() => {
        for (const worker of workers) {
          worker.kill();
        }
        reject(new Error("Scan timeout after 30 seconds"));
      }, 30000);

      process.once("allWorkersCompleted", (finalResults: ScanResult[]) => {
        clearTimeout(timeout);
        resolve(finalResults.sort((a, b) => a.port - b.port));
      });

      // Create and track workers
      chunks.forEach((chunk, index) => {
        try {
          const worker = cluster.fork();
          workers.add(worker);
          console.log(`Created worker ${worker.process.pid} for chunk ${index + 1}/${chunks.length}`);

          worker.on("message", (msg: ScanResult[]) => {
            console.log(`Received results from worker ${worker.process.pid}: ${msg.length} ports`);
            results.push(...msg);
          });

          worker.on("error", (error) => {
            console.error(`Worker ${worker.process.pid} error:`, error);
          });

          worker.send({ host, ports: chunk });
        } catch (error) {
          console.error("Error creating worker:", error);
        }
      });
    });
  } else {
    // Worker process
    console.log(`Worker ${process.pid} started`);

    return new Promise((resolve) => {
      process.on("message", async (msg: { host: string; ports: number[] }) => {
        try {
          console.log(`Worker ${process.pid} received ${msg.ports.length} ports to scan`);
          const results: ScanResult[] = [];

          // Scan ports in parallel within each worker
          const promises = msg.ports.map((port) => checkPort(msg.host, port));
          const workerResults = await Promise.all(promises);

          results.push(...workerResults);

          // Send results back to primary
          if (process.send) {
            process.send(results);
            console.log(`Worker ${process.pid} completed scanning`);
          }

          // Exit worker
          process.exit(0);
        } catch (error) {
          console.error(`Worker ${process.pid} error:`, error);
          process.exit(1);
        }
      });
    });
  }
}

// Example usage
if (require.main === module) {
  const host = process.argv[2] || "localhost";

  scanPortRange(host, 80, 8888, [27017])
    .then((results) => {
      console.log("\nScan Results:");
      const openPorts = results.filter((r) => r.status === "open");

      if (openPorts.length === 0) {
        console.log("No open ports found");
      } else {
        console.table(openPorts);
      }

      process.exit(0);
    })
    .catch((error) => {
      console.error("Error during scan:", error);
      process.exit(1);
    });
}

export { scanPortRange, checkPort };
