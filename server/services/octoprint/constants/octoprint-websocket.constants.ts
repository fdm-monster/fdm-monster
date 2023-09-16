export const EVENT_TYPES = {
  ClientAuthed: "ClientAuthed",
  ClientClosed: "ClientClosed",
  ClientOpened: "ClientOpened",
  Connected: "Connected",
  Disconnecting: "Disconnecting",
  Disconnected: "Disconnected",
  Dwelling: "Dwell",
  Eject: "Eject",
  Error: "Error",
  EStop: "EStop",
  FileAdded: "FileAdded",
  FileDeselected: "FileDeselected",
  FileRemoved: "FileRemoved",
  FirmwareData: "FirmwareData", // Not modeled yet
  FolderAdded: "FolderAdded",
  FolderRemoved: "FolderRemoved", // Not modeled yet
  Home: "Home",
  MetadataAnalysisFinished: "MetadataAnalysisFinished",
  MetadataAnalysisStarted: "MetadataAnalysisStarted",
  MetadataStatisticsUpdated: "MetadataStatisticsUpdated",
  PositionUpdate: "PositionUpdate",
  PowerOff: "PowerOff",
  PowerOn: "PowerOn",
  PrintCancelled: "PrintCancelled",
  PrintCancelling: "PrintCancelling",
  PrintDone: "PrintDone",
  PrintFailed: "PrintFailed",
  PrintPaused: "PrintPaused",
  PrintResumed: "PrintResumed",
  PrintStarted: "PrintStarted",
  PrinterStateChanged: "PrinterStateChanged",
  TransferDone: "TransferDone",
  TransferStarted: "TransferStarted",
  UpdatedFiles: "UpdatedFiles",
  Upload: "Upload",
  UserLoggedIn: "UserLoggedIn",
  Waiting: "Waiting",
  ZChange: "ZChange",
};

export const OP_WS_MSG = {
  connected: "connected",
  reauthRequired: "reauthRequired",
  current: "current",
  history: "history",
  event: "event",
  plugin: "plugin",
  timelapse: "timelapse",
  slicingProgress: "slicingProgress",
};

export const OP_WS_SKIP = [OP_WS_MSG.slicingProgress, OP_WS_MSG.timelapse];

export const WS_STATE = {
  unopened: "unopened",
  opening: "opening",
  connected: "connected",
  authed: "authed",
  errored: "errored", // Not a disconnect error
  closed: "closed", // Closing error received
};
