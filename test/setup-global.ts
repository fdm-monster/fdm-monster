import { AppConstants } from "@/server.constants";
import nock from "nock";

interface NockRecordingEntry {
  scope: string; // The base URL (e.g., "http://example.com")
  method: string; // HTTP method (e.g., "GET", "POST")
  path: string; // URL path (e.g., "/api/users")
  body: any; // Request body (if present)
  status: number; // Response status code
  response: any; // Response body
  rawHeaders: string[]; // Array of raw headers
  reqheaders?: {
    // Request headers (if enable_reqheaders_recording is true)
    [key: string]: string;
  };
  headers: {
    // Response headers
    [key: string]: string;
  };
  timestamp?: number; // Unix timestamp of when the request was made
}

function logApiCall(entry: NockRecordingEntry) {
  const time = new Date().toISOString();
  console.log(`[${time}] ${entry.method.toUpperCase()} ${entry.path} (${entry.scope})`);
}

// Enable nock globally to intercept HTTP requests with custom logging
nock.recorder.rec({
  logging: (content) => {
    const entry = typeof content === "string" ? JSON.parse(content.replace(/<<<<<<-- cut here -->>>>>>/g, "")) : content;
    logApiCall(entry);
  },
  output_objects: true,
});

module.exports = async () => {
  process.env.TZ = "UTC";
  process.env[AppConstants.VERSION_KEY] = "1.0.0";
  process.env[AppConstants.ENABLE_EXPERIMENTAL_WHITELIST_SETTINGS] = "true";
  process.env[AppConstants.OVERRIDE_IS_DEMO_MODE] = "false";
  process.env[AppConstants.DATABASE_FILE] = ":memory:";
  process.env[AppConstants.ENABLE_EXPERIMENTAL_TYPEORM] = (process.env["MONGODB_MODE"] !== "true").toString();
  process.env["NODE_NO_WARNINGS"] = "1";
};
