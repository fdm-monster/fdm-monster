export interface AppConstants {
  apiKeyLength: number;
  maxPort: number;
}
export const generateAppConstants = (): Readonly<AppConstants> =>
  Object.freeze({
    apiKeyLength: 32,
    maxPort: 65535
  }) as Readonly<AppConstants>;
