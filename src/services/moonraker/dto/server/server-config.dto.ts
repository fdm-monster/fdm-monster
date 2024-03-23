export interface ServerConfigDto {
  config: Config;
  orig: Orig;
  files: File[];
}

export interface Config {
  server: Server;
  dbus_manager: DbusManager;
  database: Database;
  file_manager: FileManager;
  klippy_apis: KlippyApis;
  machine: Machine;
  shell_command: ShellCommand;
  data_store: DataStore;
  proc_stats: ProcStats;
  job_state: JobState;
  job_queue: JobQueue;
  http_client: HttpClient;
  announcements: Announcements;
  authorization: Authorization;
  zeroconf: Zeroconf;
  octoprint_compat: OctoprintCompat;
  history: History;
  secrets: Secrets;
  mqtt: Mqtt;
  template: Template;
}

export interface Server {
  host: string;
  port: number;
  ssl_port: number;
  enable_debug_logging: boolean;
  enable_asyncio_debug: boolean;
  klippy_uds_address: string;
  max_upload_size: number;
  ssl_certificate_path: any;
  ssl_key_path: any;
}

export interface DbusManager {}

export interface Database {
  database_path: string;
  enable_database_debug: boolean;
}

export interface FileManager {
  enable_object_processing: boolean;
  queue_gcode_uploads: boolean;
  config_path: string;
  log_path: string;
}

export interface KlippyApis {}

export interface Machine {
  provider: string;
}

export interface ShellCommand {}

export interface DataStore {
  temperature_store_size: number;
  gcode_store_size: number;
}

export interface ProcStats {}

export interface JobState {}

export interface JobQueue {
  load_on_startup: boolean;
  automatic_transition: boolean;
  job_transition_delay: number;
  job_transition_gcode: string;
}

export interface HttpClient {}

export interface Announcements {
  dev_mode: boolean;
  subscriptions: any[];
}

export interface Authorization {
  login_timeout: number;
  force_logins: boolean;
  cors_domains: string[];
  trusted_clients: string[];
}

export interface Zeroconf {}

export interface OctoprintCompat {
  enable_ufp: boolean;
  flip_h: boolean;
  flip_v: boolean;
  rotate_90: boolean;
  stream_url: string;
  webcam_enabled: boolean;
}

export interface History {}

export interface Secrets {
  secrets_path: string;
}

export interface Mqtt {
  address: string;
  port: number;
  username: string;
  password_file: any;
  password: string;
  mqtt_protocol: string;
  instance_name: string;
  default_qos: number;
  status_objects: StatusObjects;
  api_qos: number;
  enable_moonraker_api: boolean;
}

export interface StatusObjects {
  webhooks: any;
  toolhead: string;
  idle_timeout: string;
  "gcode_macro M118": any;
}

export interface Template {}

export interface Orig {
  DEFAULT: Default;
  server: Server2;
  file_manager: FileManager2;
  machine: Machine2;
  announcements: Announcements2;
  job_queue: JobQueue2;
  authorization: Authorization2;
  zeroconf: Zeroconf2;
  octoprint_compat: OctoprintCompat2;
  history: History2;
  secrets: Secrets2;
  mqtt: Mqtt2;
}

export interface Default {}

export interface Server2 {
  enable_debug_logging: string;
  max_upload_size: string;
}

export interface FileManager2 {
  config_path: string;
  log_path: string;
  queue_gcode_uploads: string;
  enable_object_processing: string;
}

export interface Machine2 {
  provider: string;
}

export interface Announcements2 {}

export interface JobQueue2 {
  job_transition_delay: string;
  job_transition_gcode: string;
  load_on_startup: string;
}

export interface Authorization2 {
  trusted_clients: string;
  cors_domains: string;
}

export interface Zeroconf2 {}

export interface OctoprintCompat2 {}

export interface History2 {}

export interface Secrets2 {
  secrets_path: string;
}

export interface Mqtt2 {
  address: string;
  port: string;
  username: string;
  password: string;
  enable_moonraker_api: string;
  status_objects: string;
}

export interface File {
  filename: string;
  sections: string[];
}
