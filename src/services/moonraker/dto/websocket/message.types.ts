import type { JsonRpcEventDto } from "@/services/moonraker/dto/websocket/json-rpc-event.dto";
import { NotifyFileListChangedParams } from "@/services/moonraker/dto/websocket/notify-filelist-changed.params";
import { NotifyUpdateResponseParams } from "@/services/moonraker/dto/websocket/notify-update-response.params";
import type { MachineUpdateStatusDto } from "@/services/moonraker/dto/machine/machine-update-status.dto";
import { ThrottledState } from "@/services/moonraker/dto/process-stats.dto";
import { NotifyProcStatUpdateParams } from "@/services/moonraker/dto/websocket/notify-proc-stat-update.params";
import { NotifyHistoryChangedParams } from "@/services/moonraker/dto/websocket/notify-history-changed.params";
import { NotifyUserChangeParams } from "@/services/moonraker/dto/websocket/notify-user-change.params";
import { NotifyServiceStateChangedParams } from "@/services/moonraker/dto/websocket/notify-service-state-changed.params";
import { JobQueueChangedParams } from "@/services/moonraker/dto/websocket/notify-job-queue-changed.params";
import { NotifyButtonEventParams } from "@/services/moonraker/dto/websocket/notify-button-event.params";
import { NotificationUpdateParams } from "@/services/moonraker/dto/websocket/notify-announcement-update.params";
import { NotifyAnnouncementParams } from "@/services/moonraker/dto/websocket/notify-announcement.params";
import { NotifySudoAlertParams } from "@/services/moonraker/dto/websocket/notify-sudo-alert.params";
import type { WebcamListDto } from "@/services/moonraker/dto/server-webcams/webcam-list.dto";
import { NotifyActiveSpoolSetParams } from "@/services/moonraker/dto/websocket/notify-active-spool-set.params";
import { NotifySpoolmanStatusChangedParams } from "@/services/moonraker/dto/websocket/notify-spoolman-status-changed";
import { NotifyAgentEventParams } from "@/services/moonraker/dto/websocket/notify-agent-event.params";
import { SensorUpdateParams } from "@/services/moonraker/dto/websocket/notify-sensor-update.params";

// Event based
export type NotifyGcodeResponse = JsonRpcEventDto<"notify_gcode_response", [string]>;
// Objects, very frequent
export type NotifyStatusUpdate<T = any> = JsonRpcEventDto<"notify_status_update", [status: T, eventtime: number]>;
// Crucial
export type NotifyKlipperReady = JsonRpcEventDto<"notify_klippy_ready", never>;
// Crucial
export type NotifyKlipperShutdown = JsonRpcEventDto<"notify_klippy_shutdown", never>;
// Crucial
export type NotifyKlipperDisconnected = JsonRpcEventDto<"notify_klippy_disconnected", never>;
// Less frequent below
export type NotifyFileListChanged = JsonRpcEventDto<"notify_filelist_changed", [NotifyFileListChangedParams]>;
export type NotifyUpdateResponse = JsonRpcEventDto<"notify_update_response", [NotifyUpdateResponseParams]>;
export type NotifyUpdateRefreshed = JsonRpcEventDto<"notify_update_refreshed", [MachineUpdateStatusDto]>;
export type NotifyThrottledState = JsonRpcEventDto<"notify_cpu_throttled", [ThrottledState]>;
export type NotifyProcStatUpdate = JsonRpcEventDto<"notify_proc_stat_update", [NotifyProcStatUpdateParams]>;
export type NotifyHistoryChanged = JsonRpcEventDto<"notify_history_changed", [NotifyHistoryChangedParams]>;
export type NotifyUserCreated = JsonRpcEventDto<"notify_user_created", [NotifyUserChangeParams]>;
export type NotifyUserDeleted = JsonRpcEventDto<"notify_user_deleted", [NotifyUserChangeParams]>;
export type NotifyUserLoggedOut = JsonRpcEventDto<"notify_user_logged_out", [NotifyUserChangeParams]>;
export type NotifyServiceStateChanged = JsonRpcEventDto<
  "notify_service_state_changed",
  [NotifyServiceStateChangedParams]
>;
export type NotifyJobQueueChanged = JsonRpcEventDto<"notify_job_queue_changed", [JobQueueChangedParams]>;
export type NotifyButtonEvent = JsonRpcEventDto<"notify_button_event", [NotifyButtonEventParams]>;
export type NotifyAnnouncementUpdate = JsonRpcEventDto<"notify_announcement_update", [NotificationUpdateParams]>;
export type NotifyAnnouncementDismissed = JsonRpcEventDto<"notify_announcement_dismissed", [NotifyAnnouncementParams]>;
export type NotifyAnnouncementWake = JsonRpcEventDto<"notify_announcement_wake", [NotifyAnnouncementParams]>;
export type NotifySudoAlert = JsonRpcEventDto<"notify_sudo_alert", [NotifySudoAlertParams]>;
export type NotifyWebcamsChanged = JsonRpcEventDto<"notify_webcams_changed", [WebcamListDto]>;
export type NotifyActiveSpoolSet = JsonRpcEventDto<"notify_active_spool_set", [NotifyActiveSpoolSetParams]>;
export type NotifySpoolmanStatusChanged = JsonRpcEventDto<
  "notify_spoolman_status_changed",
  [NotifySpoolmanStatusChangedParams]
>;
export type NotifyAgentEvent = JsonRpcEventDto<"notify_agent_event", [NotifyAgentEventParams]>;
export type NotifySensorUpdate = JsonRpcEventDto<"sensors:sensor_update", [SensorUpdateParams]>;

// export type = JsonRpcEventDto<"", []>;
