export interface ConnectionMessageDto {
  version?: string;
  display_version?: string;
  branch?: string;
  plugin_hash?: string;
  config_hash?: string;
  python_version?: string;
  online?: boolean;
  debug?: boolean;
  safe_mode?: null;
  permissions?: {
    key: string;
    name: string;
    dangerous: boolean;
    default_groups: string[];
    description: string;
    needs: {
      role?: string[];
    };
    plugin: string;
  }[];
}
