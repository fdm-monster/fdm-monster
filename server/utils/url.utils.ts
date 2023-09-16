import { normalizeUrl } from "./normalize-url";

export function httpToWsUrl(url: string, protocol = "ws") {
  const wsUrl = new URL("/sockjs/websocket", normalizeUrl(url));
  wsUrl.protocol = `${protocol}`;
  wsUrl.pathname = "/sockjs/websocket";
  return wsUrl;
}

export function normalizeURLWithProtocol(printerURL: string) {
  if (!printerURL.startsWith("http://") && !printerURL.startsWith("https://")) {
    printerURL = `http://${printerURL}`;
  }

  return normalizeUrl(printerURL);
}
