import { createController } from "awilix-express";
import { AppConstants } from "@/server.constants";
import { validateMiddleware } from "@/handlers/validators";
import { wizardSettingsRules } from "./validation/setting.validation";
import { BadRequestException, ForbiddenError } from "@/exceptions/runtime.exceptions";
import { ROLES } from "@/constants/authorization.constants";
import { SettingsStore } from "@/state/settings.store";
import { Request, Response } from "express";
import { IUserService } from "@/services/interfaces/user-service.interface";
import { IRoleService } from "@/services/interfaces/role-service.interface";

export class FirstTimeSetupController {
  userService: IUserService;
  roleService: IRoleService;
  settingsStore: SettingsStore;

  constructor({
    settingsStore,
    roleService,
    userService,
  }: {
    settingsStore: SettingsStore;
    roleService: IRoleService;
    userService: IUserService;
  }) {
    this.settingsStore = settingsStore;
    this.roleService = roleService;
    this.userService = userService;
  }

  async validateWizard(req: Request, res: Response) {
    const { loginRequired, registration, rootUsername, rootPassword } = await validateMiddleware(req, wizardSettingsRules);

    const role = await this.roleService.getSynchronizedRoleByName(ROLES.ADMIN);
    const user = await this.userService.findRawByUsername(rootUsername?.toLowerCase());
    if (!!user) {
      throw new BadRequestException("This user already exists");
    }

    return res.send();
  }

  async completeWizard(req: Request, res: Response) {
    const { loginRequired, registration, rootUsername, rootPassword } = await validateMiddleware(req, wizardSettingsRules);

    if (this.settingsStore.isWizardCompleted()) {
      throw new ForbiddenError("Wizard already completed");
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
      isVerified: true,
      isDemoUser: false,
      needsPasswordChange: false,
    });
    await this.settingsStore.setLoginRequired(loginRequired);
    await this.settingsStore.setRegistrationEnabled(registration);
    await this.settingsStore.setWizardCompleted(AppConstants.currentWizardVersion);

    return res.send();
  }
}

export default createController(FirstTimeSetupController)
  .prefix(AppConstants.apiRoute + "/first-time-setup")
  .post("/validate", "validateWizard")
  .post("/complete", "completeWizard");
