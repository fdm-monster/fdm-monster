const MESSAGE = {
  offline: "OctoPrint instance seems to be offline",
  retryingApiConnection: "OctoPrint is offline. Retry has been scheduled.",
  notOctoPrint: "Not OctoPrint as host responded with incompatible response",
  badRequest: "OctoPrint login responded with bad request. This is a bug",
  apiKeyNotAccepted: "OctoPrint apiKey was rejected.",
  disabled: "Printer was disabled explicitly",
  globalAPIKeyDetected: "Global API Key was detected (username/name was '_api')",
  missingSessionKey: "Missing session key in login response",
};
const ERR_COUNT = {
  offline: "offline",
  notOctoPrint: "notOctoPrint",
  apiKeyNotAccepted: "apiKeyNotAccepted",
  apiKeyIsGlobal: "apiKeyIsGlobal",
  missingSessionKey: "missingSessionKey",
};

// State category
const CATEGORY = {
  Idle: "Idle",
  Disabled: "Disabled",
  Offline: "Offline",
  Disconnected: "Disconnected",
  Complete: "Complete",
  Error: "Error",
  Active: "Active",
};

// https://github.com/OctoPrint/OctoPrint/blob/161e21fe0f6344ec3b9b9b541e9b2c472087ba77/src/octoprint/util/comm.py#L913
const OP_STATE = {
  Offline: "Offline",
  OpeningSerial: "Opening serial connection",
  DetectingSerial: "Detecting serial connection",
  Connecting: "Connecting",
  Operational: "Operational",
  StartingPrintFromSD: "Starting print from SD", // Starting
  StartSendingPrintToSD: "Starting to send file to SD", // Starting
  Starting: "Starting", // Starting
  TransferringFileToSD: "Transferring file to SD", // Transferring
  PrintingFromSD: "Printing from SD", // Printing
  SendingFileToSD: "Sending file to SD", // Printing
  Printing: "Printing", // Printing,
  Cancelling: "Cancelling",
  Pausing: "Pausing",
  Paused: "Paused",
  Resuming: "Resuming",
  Finishing: "Finishing",
  Error: "Error",
  OfflineAfterError: "Offline after error",
  UnknownState: "Unknown State ()", // Unknown State (...) needs proper parsing
};

// All states of the app. Nice to share between server and client
const PSTATE = {
  Offline: "Offline",
  Loading: "Loading",
  Disabled: "Disabled",
  GlobalAPIKey: "Global API Key Issue",
  ApiKeyRejected: "API Key rejected",
  Searching: "Searching...",
  Error: "Error!",
  NoAPI: "No-API",
  Disconnected: "Disconnected",
  Starting: "Starting",
  Operational: "Operational",
  Paused: "Paused",
  Printing: "Printing",
  Pausing: "Pausing",
  Cancelling: "Cancelling",
  OfflineAfterError: "Offline after error",
  Complete: "Complete",
  Shutdown: "Shutdown",
  Online: "Online",
};

const FDM_STATE_REMAP = {
  [OP_STATE.Offline]: {
    state: PSTATE.Disconnected, // hard remap!
    desc: "Your printer is disconnected",
  },
  [OP_STATE.OpeningSerial]: {
    state: PSTATE.Searching, // Lack of better
    desc: "Your printer is connecting to serial",
  },
  [OP_STATE.DetectingSerial]: {
    state: PSTATE.Searching, // Lack of better
    desc: "Your printer is detecting serial connections",
  },
  [OP_STATE.Connecting]: {
    state: PSTATE.Connecting,
    desc: "Your printer is connecting to serial",
  },
  [OP_STATE.Operational]: {
    state: PSTATE.Operational,
    desc: "Printer is ready to print",
  },
  [OP_STATE.StartingPrintFromSD]: {
    state: PSTATE.Searching,
    desc: "STARTING PRINT FROM SD!",
  },
  [OP_STATE.StartSendingPrintToSD]: {
    state: PSTATE.Searching,
    desc: "Starting to send file to SD",
  },
  [OP_STATE.Starting]: {
    state: PSTATE.Starting,
    desc: "Printing right now",
  },
  [OP_STATE.TransferringFileToSD]: {
    state: PSTATE.Searching,
    desc: "Transferring to SD",
  },
  [OP_STATE.SendingFileToSD]: {
    state: PSTATE.Searching,
    desc: "Busy sending file to SD",
  },
  [OP_STATE.PrintingFromSD]: {
    state: PSTATE.Printing,
    desc: "PRINTING FROM SD!",
  },
  [OP_STATE.Printing]: {
    state: PSTATE.Printing,
    desc: "Printing right now",
  },
  [OP_STATE.Cancelling]: {
    state: PSTATE.Cancelling,
    desc: "Print is cancelling",
  },
  [OP_STATE.Pausing]: {
    state: PSTATE.Pausing,
    desc: "Printing paused",
  },
  [OP_STATE.Paused]: {
    state: PSTATE.Paused,
    desc: "Printing paused",
  },
  [OP_STATE.Resuming]: {
    state: PSTATE.Starting,
    desc: "Print resuming",
  },
  [OP_STATE.Finishing]: {
    state: PSTATE.Complete,
    desc: "Print finishing",
  },
  [OP_STATE.UnknownState]: {
    state: "Unknown state",
    desc: "Unknown state",
  },
};

