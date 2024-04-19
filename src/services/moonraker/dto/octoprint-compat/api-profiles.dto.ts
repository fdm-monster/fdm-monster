export interface ApiProfilesDto {
  profiles: Profiles;
}

export interface Profiles {
  _default: Default;
}

export interface Default {
  id: string;
  name: string;
  color: string;
  model: string;
  default: boolean;
  current: boolean;
  heatedBed: boolean;
  heatedChamber: boolean;
}
