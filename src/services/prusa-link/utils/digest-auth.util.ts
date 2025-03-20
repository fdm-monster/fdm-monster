import { createHash } from "node:crypto";
import { DigestAuthParams } from "@/services/prusa-link/utils/digest-auth.params";

export function generateDigestAuthHeader(params: DigestAuthParams): string {
  const { username, password, method, uri, realm, nonce, qop, nc, cnonce } = params;

  const ha1 = createHash("md5").update(`${username}:${realm}:${password}`).digest("hex");
  const ha2 = createHash("md5").update(`${method}:${uri}`).digest("hex");

  let response: string;
  let authHeader: string;
  if (qop) {
    // qop is present, use full digest calculation
    response = createHash("md5").update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`).digest("hex");

    authHeader = `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", qop=${qop}, nc=${nc}, cnonce="${cnonce}", response="${response}"`;
  } else {
    // No qop, use simpler digest calculation
    response = createHash("md5").update(`${ha1}:${nonce}:${ha2}`).digest("hex");

    authHeader = `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${response}"`;
  }

  return authHeader;
}
