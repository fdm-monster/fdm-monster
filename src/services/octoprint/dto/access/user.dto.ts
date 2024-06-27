export interface UserDto {
  active: boolean;
  admin: boolean;
  apikey: string;
  groups: string[];
  name: string;
  needs: Needs;
  permissions: any[];
  roles: string[];
  settings: Settings;
  user: boolean;
}

export interface Needs {
  group: string[];
  role: string[];
}

export interface Settings {
  interface: Interface;
}

export interface Interface {
  language: string;
}
