export interface MachinePeripheralsVideoDto {
  v4l2_devices: V4l2Device[];
  libcamera_devices: LibcameraDevice[];
}

export interface V4l2Device {
  device_name: string;
  device_path: string;
  camera_name: string;
  driver_name: string;
  hardware_bus: string;
  capabilities: string[];
  version: string;
  path_by_hardware?: string;
  path_by_id?: string;
  alt_name: string;
  usb_location?: string;
}

export interface LibcameraDevice {
  libcamera_id: string;
  model: string;
  modes: Mode[];
}

export interface Mode {
  format: string;
  resolutions: string[];
}
