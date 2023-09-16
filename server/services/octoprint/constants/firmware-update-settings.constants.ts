export const defaultFirmwareUpdaterSettings = {
  disable_filefilter: false,
  enable_navbar: true,
  enable_profiles: false,
  maximum_fw_size_kb: 5120,
  prevent_connection_when_flashing: true,
  profiles: [
    {
      _id: 0,
      _name: "Default",
      avrdude_avrmcu: "m2560",
      avrdude_path: "/usr/bin/avrdude",
      avrdude_programmer: "wiring",
      enable_postflash_delay: true,
      flash_method: "avrdude",
      postflash_delay: 1,
      // serial_port: "/dev/op3" @todo
    },
  ],
  save_url: false,
};
