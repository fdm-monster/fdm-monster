export interface NotifierListDto {
  notifiers: Notifier[];
}

export interface Notifier {
  name: string;
  url: string;
  events: string[];
  body: string;
  title: any;
  attach?: string;
}
