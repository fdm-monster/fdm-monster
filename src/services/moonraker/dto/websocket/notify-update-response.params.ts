export const applications = {
  moonraker: "moonraker",
  klipper: "klipper",
  system: "system",
  client: "client",
} as const;
export const applicationList = Object.keys(applications);
export type Application = keyof typeof applicationList;

export interface NotifyUpdateResponseParams {
  application: Application;
  proc_id: number;
  message: string;
  complete: boolean;
}
