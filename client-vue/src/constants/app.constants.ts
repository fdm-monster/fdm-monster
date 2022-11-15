export interface AppConstants {
  apiKeyLength: number;
  maxPort: number;
  maxPrinterNameLength: number;
  maxPrinterGroupNameLength: number;
  maxPrinterGroupLocationX: number;
  maxPrinterGroupLocationY: number;
  minPrinterFloorNameLength: number;
}

export const generateAppConstants = (): Readonly<AppConstants> =>
  Object.freeze({
    apiKeyLength: 32,
    maxPort: 65535,
    maxPrinterNameLength: 25,
    maxPrinterGroupNameLength: 30, // Doesn't exist on backend
    maxPrinterGroupLocationX: 4,
    maxPrinterGroupLocationY: 4,
    minPrinterFloorNameLength: 3,
  }) as Readonly<AppConstants>;

export const defaultBedTempOverride = false;
export const defaultBedTemp = 30;
