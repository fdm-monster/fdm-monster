import { EventType } from "@/octoprint/dto/websocket-output/event.type";

export const portToken = "PORT";
export const nodeEnvToken = "NODE_ENV";

export const logAppName = "fdm-monster";
export const defaultServerPort = 4000;
export const apiPrefix = "api";

export const logLevelToken = "LOG_LEVEL";
export const defaultProductionLogLevel = "warn";
export const defaultDevelopmentLogLevel = "info";
export const defaultYamlConfigPath = "./config.yaml";
export const enableClientDistAutoUpdate = "ENABLE_CLIENT_DIST_AUTO_UPDATE";
export const overrideClientDistToken = "OVERRIDE_CLIENT_DIST";
export const defaultClientDist = "./media/client-dist/dist";
export const githubClientOwnerToken = "GITHUB_CLIENT_OWNER";
export const defaultGithubClientOwner = "fdm-monster";
export const githubClientRepoToken = "GITHUB_CLIENT_REPO";
export const defaultGithubClientRepo = "fdm-monster-client";
export const githubClientReleaseTagToken = "GITHUB_CLIENT_RELEASE_TAG";
export const githubPatToken = "GITHUB_PAT";

// Authentication
export const jwtSecretToken = "JWT_SECRET";
export const defaultJwtSecret = "ILoveFdmMonster";

// Api calls
export const externalHttpTimeoutKey = "EXTERNAL_HTTP_TIMEOUT";
export const defaultWebsocketHandshakeTimeout = 2000;
export const defaultHttpTimeout = 2000;
export const defaultSocketThrottleRate = 6;
export const defaultSocketSilenceTimeout = 6000; // 2x the OctoPrint current interval
export const defaultPrinterTestTimeout = 2500;

// Generics
export const discordWebHookToken = "DISCORD_WEBHOOK";

// Sentry
export const sentryEnabledToken = "SENTRY_ENABLED";
export const sentryDsnToken = "SENTRY_DSN";
export const sentryDebugToken = "SENTRY_DEBUG";

// Authentication
export const resetAdminPasswordToken = "RESET_ADMIN_PASSWORD";
export const defaultAdminUserName = "admin123";

// Event constants
export const uploadProgressEvent = (token) => `upload.progress.${token}`;
export const printerEvent = (event) => `printer.${event}`;
export const printerCreatedEvent = (id: number | string) => printerEvent(`created.${id}`);
export const printerUpdatedEvent = (id: number | string) => printerEvent(`updated.${id}`);
export const printerRefreshEvent = (id: number | string) => printerEvent(`refresh.${id}`);
export const printerDeletedEvent = (id: number | string) => printerEvent(`deleted.${id}`);
export const printerDisabledEvent = (id: number | string) => printerEvent(`disabled.${id}`);
export const printerConnectingEvent = (id: number | string) => printerEvent(`${EventType.Connecting}.${id}`);
export const printerConnectedEvent = (id: number | string) => printerEvent(`${EventType.Connected}.${id}`);
export const printerDisconnectingEvent = (id: number | string) => printerEvent(`${EventType.Disconnecting}.${id}`);
export const printerDisconnectedEvent = (id: number | string) => printerEvent(`${EventType.Disconnected}.${id}`);
export const printerFileAddedEvent = (id: number | string) => printerEvent(`${EventType.FileAdded}.${id}`);
export const printerFileRemovedEvent = (id: number | string) => printerEvent(`${EventType.FileRemoved}.${id}`);
export const printerEnabledEvent = (id: number | string) => printerEvent(`enabled.${id}`);
export const serverPrintStoppedEvent = (id: number | string) => `server.print.stopped.${id}`;
export const serverJobUpdateEvent = (id: number | string) => printerEvent(`job.update.${id}`);
export const serverJobStateEvent = (id: number | string) => printerEvent(`job.state.${id}`);

// File uploads
export const maxFileUploadSizeMB = 300;
export const mediaRootPath = "./media";
export const fileUploadStoragePath = mediaRootPath + "/gcode-uploads";
export const defaultClientDistPath = mediaRootPath + "/client-dist";
export const defaultClientDistZipPath = mediaRootPath + "/client-dist-zips";

// Task names to ensure no conflict
export const taskNames = {
  printerTestTask: "printerTestTask",
  socketVerifyTask: (id) => `socketVerify.${id}`,
} as const;
