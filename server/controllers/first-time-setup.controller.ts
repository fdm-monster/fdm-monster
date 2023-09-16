const { createController } = require("awilix-express");
const { AppConstants } = require("../server.constants");
const { validateMiddleware } = require("../handlers/validators");
const { wizardSettingsRules } = require("./validation/setting.validation");
const { AuthorizationError, BadRequestException } = require("../exceptions/runtime.exceptions");
const { ROLES } = require("../constants/authorization.constants");

export class FirstTimeSetupController {
  /**
   * @type {UserService}
   */
  userService;
  /**
   * @type {RoleService}
   */
  roleService;
  /**
   * @type {SettingsStore}
   */
  settingsStore;

  constructor({ settingsStore, roleService, userService }) {
    this.settingsStore = settingsStore;
    this.roleService = roleService;
    this.userService = userService;
  }

  async completeWizard(req, res) {
    const { loginRequired, registration, rootUsername, rootPassword } = await validateMiddleware(req, wizardSettingsRules);

    if (this.settingsStore.isWizardCompleted()) {
      throw new AuthorizationError("Wizard already completed");
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
    });
    await this.settingsStore.setLoginRequired(loginRequired);
    await this.settingsStore.setRegistrationEnabled(registration);
    await this.settingsStore.setWizardCompleted(AppConstants.currentWizardVersion);

    return res.send();
  }
}

export default createController(FirstTimeSetupController)
  .prefix(AppConstants.apiRoute + "/first-time-setup")
  .post("/", "completeWizard");
