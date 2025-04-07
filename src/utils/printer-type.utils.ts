export function isOctoPrintType(printerType?: number) {
  return printerType === 0;
}

export function isMoonrakerType(printerType?: number) {
  return printerType === 1;
}

export function getServiceName(printerType?: number) {
  return isOctoPrintType(printerType) ? "OctoPrint" : isMoonrakerType(printerType) ? "Moonraker" : "Unknown";
}
