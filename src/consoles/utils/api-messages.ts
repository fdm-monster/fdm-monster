export const printerHistorySuccessResponse = {
  sd: {
    ready: true,
  },
  state: {
    error: "",
    flags: {
      cancelling: false,
      closedOrError: false,
      error: false,
      finishing: false,
      operational: true,
      paused: false,
      pausing: false,
      printing: false,
      ready: true,
      resuming: false,
      sdReady: true,
    },
    text: "Operational",
  },
  temperature: {
    bed: {
      actual: 21.3,
      offset: 0,
      target: 0.0,
    },
    history: [
      {
        bed: {
          actual: 21.3,
          target: 0.0,
        },
        time: 1743539488,
        tool0: {
          actual: 21.3,
          target: 0.0,
        },
      },
    ],
    tool0: {
      actual: 21.3,
      offset: 0,
      target: 0.0,
    },
  },
};

export const connectionSuccessResponse = {
  current: {
    baudrate: 115200,
    port: "VIRTUAL",
    printerProfile: "_default",
    state: "Operational",
  },
  options: {
    baudratePreference: null,
    baudrates: [250000, 230400, 115200, 57600, 38400, 19200, 9600],
    portPreference: null,
    ports: ["VIRTUAL"],
    printerProfilePreference: "_default",
    printerProfiles: [
      {
        id: "_default",
        name: "Default",
      },
    ],
  },
};

export const jobSuccessResponse = {
  job: {
    averagePrintTime: null,
    estimatedPrintTime: null,
    filament: null,
    file: {
      date: null,
      display: null,
      name: null,
      origin: null,
      path: null,
      size: null,
    },
    lastPrintTime: null,
    user: null,
  },
  progress: {
    completion: null,
    filepos: null,
    printTime: null,
    printTimeLeft: null,
    printTimeLeftOrigin: null,
  },
  state: "Operational",
};

