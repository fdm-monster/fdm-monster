export interface DigestAuthParams {
  username: string;
  password: string;
  method: string;
  uri: string;
  realm: string;
  nonce: string;
  qop?: string;
  nc?: string;
  cnonce?: string;
}
