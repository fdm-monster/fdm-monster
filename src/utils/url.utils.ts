import { z } from "zod";
import { normalizeUrl } from "./normalize-url";

export const defaultHttpProtocol = "https";

export function httpToWsUrl(url?: string) {
  const validUrl = z.string().parse(url);

  const protocolNormalizedAddress = normalizeUrl(validUrl, { defaultProtocol: defaultHttpProtocol });

  const wsUrl = new URL(protocolNormalizedAddress);
  wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:";
  return wsUrl;
}
