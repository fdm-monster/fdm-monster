import LokiTransport from "winston-loki";
import winston from "winston";
import process from "node:process";
import { AppConstants } from "@/server.constants";
import { z } from "zod";

export interface LokiLoggerOptions {
  logLevel: string;
}

const lokiValidationSchema = z.object({
  lokiEnabled: z.boolean(),
  lokiAddress: z.string().url(),
  lokiTimeoutSeconds: z.coerce.number().positive().default(30),
  lokiInterval: z.coerce.number().positive().default(15),
});

export function createLokiLoggingTransport(options: LokiLoggerOptions) {
  const lokiConfigValidationResult = lokiValidationSchema.safeParse({
    lokiEnabled: process.env[AppConstants.ENABLE_LOKI_LOGGING] === "true",
    lokiTimeoutSeconds: process.env[AppConstants.LOKI_TIMEOUT_SECONDS],
    lokiAddress: process.env[AppConstants.LOKI_ADDRESS],
    lokiInterval: process.env[AppConstants.LOKI_INTERVAL],
  });

  if (!lokiConfigValidationResult.success || !lokiConfigValidationResult.data.lokiEnabled) {
    return;
  }

  return new LokiTransport({
    level: options.logLevel ?? "info",
    host: lokiConfigValidationResult.data.lokiAddress,
    interval: lokiConfigValidationResult.data.lokiInterval,
    timeout: lokiConfigValidationResult.data.lokiTimeoutSeconds,
    handleExceptions: true,
    onConnectionError(error: unknown) {
      console.debug(`Loki logger enabled, but connection failed. ${error}`);
    },
    // The labels,json, useWinstonMetaAsLabels, format settings plays well with Loki + Grafana
    labels: {
      app: "fdm-monster-server",
    },
    // When set to false, uses protobuf
    json: false,
    // When set to false, the labels column cardinality is kept low (better for performance)
    useWinstonMetaAsLabels: false,
    // Other formats like simple cause string + json, and are thus harder to work with
    format: winston.format.json(),
  });
}
