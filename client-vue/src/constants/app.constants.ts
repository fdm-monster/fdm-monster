export interface AppConstants {
  apiKeyLength: number;
  maxPort: number;
  maxPrinterNameLength: number;
}
export const generateAppConstants = (): Readonly<AppConstants> =>
  Object.freeze({
    apiKeyLength: 32,
    maxPort: 65535,
    maxPrinterNameLength: 25
  }) as Readonly<AppConstants>;
