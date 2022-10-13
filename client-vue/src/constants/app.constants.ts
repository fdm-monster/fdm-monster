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
    maxPrinterGroupNameLength: 15,
    maxPrinterGroupLocationX: 4,
    maxPrinterGroupLocationY: 4,
    minPrinterFloorNameLength: 3,
  }) as Readonly<AppConstants>;
