import { normalizeUrl } from "./normalize-url";

export function httpToWsUrl(url, protocol = "ws") {
  const wsUrl = new URL("/sockjs/websocket", normalizeUrl(url));
  wsUrl.protocol = `${protocol}`;
  wsUrl.pathname = "/sockjs/websocket";
  return wsUrl;
}
