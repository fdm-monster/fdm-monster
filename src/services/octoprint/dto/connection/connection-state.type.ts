export const connectionStates = {
  Operational: "Operational",
  Printing: "Printing",
  "Starting print from SD": "Starting print from SD",
  "Starting to send file to SD": "Starting to send file to SD",
  "Printing from SD": "Printing from SD",
  "Transferring file to SD": "Transferring file to SD",
  "Sending file to SD": "Sending file to SD",
  Starting: "Starting",
  Pausing: "Pausing",
  Paused: "Paused",
  Resuming: "Resuming",
  Finishing: "Finishing",
  Cancelling: "Cancelling",
  Error: "Error",
  Closed: "Closed",
  Offline: "Offline",
  "Offline after error": "Offline after error",
  "Opening serial connection": "Opening serial connection",
  "Detecting serial connection": "Detecting serial connection",
  "Unknown State": "Unknown State",
} as const;

export type ConnectionState = keyof typeof connectionStates;
