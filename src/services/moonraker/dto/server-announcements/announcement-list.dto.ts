export interface AnnouncementListDto {
  entries: Entry[];
  feeds: string[];
}

export interface Entry {
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
