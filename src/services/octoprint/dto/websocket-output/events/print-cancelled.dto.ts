/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface PrintCancelledDto {
  name?: string;
  path?: string;
  origin?: string;
  size?: number;
  position?: {
    e?: null;
    z?: null;
    f?: null;
    y?: null;
    x?: null;
    t?: null;
  };
  owner?: string;
  user?: string;
  time?: number;
  reason?: string;
}
