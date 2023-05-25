export const SOCKET_STATE = {
  unopened: "unopened",
  opening: "opening",
  authenticating: "authenticating",
  // When no connection exists OR providing a wrong session or format user:key, the socket becomes silent
  silent: "silent",
  aborted: "aborted",
  opened: "opened",
  error: "error",
  closed: "closed",
} as const;

export const API_STATE = {
  unset: "unset",
  noResponse: "noResponse",
  globalKey: "globalKey",
  authFail: "authFail",
  responding: "responding",
} as const;

export type SocketState = keyof typeof SOCKET_STATE;

export type ApiState = keyof typeof API_STATE;
