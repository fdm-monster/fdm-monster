export const klippyStates = {
  shutdown: "shutdown",
  startup: "startup",
  error: "error",
  ready: "ready",
} as const;

export type KlippyState = keyof typeof klippyStates;
/**
 * plugins and failed_plugins are deprecated
 */
export interface ServerInfoDto {
  klippy_connected: boolean;
  // Same as /printer/info::state
  klippy_state: KlippyState;
  components: string[];
  failed_components: any[];
  registered_directories: string[];
  warnings: string[];
  websocket_count: number;
  moonraker_version: string;
  api_version: number[];
  api_version_string: string;
}
