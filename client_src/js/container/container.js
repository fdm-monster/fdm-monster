import { asClass, createContainer } from "awilix";
import { DITokens } from "./container.tokens";
const { NotyAlertsService } = require("../services/alerts/noty-alerts.service");

export function configureContainer() {
  // Create the container and set the injectionMode to PROXY (which is also the default).
  const container = createContainer({
    injectionMode: "PROXY"
  });

  container.register({
    [DITokens.NotyAlertsService]: asClass(NotyAlertsService).singleton()
  });

  return container;
}
