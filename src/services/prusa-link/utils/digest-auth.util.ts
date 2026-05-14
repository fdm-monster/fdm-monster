import { createHash } from "node:crypto";
import { DigestAuthParams } from "@/services/prusa-link/utils/digest-auth.params";

export function generateDigestAuthHeader(params: DigestAuthParams): string {
  const { username, password, method, uri, realm, nonce, qop, nc, cnonce, opaque, algorithm } = params;

  let ha1 = createHash("md5").update(`${username}:${realm}:${password}`).digest("hex");

  if (algorithm?.toLowerCase() === "md5-sess") {
    if (!cnonce?.length) {
      throw new Error("cnonce is required for MD5-sess algorithm");
    }
    ha1 = createHash("md5").update(`${ha1}:${nonce}:${cnonce}`).digest("hex");
  }

  const ha2 = createHash("md5").update(`${method}:${uri}`).digest("hex");

  const response = qop
    ? createHash("md5").update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`).digest("hex")
    : createHash("md5").update(`${ha1}:${nonce}:${ha2}`).digest("hex");

  const headerParts = [
    `Digest username="${username}"`,
    `realm="${realm}"`,
    `nonce="${nonce}"`,
    `uri="${uri}"`,
  ];

  if (algorithm?.length) {
    headerParts.push(`algorithm=${algorithm}`);
  }

  if (opaque?.length) {
    headerParts.push(`opaque="${opaque}"`);
  }

  if (qop) {
    headerParts.push(`qop=${qop}`, `nc=${nc}`, `cnonce="${cnonce}"`);
  } else if (cnonce?.length) {
    headerParts.push(`cnonce="${cnonce}"`);
  }

  headerParts.push(`response="${response}"`);

  return headerParts.join(", ");
}
