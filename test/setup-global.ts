import { AppConstants } from "@/server.constants";
import nock from "nock";
import { NockRecordingEntry } from "./nock-recording-entry.interface";

module.exports = async () => {
  nock.recorder.rec({
    logging: (content) => {
      const entry = JSON.parse(content.replace(/<<<<<<-- cut here -->>>>>>/g, "")) as NockRecordingEntry;

      console.log(`[${new Date().toISOString()}] ${entry.method.toUpperCase()} ${entry.path} (${entry.scope})`);
    },
    dont_print: false,
    output_objects: true,
  });

  process.env.TZ = "UTC";
  process.env[AppConstants.VERSION_KEY] = "1.0.0";
  process.env[AppConstants.OVERRIDE_IS_DEMO_MODE] = "false";
  process.env[AppConstants.DATABASE_FILE] = ":memory:";
  process.env[AppConstants.ENABLE_PROMETHEUS_METRICS] = "false";
  process.env[AppConstants.ENABLE_LOKI_LOGGING] = "false";
  process.env["NODE_NO_WARNINGS"] = "1";
};
