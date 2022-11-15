export interface WhitelistSettings {
  whitelistedIpAddresses: string[];
  whitelistEnabled: boolean;
}

export interface ServerModel extends WhitelistSettings {
  registration: boolean;
  port: number;
  loginRequired: boolean;
}
