import { AnnouncementEntry } from "@/services/moonraker/dto/server-announcements/announcement-list.dto";

export interface NotificationUpdateParams {
  announcements: AnnouncementEntry[];
}
