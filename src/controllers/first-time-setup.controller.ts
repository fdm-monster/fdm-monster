import { POST, route } from "awilix-express";
import { AppConstants } from "@/server.constants";
import { validateMiddleware } from "@/handlers/validators";
import { wizardSettingsRules } from "./validation/setting.validation";
import { BadRequestException, ForbiddenError } from "@/exceptions/runtime.exceptions";
import { ROLES } from "@/constants/authorization.constants";
import { SettingsStore } from "@/state/settings.store";
import { Request, Response } from "express";
import { IUserService } from "@/services/interfaces/user-service.interface";
import { IRoleService } from "@/services/interfaces/role-service.interface";

@route(AppConstants.apiRoute + "/first-time-setup")
export class FirstTimeSetupController {
  constructor(
    private readonly settingsStore: SettingsStore,
    private readonly roleService: IRoleService,
    private readonly userService: IUserService
  ) {}

  @POST()
  @route("/validate")
  async validateWizard(req: Request, res: Response) {
    const { rootUsername } = await validateMiddleware(req, wizardSettingsRules);
    await this.roleService.getSynchronizedRoleByName(ROLES.ADMIN);

    if (this.settingsStore.isWizardCompleted()) {
      throw new ForbiddenError("Wizard already completed");
    }

    const user = await this.userService.findRawByUsername(rootUsername?.toLowerCase());
    if (!!user) {
      throw new BadRequestException("This user already exists");
    }

    return res.send();
  }

  @POST()
  @route("/complete")
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
