export interface AnnouncementActionDto {
  feed: string;
  action: "added" | "remove" | string;
}
