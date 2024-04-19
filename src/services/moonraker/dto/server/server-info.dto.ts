/**
 * plugins and failed_plugins are deprecated
 */
export interface ServerInfoDto {
  klippy_connected: boolean;
  klippy_state: string;
  components: string[];
  failed_components: any[];
  registered_directories: string[];
  warnings: string[];
  websocket_count: number;
  moonraker_version: string;
  api_version: number[];
  api_version_string: string;
}
