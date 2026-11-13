import { strict as assert } from "node:assert";
import { createServer, Server } from "node:http";
import { Readable } from "node:stream";
import { HttpClientFactory } from "@/services/core/http-client.factory";
import { PrusaLinkApi } from "@/services/prusa-link/prusa-link.api";
import type { ILoggerFactory } from "@/handlers/logger-factory";
import type EventEmitter2 from "eventemitter2";
import type { SettingsStore } from "@/state/settings.store";

describe(PrusaLinkApi.name, () => {
  let server: Server;

  afterEach(async () => {
    server?.closeAllConnections();
    await new Promise<void>((resolve) => server?.close(() => resolve()));
  });

  it("primes Digest authentication before consuming an upload stream", async () => {
    const payload = Buffer.from("replay-safe PrusaLink upload\n");
    const requests: Array<{
      method?: string;
      url?: string;
      hasAuthorization: boolean;
      receivedBytes: number;
    }> = [];
    const challenge = 'Digest realm="PrusaLink", nonce="test", qop="auth", algorithm=MD5';

    server = createServer((request, response) => {
      const observation = {
        method: request.method,
        url: request.url,
        hasAuthorization: Boolean(request.headers.authorization),
        receivedBytes: 0,
      };
      requests.push(observation);

      request.setTimeout(100, () => {
        response.writeHead(408);
        response.end();
      });
      request.on("data", (chunk) => {
        observation.receivedBytes += chunk.length;
      });
      request.on("end", () => {
        if (!request.headers.authorization) {
          response.writeHead(401, { "WWW-Authenticate": challenge });
          response.end();
          return;
        }

        if (request.method === "GET" && request.url === "/api/version") {
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ server: "2.1.2" }));
          return;
        }

        if (request.method === "PUT" && request.url === "/api/v1/files/usb/test.bgcode") {
          response.writeHead(201, { "Content-Type": "application/json" });
          response.end("{}");
          return;
        }

        response.writeHead(404);
        response.end();
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

    const address = server.address();
    assert(address && typeof address === "object");
    const settingsStore = {
      getTimeoutSettings: () => ({ apiTimeout: 1_000, apiUploadTimeout: 1_000 }),
    } as SettingsStore;
    const loggerFactory = (() => ({
      debug() {},
      error() {},
      log() {},
      warn() {},
    })) as ILoggerFactory;
    const api = new PrusaLinkApi(
      loggerFactory,
      { emit() {} } as EventEmitter2,
      new HttpClientFactory(settingsStore),
      settingsStore,
      {
        printerURL: `http://127.0.0.1:${address.port}`,
        username: "maker",
        password: "test-only",
      },
    );

    await api.uploadFile({
      stream: Readable.from(payload),
      fileName: "test.bgcode",
      contentLength: payload.length,
      startPrint: false,
    });

    expect(requests).toEqual([
      {
        method: "GET",
        url: "/api/version",
        hasAuthorization: false,
        receivedBytes: 0,
      },
      {
        method: "GET",
        url: "/api/version",
        hasAuthorization: true,
        receivedBytes: 0,
      },
      {
        method: "PUT",
        url: "/api/v1/files/usb/test.bgcode",
        hasAuthorization: true,
        receivedBytes: payload.length,
      },
    ]);
  });
});
