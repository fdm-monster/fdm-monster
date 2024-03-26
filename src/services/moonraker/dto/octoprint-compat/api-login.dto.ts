export interface ApiLoginDto {
  _is_external_client: boolean;
  _login_mechanism: string;
  name: string;
  active: boolean;
  user: boolean;
  admin: boolean;
  apikey: any;
  permissions: any[];
  groups: string[];
}
