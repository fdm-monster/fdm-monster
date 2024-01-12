export const SOCKET_STATE = {
  unopened: "unopened",
  opening: "opening",
  authenticating: "authenticating",
  opened: "opened",
  authenticated: "authenticated",
  aborted: "aborted",
  error: "error",
  closed: "closed"
} as const;

export const API_STATE = {
  unset: "unset",
  noResponse: "noResponse",
  globalKey: "globalKey",
  authFail: "authFail",
  responding: "responding",
  resetting: "resetting"
} as const;

export type SocketState = keyof typeof SOCKET_STATE;

export type ApiState = keyof typeof API_STATE;
