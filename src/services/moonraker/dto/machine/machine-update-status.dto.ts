export interface MachineUpdateStatusDto {
  busy: boolean;
  github_rate_limit: number;
  github_requests_remaining: number;
  github_limit_reset_time: number;
  version_info: VersionInfo;
}

export interface VersionInfo {
  system: System;
  moonraker: Moonraker;
  mainsail: Mainsail;
  fluidd: Fluidd;
  klipper: Klipper;
}

export interface System {
  package_count: number;
  package_list: string[];
}

export interface Moonraker {
  channel: string;
  debug_enabled: boolean;
  is_valid: boolean;
  configured_type: string;
  corrupt: boolean;
  info_tags: any[];
  detected_type: string;
  remote_alias: string;
  branch: string;
  owner: string;
  repo_name: string;
  version: string;
  remote_version: string;
  rollback_version: string;
  current_hash: string;
  remote_hash: string;
  is_dirty: boolean;
  detached: boolean;
  commits_behind: any[];
  git_messages: any[];
  full_version_string: string;
  pristine: boolean;
  recovery_url: string;
  remote_url: string;
  warnings: any[];
  anomalies: string[];
}

export interface Mainsail {
  name: string;
  owner: string;
  version: string;
  remote_version: string;
  rollback_version: string;
  configured_type: string;
  channel: string;
  info_tags: string[];
  warnings: any[];
  anomalies: any[];
  is_valid: boolean;
}

export interface Fluidd {
  name: string;
  owner: string;
  version: string;
  remote_version: string;
  rollback_version: string;
  configured_type: string;
  channel: string;
  info_tags: any[];
  warnings: any[];
  anomalies: any[];
  is_valid: boolean;
}

export interface Klipper {
  channel: string;
  debug_enabled: boolean;
  is_valid: boolean;
  configured_type: string;
  corrupt: boolean;
  info_tags: any[];
  detected_type: string;
  remote_alias: string;
  branch: string;
  owner: string;
  repo_name: string;
  version: string;
  remote_version: string;
  rollback_version: string;
  current_hash: string;
  remote_hash: string;
  is_dirty: boolean;
  detached: boolean;
  commits_behind: CommitsBehind[];
  git_messages: any[];
  full_version_string: string;
  pristine: boolean;
  recovery_url: string;
  remote_url: string;
  warnings: any[];
  anomalies: any[];
}

export interface CommitsBehind {
  sha: string;
  author: string;
  date: string;
  subject: string;
  message: string;
  tag: any;
}
