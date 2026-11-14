import axios from "axios";
import express from "express";
import { once } from "node:events";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import type { AddressInfo } from "node:net";
import { Server as SocketIOServer } from "socket.io";
import request from "supertest";
import WebSocket from "ws";

describe("HTTP dependency compatibility", () => {
  it("preserves JSON request bodies", async () => {
    const app = express().use(express.json({ limit: "10mb" }));
    app.post("/echo", (req, res) => res.json(req.body));
    const body = { printerId: 7, enabled: false, temperature: 215.5, tags: ["PLA", "blue"], metadata: null };

    const response = await request(app).post("/echo").send(body).expect(200);

    expect(response.body).toEqual(body);
  });

  it("preserves form encoding, repeated fields, and literal bracket keys", async () => {
    const app = express().use(express.urlencoded({ extended: false }));
    app.post("/echo", (req, res) => res.json(req.body));

    const response = await request(app)
      .post("/echo")
      .type("form")
      .send("name=PLA+blue&tag=one&tag=two&plus=%2B&filter[name]=sample")
      .expect(200);

    expect(response.body).toEqual({ name: "PLA blue", tag: ["one", "two"], plus: "+", "filter[name]": "sample" });
  });

  it("preserves Express extended query parsing", async () => {
    const app = express();
    app.get("/echo", (req, res) => res.json(req.query));

    const response = await request(app).get("/echo?filter[name]=PLA+blue&tags[]=one&tags[]=two&plus=%2B").expect(200);

    expect(response.body).toEqual({ filter: { name: "PLA blue" }, tags: ["one", "two"], plus: "+" });
  });

  it("preserves configured trust-proxy address selection", async () => {
    const app = express().set("trust proxy", "loopback");
    app.get("/address", (req, res) => res.json({ ip: req.ip, ips: req.ips }));

    const response = await request(app).get("/address").set("X-Forwarded-For", "192.0.2.10").expect(200);

    expect(response.body).toEqual({ ip: "192.0.2.10", ips: ["192.0.2.10"] });
  });

  it("follows ordinary redirects with the query and same-origin headers intact", async () => {
    const app = express();
    app.get("/redirect", (_req, res) => res.redirect(302, "/target?printerId=7"));
    app.get("/target", (req, res) => res.json({ printerId: req.query.printerId, apiKey: req.get("X-Api-Key") }));
    const server = createServer(app);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");

    try {
      const port = (server.address() as AddressInfo).port;
      const response = await axios.get(`http://127.0.0.1:${port}/redirect`, {
        headers: { "X-Api-Key": "compatibility-test" },
        proxy: false,
        timeout: 2000,
      });

      expect(response.data).toEqual({ printerId: "7", apiKey: "compatibility-test" });
    } finally {
      await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
    }
  });
});

describe("printer transport dependency compatibility", () => {
  it("exchanges Socket.IO events over the existing Engine.IO WebSocket protocol", async () => {
    const server = createServer();
    const io = new SocketIOServer(server, { serveClient: false });
    io.on("connection", (socket) => {
      socket.on("printer-command", (payload) => socket.emit("printer-response", payload));
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const port = (server.address() as AddressInfo).port;
    const client = new WebSocket(`ws://127.0.0.1:${port}/socket.io/?EIO=4&transport=websocket`);
    const payload = { printerId: 7, action: "pause", parameters: { temperature: 0 } };

    try {
      const response = await new Promise<unknown>((resolve, reject) => {
        function cleanup() {
          clearTimeout(deadline);
          client.off("error", onError);
          client.off("close", onClose);
          client.off("message", onMessage);
        }

        function onError(error: unknown) {
          cleanup();
          reject(error);
        }

        function onClose() {
          onError(new Error("WebSocket closed before receiving a response"));
        }

        function onMessage(data: WebSocket.RawData) {
          try {
            const packet = data.toString();
            if (packet.startsWith("0")) {
              client.send("40");
            } else if (packet.startsWith("40")) {
              client.send(`42${JSON.stringify(["printer-command", payload])}`);
            } else if (packet.startsWith("42")) {
              const response = JSON.parse(packet.slice(2));
              cleanup();
              resolve(response);
            }
          } catch (error) {
            onError(error);
          }
        }

        const deadline = setTimeout(() => onError(new Error("Timed out waiting for a WebSocket response")), 3000);
        client.once("error", onError);
        client.once("close", onClose);
        client.on("message", onMessage);
      });

      expect(response).toEqual(["printer-response", payload]);
    } finally {
      if (client.readyState === WebSocket.CONNECTING) {
        // Terminating an unfinished handshake emits an error after the exchange listeners have been removed.
        client.once("error", () => undefined);
      }
      client.terminate();
      await new Promise<void>((resolve) => io.close(() => resolve()));
    }
  });

  it("preserves the consoles FTP directory timestamp format", () => {
    const consolesRequire = createRequire(new URL("../../packages/consoles/package.json", import.meta.url));
    const formatFileStat = consolesRequire("ftp-srv/src/helpers/file-stat.js");
    const fileStat = {
      name: "part.gcode",
      mtime: new Date("2020-01-03T14:05:06Z"),
      mode: 0o100644,
      size: 2048,
      uid: 1000,
      gid: 1000,
      isDirectory: () => false,
    };

    expect(formatFileStat(fileStat, "ls")).toBe("-rw-r--r-- 1 1000 1000         2048 Jan 03  2020 part.gcode");
    expect(formatFileStat(fileStat, "ep")).toContain("m1578060306");
  });
});
