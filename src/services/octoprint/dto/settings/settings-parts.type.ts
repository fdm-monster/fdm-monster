import type { VirtualPrinterSettingsDto } from "@/services/octoprint/dto/settings/virtual-printer-settings.dto";

export interface Api {
  allowCrossOrigin: boolean;
  key: string;
}

export interface Appearance {
  closeModalsWithClick: boolean;
  color: string;
  colorIcon: boolean;
  colorTransparent: boolean;
  defaultLanguage: string;
  fuzzyTimes: boolean;
  name: string;
  showFahrenheitAlso: boolean;
  showInternalFilename: boolean;
}

export interface Devel {
  pluginTimings: boolean;
}

export interface Feature {
  autoUppercaseBlacklist: string[];
  g90InfluencesExtruder: boolean;
  keyboardControl: boolean;
  modelSizeDetection: boolean;
  pollWatched: boolean;
  printCancelConfirmation: boolean;
  printStartConfirmation: boolean;
  rememberFileFolder: boolean;
  sdSupport: boolean;
  temperatureGraph: boolean;
  uploadOverwriteConfirmation: boolean;
}

export interface Folder {
  timelapse: string;
  uploads: string;
  watched: string;
}

export interface GcodeAnalysis {
  bedZ: number;
  runAt: string;
}

export interface Plugins {
  action_command_notification: ActionCommandNotification;
  action_command_prompt: ActionCommandPrompt;
  announcements: Announcements;
  backup: Backup;
  classicwebcam: Classicwebcam;
  discovery: Discovery;
  errortracking: Errortracking;
  eventmanager: Eventmanager;
  firmware_check: FirmwareCheck;
  gcodeviewer: Gcodeviewer;
  pluginmanager: Pluginmanager;
  softwareupdate: Softwareupdate;
  tracking: Tracking;
  virtual_printer: VirtualPrinterSettingsDto;
}

export interface ActionCommandNotification {
  enable: boolean;
  enable_popups: boolean;
}

export interface ActionCommandPrompt {
  command: string;
  enable: string;
  enable_emergency_sending: boolean;
  enable_signal_support: boolean;
}

export interface Announcements {
  channel_order: string[];
  channels: Channels;
  display_limit: number;
  enabled_channels: string[];
  forced_channels: string[];
  summary_limit: number;
  ttl: number;
}

export interface Channels {
  _blog: Blog;
  _important: Important;
  _octopi: Octopi;
  _plugins: Plugins2;
  _releases: Releases;
}

export interface Blog {
  description: string;
  name: string;
  priority: number;
  read_until: number;
  type: string;
  url: string;
}

export interface Important {
  description: string;
  name: string;
  priority: number;
  read_until: number;
  type: string;
  url: string;
}

export interface Octopi {
  description: string;
  name: string;
  priority: number;
  read_until: number;
  type: string;
  url: string;
}

export interface Plugins2 {
  description: string;
  name: string;
  priority: number;
  read_until: number;
  type: string;
  url: string;
}

export interface Releases {
  description: string;
  name: string;
  priority: number;
  read_until: number;
  type: string;
  url: string;
}

export interface Backup {
  restore_unsupported: boolean;
}

export interface Classicwebcam {
  cacheBuster: boolean;
  flipH: boolean;
  flipV: boolean;
  rotate90: boolean;
  snapshot: string;
  snapshotSslValidation: boolean;
  snapshotTimeout: number;
  stream: string;
  streamRatio: string;
  streamTimeout: number;
  streamWebrtcIceServers: string[];
}

export interface Discovery {
  addresses: any;
  httpPassword: any;
  httpUsername: any;
  ignoredAddresses: any;
  ignoredInterfaces: any;
  interfaces: any;
  model: Model;
  pathPrefix: any;
  publicHost: any;
  publicPort: any;
  upnpUuid: string;
  zeroConf: any[];
}

export interface Model {
  description: any;
  name: any;
  number: any;
  serial: any;
  url: any;
  vendor: any;
  vendorUrl: any;
}

export interface Errortracking {
  enabled: boolean;
  enabled_unreleased: boolean;
  unique_id: string;
  url_coreui: string;
  url_server: string;
}

export interface Eventmanager {
  availableEvents: string[];
  subscriptions: any[];
}

export interface FirmwareCheck {
  ignore_infos: boolean;
}

export interface Gcodeviewer {
  alwaysCompress: boolean;
  compressionSizeThreshold: number;
  mobileSizeThreshold: number;
  sizeThreshold: number;
  skipUntilThis: any;
}

export interface Pluginmanager {
  confirm_disable: boolean;
  dependency_links: boolean;
  hidden: any[];
  ignore_throttled: boolean;
  notices: string;
  notices_ttl: number;
  pip_args: any;
  pip_force_user: boolean;
  repository: string;
  repository_ttl: number;
}

