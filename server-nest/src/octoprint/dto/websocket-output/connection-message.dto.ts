/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface ConnectionMessageDto {
  connected: {
    version?: string;
    display_version?: string;
    branch?: string;
    plugin_hash?: string;
    config_hash?: string;
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
        [k: string]: any;
      };
      plugin: string;
      [k: string]: any;
    }[];
    [k: string]: any;
  };
  [k: string]: any;
}
