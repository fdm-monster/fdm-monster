export interface MachinePeripheralsCanbusDto {
  can_uuids: CanUuid[];
}

export interface CanUuid {
  uuid: string;
  application: string;
}
