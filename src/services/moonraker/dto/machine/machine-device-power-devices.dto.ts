export interface MachineDevicePowerDevicesDto {
  devices: Device[];
}

export interface Device {
  device: string;
  status: string;
  locked_while_printing: boolean;
  type: string;
}
