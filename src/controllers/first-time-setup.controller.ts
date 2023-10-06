import { createController } from "awilix-express";
import { AppConstants } from "@/server.constants";
import { validateMiddleware } from "@/handlers/validators";
import { wizardSettingsRules } from "./validation/setting.validation";
import { AuthorizationError, BadRequestException } from "@/exceptions/runtime.exceptions";
import { ROLES } from "@/constants/authorization.constants";
import { UserService } from "@/services/authentication/user.service";
import { RoleService } from "@/services/authentication/role.service";
import { SettingsStore } from "@/state/settings.store";
import { Request, Response } from "express";

export class FirstTimeSetupController {
  userService: UserService;
  roleService: RoleService;
  settingsStore: SettingsStore;

  constructor({
    settingsStore,
    roleService,
    userService,
  }: {
    settingsStore: SettingsStore;
    roleService: RoleService;
    userService: UserService;
  }) {
    this.settingsStore = settingsStore;
    this.roleService = roleService;
    this.userService = userService;
  }

  async completeWizard(req: Request, res: Response) {
    const { loginRequired, registration, rootUsername, rootPassword } = await validateMiddleware(req, wizardSettingsRules);

    if (this.settingsStore.isWizardCompleted()) {
      throw new AuthorizationError({ reason: "Wizard already completed" });
    }

    const role = await this.roleService.getSynchronizedRoleByName(ROLES.ADMIN);

    const user = await this.userService.findRawByUsername(rootUsername?.toLowerCase());
    if (!!user) {
      throw new BadRequestException("This user already exists");
    }

    await this.userService.register({
      username: rootUsername,
      password: rootPassword,
      roles: [role.id],
      isRootUser: true,
      needsPasswordChange: false,
      isVerified: true,
    });
    await this.settingsStore.setLoginRequired(loginRequired);
    await this.settingsStore.setRegistrationEnabled(registration);
    await this.settingsStore.setWizardCompleted(AppConstants.currentWizardVersion);

    return res.send();
  }
}

export default createController(FirstTimeSetupController)
  .prefix(AppConstants.apiRoute + "/first-time-setup")
  .post("/complete", "completeWizard");
