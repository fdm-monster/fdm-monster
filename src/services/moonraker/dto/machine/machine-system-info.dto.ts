export interface MachineSystemInfoDto {
  system_info: SystemInfo;
}

export interface SystemInfo {
  cpu_info: CpuInfo;
  sd_info: SdInfo;
  distribution: Distribution;
  available_services: string[];
  instance_ids: InstanceIds;
  service_state: ServiceState;
  virtualization: Virtualization;
  python: Python;
  network: Network;
  canbus: Canbus;
}

export interface CpuInfo {
  cpu_count: number;
  bits: string;
  processor: string;
  cpu_desc: string;
  serial_number: string;
  hardware_desc: string;
  model: string;
  total_memory: number;
  memory_units: string;
}

export interface SdInfo {
  manufacturer_id: string;
  manufacturer: string;
  oem_id: string;
  product_name: string;
  product_revision: string;
  serial_number: string;
  manufacturer_date: string;
  capacity: string;
  total_bytes: number;
}

export interface Distribution {
  name: string;
  id: string;
  version: string;
  version_parts: VersionParts;
  like: string;
  codename: string;
}

export interface VersionParts {
  major: string;
  minor: string;
  build_number: string;
}

export interface InstanceIds {
  moonraker: string;
  klipper: string;
}

export interface ServiceState {
  klipper: Klipper;
  klipper_mcu: KlipperMcu;
  moonraker: Moonraker;
}

export interface Klipper {
  active_state: string;
  sub_state: string;
}

export interface KlipperMcu {
  active_state: string;
  sub_state: string;
}

export interface Moonraker {
  active_state: string;
  sub_state: string;
}

export interface Virtualization {
  virt_type: string;
  virt_identifier: string;
}

export interface Python {
  version: [number, number, number, string, number];
  version_string: string;
}

export interface Network {
  wlan0: NetworkInterface;
  eth0?: NetworkInterface;
  [k: string]: NetworkInterface;
}

export interface NetworkInterface {
  mac_address: string;
  ip_addresses: IpAddress[];
}

export interface IpAddress {
  family: string;
  address: string;
  is_link_local: boolean;
}

export interface Canbus {
  can0: CanBusInterface;
  can1: CanBusInterface;
  [k: string]: CanBusInterface;
}

export interface CanBusInterface {
  tx_queue_len: number;
  bitrate: number;
  driver: string;
}
