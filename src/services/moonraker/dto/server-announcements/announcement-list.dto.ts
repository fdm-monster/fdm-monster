export interface AnnouncementListDto {
  entries: AnnouncementEntry[];
  feeds: string[];
}

export interface AnnouncementEntry {
  entry_id: string;
  url: string;
  title: string;
  description: string;
  priority: string;
  date: number;
  dismissed: boolean;
  date_dismissed: any;
  dismiss_wake: any;
  source: string;
  feed: string;
}