export interface Softwareupdate {
  cache_ttl: number;
  check_overlay_py2_url: string;
  check_overlay_ttl: number;
  check_overlay_url: string;
  credentials: Credentials;
  ignore_throttled: boolean;
  minimum_free_storage: number;
  notify_users: boolean;
  octoprint_branch_mappings: OctoprintBranchMapping[];
  octoprint_checkout_folder: any;
  octoprint_method: string;
  octoprint_pip_target: string;
  octoprint_release_channel: string;
  octoprint_tracked_branch: any;
  octoprint_type: string;
  pip_command: any;
  pip_enable_check: boolean;
  queued_updates: any[];
  updatelog_cutoff: number;
}

export interface Credentials {
  bitbucket_password_set: boolean;
  bitbucket_user_set: boolean;
  github_set: boolean;
}

export interface OctoprintBranchMapping {
  branch: string;
  commitish: string[];
  name: string;
}

export interface Tracking {
  enabled: boolean;
  events: Events;
  ping: any;
  pong: number;
  server: any;
  unique_id: string;
}

export interface Events {
  commerror: boolean;
  plugin: boolean;
  pong: boolean;
  printer: boolean;
  printer_safety_check: boolean;
  printjob: boolean;
  slicing: boolean;
  startup: boolean;
  throttled: boolean;
  update: boolean;
  webui_load: boolean;
}

export interface Capabilities {
  AUTOREPORT_POS: boolean;
  AUTOREPORT_SD_STATUS: boolean;
  AUTOREPORT_TEMP: boolean;
  EMERGENCY_PARSER: boolean;
  EXTENDED_M20: boolean;
  LFN_WRITE: boolean;
}

export interface Errors {
  checksum_mismatch: string;
  checksum_missing: string;
  command_unknown: string;
  lineno_mismatch: string;
  lineno_missing: string;
  maxtemp: string;
  mintemp: string;
}

export interface SdFiles {
  longname: boolean;
  longname_quoted: boolean;
  size: boolean;
}

export interface Scripts {
  gcode: Gcode;
}

export interface Gcode {
  afterPrintCancelled: string;
  "snippets/disable_bed": string;
  "snippets/disable_hotends": string;
}

export interface Server {
  allowFraming: boolean;
  commands: Commands;
  diskspace: Diskspace;
  onlineCheck: OnlineCheck;
  pluginBlacklist: PluginBlacklist;
}

export interface Commands {
  serverRestartCommand: string;
  systemRestartCommand: any;
  systemShutdownCommand: any;
}

export interface Diskspace {
  critical: number;
  warning: number;
}

export interface OnlineCheck {
  enabled: boolean;
  host: string;
  interval: number;
  name: string;
  port: number;
}

export interface PluginBlacklist {
  enabled: boolean;
  ttl: number;
  url: string;
}

export interface Slicing {
  defaultSlicer: any;
}

export interface System {
  actions: any[];
  events: any;
}

export interface Temperature {
  cutoff: number;
  profiles: Profile[];
  sendAutomatically: boolean;
  sendAutomaticallyAfter: number;
}

export interface Profile {
  bed: number;
  chamber: any;
  extruder: number;
  name: string;
}

export interface TerminalFilter {
  name: string;
  regex: string;
}

export interface Webcam {
  bitrate: string;
  cacheBuster: boolean;
  defaultWebcam: string;
  ffmpegCommandline: string;
  ffmpegPath: any;
  ffmpegThreads: number;
  ffmpegVideoCodec: string;
  flipH: boolean;
  flipV: boolean;
  rotate90: boolean;
  snapshotSslValidation: boolean;
  snapshotTimeout: number;
  snapshotUrl: string;
  snapshotWebcam: string;
  streamRatio: string;
  streamTimeout: number;
  streamUrl: string;
  streamWebrtcIceServers: string[];
  timelapseEnabled: boolean;
  watermark: boolean;
  webcamEnabled: boolean;
  webcams: Webcam2[];
}

export interface Webcam2 {
  canSnapshot: boolean;
  compat: Compat;
  displayName: string;
  extras: Extras;
  flipH: boolean;
  flipV: boolean;
  name: string;
  provider: string;
  rotate90: boolean;
  snapshotDisplay: string;
}

export interface Compat {
  cacheBuster: boolean;
  snapshot: string;
  snapshotSslValidation: boolean;
  snapshotTimeout: number;
  stream: string;
  streamRatio: string;
  streamTimeout: number;
  streamWebrtcIceServers: string[];
}

export interface Extras {
  cacheBuster: boolean;
  stream: string;
  streamRatio: string;
  streamTimeout: number;
  streamWebrtcIceServers: string[];
}
