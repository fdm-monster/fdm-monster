export interface MachinePeripheralsUsbDto {
  usb_devices: UsbDevice[];
}

export interface UsbDevice {
  device_num: number
  bus_num: number
  vendor_id: string
  product_id: string
  usb_location: string
  manufacturer: string
  product: string
  serial?: string
  class?: string
  subclass: any
  protocol?: string
  description: string
}