export const filesSuccessResponse = {
  files: [
    {
      continuousprint: {
        profile: "",
      },
      date: 1742036424,
      display: "18x P6188B_PLA-zwart_6h5m_91g 1x 804003277-bat.gcode",
      gcodeAnalysis: {
        dimensions: {
          depth: 170.3,
          height: 17.6,
          width: 187.3,
        },
        estimatedPrintTime: 18601.55497923338,
        filament: {
          tool0: {
            length: 30448.459149999788,
            volume: 0.0,
          },
        },
        printingArea: {
          maxX: 187.3,
          maxY: 167.3,
          maxZ: 17.6,
          minX: 0.0,
          minY: -3.0,
          minZ: 0.0,
        },
        travelArea: {
          maxX: 187.3,
          maxY: 210.0,
          maxZ: 18.2,
          minX: 0.0,
          minY: -3.0,
          minZ: 0.0,
        },
        travelDimensions: {
          depth: 213.0,
          height: 18.2,
          width: 187.3,
        },
      },
      hash: "89a6394333c1c556d0eea89178a9891281bb346f",
      name: "18x P6188B_PLA-zwart_6h5m_91g 1x 804003277-bat.gcode",
      origin: "local",
      path: "18x P6188B_PLA-zwart_6h5m_91g 1x 804003277-bat.gcode",
      prints: {
        failure: 0,
        last: {
          date: 1742037542.399866,
          printTime: 1118.222205992788,
          success: true,
        },
        success: 1,
      },
      refs: {
        download:
          "https://op5.op.fdm-monster.net/downloads/files/local/18x%20P6188B_PLA-zwart_6h5m_91g%201x%20804003277-bat.gcode",
        resource:
          "https://op5.op.fdm-monster.net/api/files/local/18x%20P6188B_PLA-zwart_6h5m_91g%201x%20804003277-bat.gcode",
      },
      size: 8281607,
      statistics: {
        averagePrintTime: {
          _default: 1118.222205992788,
        },
        lastPrintTime: {
          _default: 1118.222205992788,
        },
      },
      type: "machinecode",
      typePath: ["machinecode", "gcode"],
    },
    {
      continuousprint: {
        profile: "",
      },
      date: 1742888936,
      display: "big (1).gcode",
      gcodeAnalysis: {
        _empty: true,
        dimensions: {
          depth: 0,
          height: 0,
          width: 0,
        },
        filament: {},
        printingArea: {
          maxX: 0,
          maxY: 0,
          maxZ: 0,
          minX: 0,
          minY: 0,
          minZ: 0,
        },
        travelArea: {
          maxX: 0,
          maxY: 0,
          maxZ: 0,
          minX: 0,
          minY: 0,
          minZ: 0,
        },
        travelDimensions: {
          depth: 0,
          height: 0,
          width: 0,
        },
      },
      hash: "7272a158a9e3e68f5766d834d2ae9e887fef81a0",
      name: "big (1).gcode",
      origin: "local",
      path: "big (1).gcode",
      prints: {
        failure: 0,
        last: {
          date: 1742888940.8894498,
          printTime: 4.616385165601969,
          success: true,
        },
        success: 1,
      },
      refs: {
        download: "https://op5.op.fdm-monster.net/downloads/files/local/big%20%281%29.gcode",
        resource: "https://op5.op.fdm-monster.net/api/files/local/big%20(1).gcode",
      },
      size: 8396,
      statistics: {
        averagePrintTime: {
          _default: 4.616385165601969,
        },
        lastPrintTime: {
          _default: 4.616385165601969,
        },
      },
      type: "machinecode",
      typePath: ["machinecode", "gcode"],
    },
    {
      continuousprint: {
        profile: "",
      },
      date: 1742040641,
      display: "Clay Golem Updated_0.05mm_PLA_MK3S_7h40m_1.gcode",
      gcodeAnalysis: {
        dimensions: {
          depth: 123.338,
          height: 52.8,
          width: 143.439,
        },
        estimatedPrintTime: 8567.72838752894,
        filament: {
          tool0: {
            length: 1786.6972100005858,
            volume: 4.297510416050528,
          },
        },
        printingArea: {
          maxX: 143.439,
          maxY: 120.338,
          maxZ: 52.8,
          minX: 0.0,
          minY: -3.0,
          minZ: 0.0,
        },
        travelArea: {
          maxX: 143.439,
          maxY: 200.0,
          maxZ: 101.8,
          minX: 0.0,
          minY: -3.0,
          minZ: 0.0,
        },
        travelDimensions: {
          depth: 203.0,
          height: 101.8,
          width: 143.439,
        },
      },
      hash: "121d6d483e71bd057887a521546ac000c1ef50fb",
      name: "Clay Golem Updated_0.05mm_PLA_MK3S_7h40m_1.gcode",
      origin: "local",
      path: "Clay Golem Updated_0.05mm_PLA_MK3S_7h40m_1.gcode",
      refs: {
        download:
          "https://op5.op.fdm-monster.net/downloads/files/local/Clay%20Golem%20Updated_0.05mm_PLA_MK3S_7h40m_1.gcode",
        resource: "https://op5.op.fdm-monster.net/api/files/local/Clay%20Golem%20Updated_0.05mm_PLA_MK3S_7h40m_1.gcode",
      },
      size: 9019620,
      type: "machinecode",
      typePath: ["machinecode", "gcode"],
    },
    {
      continuousprint: {
        profile: "",
      },
      date: 1742040672,
      display: "Clay Golem Updated_0.05mm_PLA_MK3S_7h40m_2.gcode",
      gcodeAnalysis: {
        dimensions: {
          depth: 123.338,
          height: 52.8,
          width: 143.439,
        },
        estimatedPrintTime: 8567.72838752894,
        filament: {
          tool0: {
            length: 1786.6972100005858,
            volume: 4.297510416050528,
          },
        },
        printingArea: {
          maxX: 143.439,
          maxY: 120.338,
          maxZ: 52.8,
          minX: 0.0,
          minY: -3.0,
          minZ: 0.0,
        },
        travelArea: {
          maxX: 143.439,
          maxY: 200.0,
          maxZ: 101.8,
          minX: 0.0,
          minY: -3.0,
          minZ: 0.0,
        },
        travelDimensions: {
          depth: 203.0,
          height: 101.8,
          width: 143.439,
        },
      },
      hash: "121d6d483e71bd057887a521546ac000c1ef50fb",
      name: "Clay Golem Updated_0.05mm_PLA_MK3S_7h40m_2.gcode",
      origin: "local",
      path: "Clay Golem Updated_0.05mm_PLA_MK3S_7h40m_2.gcode",
      refs: {
        download:
          "https://op5.op.fdm-monster.net/downloads/files/local/Clay%20Golem%20Updated_0.05mm_PLA_MK3S_7h40m_2.gcode",
        resource: "https://op5.op.fdm-monster.net/api/files/local/Clay%20Golem%20Updated_0.05mm_PLA_MK3S_7h40m_2.gcode",
      },
      size: 9019620,
      type: "machinecode",
      typePath: ["machinecode", "gcode"],
    },
    {
      children: [
        {
          children: [],
          date: 1731920596,
          display: "fileshare",
          name: "fileshare",
          origin: "local",
          path: "ContinuousPrint/fileshare",
          prints: {
            failure: 0,
            success: 0,
          },
          refs: {
            resource: "https://op5.op.fdm-monster.net/api/files/local/ContinuousPrint/fileshare",
          },
          size: 0,
          type: "folder",
          typePath: ["folder"],
        },
      ],
      date: 1731920596,
      display: "ContinuousPrint",
      name: "ContinuousPrint",
      origin: "local",
      path: "ContinuousPrint",
      prints: {
        failure: 0,
        success: 0,
      },
      refs: {
        resource: "https://op5.op.fdm-monster.net/api/files/local/ContinuousPrint",
      },
      size: 0,
      type: "folder",
      typePath: ["folder"],
    },
    {
      continuousprint: {
        profile: "",
      },
      date: 1742040470,
      display: "xyzCalibration_cube_40m_0.32mm_219C_PLA_ENDER3V2NEO.gcode",
      gcodeAnalysis: {
        dimensions: {
          depth: 130.0,
          height: 34.88,
          width: 121.451,
        },
        estimatedPrintTime: 2190.4504183741656,
        filament: {
          tool0: {
            length: 2741.0162800000403,
            volume: 6.5929167784732705,
          },
        },
        printingArea: {
          maxX: 123.451,
          maxY: 140.0,
          maxZ: 34.88,
          minX: 2.0,
          minY: 10.0,
          minZ: 0.0,
        },
        travelArea: {
          maxX: 123.451,
          maxY: 187.0,
          maxZ: 150.0,
          minX: 0.0,
          minY: 0.0,
          minZ: 0.0,
        },
        travelDimensions: {
          depth: 187.0,
          height: 150.0,
          width: 123.451,
        },
      },
      hash: "944592652bb8349a2751a14bd1c3459fb7e43f39",
      name: "xyzCalibration_cube_40m_0.32mm_219C_PLA_ENDER3V2NEO.gcode",
      origin: "local",
      path: "xyzCalibration_cube_40m_0.32mm_219C_PLA_ENDER3V2NEO.gcode",
      prints: {
        failure: 0,
        last: {
          date: 1742041017.0843625,
          printTime: 156.5364972576499,
          success: true,
        },
        success: 3,
      },
      refs: {
        download:
          "https://op5.op.fdm-monster.net/downloads/files/local/xyzCalibration_cube_40m_0.32mm_219C_PLA_ENDER3V2NEO.gcode",
        resource:
          "https://op5.op.fdm-monster.net/api/files/local/xyzCalibration_cube_40m_0.32mm_219C_PLA_ENDER3V2NEO.gcode",
      },
      size: 897615,
      statistics: {
        averagePrintTime: {
          _default: 156.70913114398718,
        },
        lastPrintTime: {
          _default: 156.5364972576499,
        },
      },
      type: "machinecode",
      typePath: ["machinecode", "gcode"],
    },
    {
      continuousprint: {
        profile: "",
      },
      date: 1742036412,
      display: "David_SHORT (1).gcode",
      gcodeAnalysis: {
        _empty: true,
        dimensions: {
          depth: 0,
          height: 0,
          width: 0,
        },
        filament: {},
        printingArea: {
          maxX: 0,
          maxY: 0,
          maxZ: 0,
          minX: 0,
          minY: 0,
          minZ: 0,
        },
        travelArea: {
          maxX: 0,
          maxY: 0,
          maxZ: 0,
          minX: 0,
          minY: 0,
          minZ: 0,
        },
        travelDimensions: {
          depth: 0,
          height: 0,
          width: 0,
        },
      },
      hash: "d5d4cd07616a542891b7ec2d0257b3a24b69856e",
      name: "David_SHORT (1).gcode",
      origin: "local",
      path: "David_SHORT (1).gcode",
      prints: {
        failure: 0,
        last: {
          date: 1742036412.2240696,
          printTime: 0.033899541944265366,
          success: true,
        },
        success: 1,
      },
      refs: {
        download: "https://op5.op.fdm-monster.net/downloads/files/local/David_SHORT%20%281%29.gcode",
        resource: "https://op5.op.fdm-monster.net/api/files/local/David_SHORT%20(1).gcode",
      },
      size: 9,
      statistics: {
        averagePrintTime: {
          _default: 0.033899541944265366,
        },
        lastPrintTime: {
          _default: 0.033899541944265366,
        },
      },
      type: "machinecode",
      typePath: ["machinecode", "gcode"],
    },
    {
      continuousprint: {
        profile: "",
      },
      date: 1740517061,
      display: "alien controller holder #0-10-000-.gcode",
      gcodeAnalysis: {
        dimensions: {
          depth: 206.436,
          height: 37.5,
          width: 236.449,
        },
        estimatedPrintTime: 62557.34672315975,
        filament: {
          tool0: {
            length: 153112.8932601685,
            volume: 368.27966704945544,
          },
        },
        printingArea: {
          maxX: 236.449,
          maxY: 203.436,
          maxZ: 37.5,
          minX: 0.0,
          minY: -3.0,
          minZ: 0.0,
        },
        travelArea: {
          maxX: 236.449,
          maxY: 203.436,
          maxZ: 67.9,
          minX: 0.0,
          minY: -3.0,
          minZ: 0.0,
        },
        travelDimensions: {
          depth: 206.436,
          height: 67.9,
          width: 236.449,
        },
      },
      hash: "70f7e1cae64ad71cb78413b3ab937e844452f102",
      name: "alien controller holder #0-10-000-.gcode",
      origin: "local",
      path: "alien controller holder #0-10-000-.gcode",
      prints: {
        failure: 1,
        last: {
          date: 1741093498.6078453,
          printTime: 3552.650878082961,
          success: true,
        },
        success: 1,
      },
      refs: {
        download:
          "https://op5.op.fdm-monster.net/downloads/files/local/alien%20controller%20holder%20%230-10-000-.gcode",
        resource: "https://op5.op.fdm-monster.net/api/files/local/alien%20controller%20holder%20%230-10-000-.gcode",
      },
      size: 30505246,
      statistics: {
        averagePrintTime: {
          _default: 3552.650878082961,
        },
        lastPrintTime: {
          _default: 3552.650878082961,
        },
      },
      type: "machinecode",
      typePath: ["machinecode", "gcode"],
    },
    {
      continuousprint: {
        profile: "",
      },
      date: 1742040150,
      display: "alien controller holder #0-10-000- (1).gcode",
      gcodeAnalysis: {
        dimensions: {
          depth: 206.436,
          height: 37.5,
          width: 236.449,
        },
        estimatedPrintTime: 62557.34672315975,
        filament: {
          tool0: {
            length: 153112.8932601685,
            volume: 368.27966704945544,
          },
        },
        printingArea: {
          maxX: 236.449,
          maxY: 203.436,
          maxZ: 37.5,
          minX: 0.0,
          minY: -3.0,
          minZ: 0.0,
        },
        travelArea: {
          maxX: 236.449,
          maxY: 203.436,
          maxZ: 67.9,
          minX: 0.0,
          minY: -3.0,
          minZ: 0.0,
        },
        travelDimensions: {
          depth: 206.436,
          height: 67.9,
          width: 236.449,
        },
      },
      hash: "70f7e1cae64ad71cb78413b3ab937e844452f102",
      name: "alien controller holder #0-10-000- (1).gcode",
      origin: "local",
      path: "alien controller holder #0-10-000- (1).gcode",
      prints: {
        failure: 1,
        last: {
          date: 1742040265.1026235,
          success: false,
        },
        success: 1,
      },
      refs: {
        download:
          "https://op5.op.fdm-monster.net/downloads/files/local/alien%20controller%20holder%20%230-10-000-%20%281%29.gcode",
        resource:
          "https://op5.op.fdm-monster.net/api/files/local/alien%20controller%20holder%20%230-10-000-%20(1).gcode",
      },
      size: 30505246,
      statistics: {
        averagePrintTime: {
          _default: 3578.1000741794705,
        },
        lastPrintTime: {
          _default: 3578.1000741794705,
        },
      },
      type: "machinecode",
      typePath: ["machinecode", "gcode"],
    },
    {
      continuousprint: {
        profile: "",
      },
      date: 1742040887,
      display: "Clay Golem Updated_0.05mm_PLA_MK3S_7h40m.gcode",
      gcodeAnalysis: {
        dimensions: {
          depth: 123.338,
          height: 52.8,
          width: 143.439,
        },
        estimatedPrintTime: 8567.72838752894,
        filament: {
          tool0: {
            length: 1786.6972100005858,
            volume: 4.297510416050528,
          },
        },
        printingArea: {
          maxX: 143.439,
          maxY: 120.338,
          maxZ: 52.8,
          minX: 0.0,
          minY: -3.0,
          minZ: 0.0,
        },
        travelArea: {
          maxX: 143.439,
          maxY: 200.0,
          maxZ: 101.8,
          minX: 0.0,
          minY: -3.0,
          minZ: 0.0,
        },
        travelDimensions: {
          depth: 203.0,
          height: 101.8,
          width: 143.439,
        },
      },
      hash: "121d6d483e71bd057887a521546ac000c1ef50fb",
      name: "Clay Golem Updated_0.05mm_PLA_MK3S_7h40m.gcode",
      origin: "local",
      path: "Clay Golem Updated_0.05mm_PLA_MK3S_7h40m.gcode",
      prints: {
        failure: 2,
        last: {
          date: 1742717782.7766643,
          printTime: 573.5871216394007,
          success: true,
        },
        success: 1,
      },
      refs: {
        download:
          "https://op5.op.fdm-monster.net/downloads/files/local/Clay%20Golem%20Updated_0.05mm_PLA_MK3S_7h40m.gcode",
        resource: "https://op5.op.fdm-monster.net/api/files/local/Clay%20Golem%20Updated_0.05mm_PLA_MK3S_7h40m.gcode",
      },
      size: 9019620,
      statistics: {
        averagePrintTime: {
          _default: 573.5871216394007,
        },
        lastPrintTime: {
          _default: 573.5871216394007,
        },
      },
      type: "machinecode",
      typePath: ["machinecode", "gcode"],
    },
    {
      continuousprint: {
        profile: "",
      },
      date: 1743493156,
      display: "7_grip_0.4n_0.2mm_PLA_MK4IS_4h42m.gcode",
      gcodeAnalysis: {
        dimensions: {
          depth: 162.273,
          height: 201.0,
          width: 153.911,
        },
        estimatedPrintTime: 12167.990902725953,
        filament: {
          tool0: {
            length: 62814.77011000289,
            volume: 151.0872280533019,
          },
        },
        printingArea: {
          maxX: 153.911,
          maxY: 158.273,
          maxZ: 201.0,
          minX: 0.0,
          minY: -4.0,
          minZ: 0.0,
        },
        travelArea: {
          maxX: 241.0,
          maxY: 170.0,
          maxZ: 220.0,
          minX: 0.0,
          minY: -4.0,
          minZ: 0.0,
        },
        travelDimensions: {
          depth: 174.0,
          height: 220.0,
          width: 241.0,
        },
      },
      hash: "864ce4b341d692349c9ef89805de5fb73de8c34b",
      name: "7_grip_0.4n_0.2mm_PLA_MK4IS_4h42m.gcode",
      origin: "local",
      path: "7_grip_0.4n_0.2mm_PLA_MK4IS_4h42m.gcode",
      prints: {
        failure: 1,
        last: {
          date: 1743493322.92369,
          success: false,
        },
        success: 0,
      },
      refs: {
        download: "https://op5.op.fdm-monster.net/downloads/files/local/7_grip_0.4n_0.2mm_PLA_MK4IS_4h42m.gcode",
        resource: "https://op5.op.fdm-monster.net/api/files/local/7_grip_0.4n_0.2mm_PLA_MK4IS_4h42m.gcode",
      },
      size: 14103469,
      statistics: {
        averagePrintTime: {},
        lastPrintTime: {},
      },
      type: "machinecode",
      typePath: ["machinecode", "gcode"],
    },
  ],
  free: 14280564736,
  total: 311993479168,
};
