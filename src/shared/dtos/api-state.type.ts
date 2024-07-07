export const API_STATE = {
  unset: "unset",
  noResponse: "noResponse",
  globalKey: "globalKey",
  authFail: "authFail",
  responding: "responding",
} as const;

export type ApiState = keyof typeof API_STATE;
