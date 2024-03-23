export interface AccessInfoDto {
  default_source: "moonraker" | "ldap" | string;
  available_sources: ("moonraker" | "ldap" | string)[];
}
