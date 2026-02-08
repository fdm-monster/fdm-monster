import { POST, route } from "awilix-express";
import { AppConstants } from "@/server.constants";
import { validateMiddleware } from "@/handlers/validators";
import { wizardSettingsSchema } from "./validation/setting.validation";
import { BadRequestException, ForbiddenError } from "@/exceptions/runtime.exceptions";
import { ROLES } from "@/constants/authorization.constants";
import { SettingsStore } from "@/state/settings.store";
import type { Request, Response } from "express";
import type { IUserService } from "@/services/interfaces/user-service.interface";
import type { IRoleService } from "@/services/interfaces/role-service.interface";
import { YamlService } from "@/services/core/yaml.service";
import { MulterService } from "@/services/core/multer.service";

@route(AppConstants.apiRoute + "/first-time-setup")
export class FirstTimeSetupController {
  constructor(
    private readonly settingsStore: SettingsStore,
    private readonly roleService: IRoleService,
    private readonly userService: IUserService,
    private readonly yamlService: YamlService,
    private readonly multerService: MulterService,
  ) {}

  @POST()
  @route("/validate")
  async validateWizard(req: Request, res: Response) {
    const { rootUsername } = await validateMiddleware(req, wizardSettingsSchema);
    await this.roleService.getSynchronizedRoleByName(ROLES.ADMIN);

    if (this.settingsStore.isWizardCompleted()) {
      throw new ForbiddenError("Wizard already completed");
    }

    const user = await this.userService.findRawByUsername(rootUsername?.toLowerCase());
    if (user) {
      throw new BadRequestException("This user already exists");
    }

    return res.send();
  }

  @POST()
  @route("/complete")
  async completeWizard(req: Request, res: Response) {
    const { loginRequired, registration, rootUsername, rootPassword } = await validateMiddleware(
      req,
      wizardSettingsSchema,
    );

    if (this.settingsStore.isWizardCompleted()) {
      throw new ForbiddenError("Wizard already completed");
    }

    await this.roleService.getSynchronizedRoleByName(ROLES.ADMIN);
    const user = await this.userService.findRawByUsername(rootUsername?.toLowerCase());
    if (user) {
      throw new BadRequestException("This user already exists");
    }

    await this.userService.register({
      username: rootUsername,
      password: rootPassword,
      roles: [ROLES.ADMIN],
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

  @POST()
  @route("/yaml-import")
  async importYamlFile(req: Request, res: Response) {
    if (this.settingsStore.isWizardCompleted()) {
      throw new ForbiddenError(
        "Wizard already completed. Cannot import during first-time setup once wizard is complete.",
      );
    }

    const files = await this.multerService.multerLoadFileAsync(req, res, [".yaml", ".yml"], false);
    const firstFile = files[0];

    await this.yamlService.importYaml(firstFile.buffer.toString());

    return res.send({
      success: true,
    });
  }
}
