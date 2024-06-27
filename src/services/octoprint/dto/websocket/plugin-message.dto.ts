export interface PluginMessageDto {
  plugin: string;
  data: {
    type: string;
    action: string;
  };
}
