import { normalizeUrl } from "./normalize-url";

export function httpToWsUrl(url: string) {
  const protocolNormalizedUrl = normalizeURLWithProtocol(url);
  const wsUrl = new URL("/sockjs/websocket", protocolNormalizedUrl);
  wsUrl.protocol = protocolNormalizedUrl.startsWith("https://") ? "wss" : "ws";
  wsUrl.pathname = "/sockjs/websocket";
  return wsUrl;
}

export function normalizeURLWithProtocol(printerURL: string) {
  if (!printerURL) return;

  if (!printerURL.startsWith("http://") && !printerURL.startsWith("https://")) {
    printerURL = `https://${printerURL}`;
  }

  return normalizeUrl(printerURL);
}
