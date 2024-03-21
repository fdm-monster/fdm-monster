export interface MachinePeripheralsSerialDto {
  serial_devices: SerialDevice[];
}

export interface SerialDevice {
  device_type: string;
  device_path: string;
  device_name: string;
  driver_name: string;
  path_by_hardware?: string;
  path_by_id?: string;
  usb_location?: string;
}
