import { registerAs } from "@nestjs/config";
import { Logger } from "@nestjs/common";

export const jwtSecretToken = "JWT_SECRET";
export const jwtExpirySecsToken = "JWT_EXPIRY_SECS";

export const JWT_OPTIONS = "JWT_MODULE_OPTIONS";

// Two JWT expiry settings
export const defaultJwtSecret = `auto-jwt-fdm-monster-11-${new Date().getMonth()}-2022`;
export const defaultJwtExpiry = 60;

const logger = new Logger("AuthConfiguration");

export const AuthConfig = registerAs(JWT_OPTIONS, () => {
  if (!process.env[jwtSecretToken]) {
    logger.warn(`Please configure ${jwtSecretToken} as a secret string. Providing default for now`);
  }

  let parsedExpirySeconds = parseInt(process.env[jwtExpirySecsToken], 10);
  if (!parsedExpirySeconds || parsedExpirySeconds < 60) {
    logger.warn(
      `Please properly configure '${jwtExpirySecsToken}' as a number in seconds >60 and restart. Defaulting to 60 seconds`
    );
    parsedExpirySeconds = defaultJwtExpiry;
  }
  return {
    secret: process.env[jwtSecretToken] || defaultJwtSecret,
    expiresIn: parsedExpirySeconds
  };
});

export const DefaultAdminPassword = "PleasePrintMeAnOctopus";