function remapOctoPrintState(octoPrintState) {
  // Handy stuff!
  const flags = octoPrintState.flags;
  const stateLabel = octoPrintState.text;

  const stateLabelLower = stateLabel?.toLowerCase();
  if (stateLabelLower?.includes("error")) {
    return {
      state: PSTATE.Error,
      flags,
      desc: stateLabel,
    };
  }

  const mapping = FDM_STATE_REMAP[stateLabel] || {};
  mapping.flags = flags;
  if (!!mapping) return mapping;

  return {
    state: stateLabel,
    flags,
    desc: "OctoPrint's state was not recognized",
  };
}

const mapStateToColor = (state) => {
  if (state === PSTATE.Loading) {
    return { name: "dark", hex: "#262626", category: CATEGORY.Idle };
  }
  if (state === PSTATE.Operational) {
    return { name: "dark", hex: "#262626", category: CATEGORY.Idle };
  }
  if (state === PSTATE.Online) {
    return { name: "success", hex: "#00330e", category: CATEGORY.Idle };
  }
  if (state === PSTATE.Paused) {
    return { name: "warning", hex: "#5b0d69", category: CATEGORY.Idle };
  }
  if (state === PSTATE.Printing) {
    return { name: "success", hex: "#583c0e", category: CATEGORY.Active };
  }
  if (state === PSTATE.Pausing) {
    return { name: "warning", hex: "#60176e", category: CATEGORY.Active };
  }
  if (state === PSTATE.Cancelling) {
    return { name: "warning", hex: "#583c0e", category: CATEGORY.Active };
  }
  if (state === PSTATE.Starting) {
    return { name: "warning", hex: "#583c0e", category: CATEGORY.Active };
  }
  if (state === PSTATE.Disabled) {
    return { name: "secondary", hex: "#050c2e", category: CATEGORY.Disabled };
  }
  if (state === PSTATE.Offline) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Offline };
  }
  if (state === PSTATE.Searching) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Offline };
  }
  if (state === PSTATE.NoAPI) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Offline };
  }
  if (state === PSTATE.Shutdown) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Offline };
  }
  if (state === PSTATE.Disconnected) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Disconnected };
  }
  if (state === PSTATE.Complete) {
    return { name: "success", hex: "#00330e", category: CATEGORY.Complete };
  }
  if (state === PSTATE.ApiKeyRejected) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Error };
  }
  if (state === PSTATE.GlobalAPIKey) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Error };
  }
  if (state === PSTATE.Error) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Error };
  }
  if (state === PSTATE.OfflineAfterError) {
    return { name: "danger", hex: "#2e0905", category: CATEGORY.Error };
  }

  console.warn("Provided PSTATE not recognized:", state);
  return { name: "warning", hex: "#583c0e", category: CATEGORY.Active };
};

module.exports = {
  mapStateToColor,
  remapOctoPrintState,
  ERR_COUNT,
  MESSAGE,
  PSTATE,
  OP_STATE,
  CATEGORY,
};
