import { normalizeUrl } from "./normalize-url";

export const defaultHttpProtocol = "https";

export function httpToWsUrl(url: string) {
  if (!url?.length) {
    return;
  }

  const protocolNormalizedAddress = normalizeUrl(url, { defaultProtocol: defaultHttpProtocol });

  const wsUrl = new URL(protocolNormalizedAddress);
  wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:";
  return wsUrl;
}
