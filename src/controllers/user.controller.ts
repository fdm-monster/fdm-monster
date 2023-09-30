import { createController } from "awilix-express";
import { AppConstants } from "@/server.constants";
import { authenticate, authorizeRoles } from "@/middleware/authenticate";
import { ROLES } from "@/constants/authorization.constants";
import { validateInput } from "@/handlers/validators";
import { idRules } from "./validation/generic.validation";
import { InternalServerException } from "@/exceptions/runtime.exceptions";
import { UserService } from "@/services/authentication/user.service";
import { ConfigService } from "@/services/core/config.service";
import { Request, Response } from "express";

export class UserController {
  userService: UserService;
  configService: ConfigService;

  constructor({ userService, configService }: { userService: UserService; configService: ConfigService }) {
    this.userService = userService;
    this.configService = configService;
  }

  async profile(req: Request, res: Response) {
    if (!req.user?.id) {
      res.send({});
      return;
    }

    const user = await this.userService.getUser(req.user?.id);
    res.send(user);
  }

  async list(req: Request, res: Response) {
    const users = await this.userService.listUsers();
    res.send(users);
  }

  async delete(req: Request, res: Response) {
    this.throwIfDemoMode();

    const { id } = await validateInput(req.params, idRules);

    if (this.isDemoMode()) {
      const demoUserId = await this.userService.getDemoUserId();
      if (id === demoUserId) {
        this.throwIfDemoMode();
      }
    }

    await this.userService.deleteUser(id);
    res.send();
  }

  async get(req: Request, res: Response) {
    const { id } = await validateInput(req.params, idRules);
    const users = await this.userService.getUser(id);
    res.send(users);
  }

  async changeUsername(req: Request, res: Response) {
    this.throwIfDemoMode();

    const { id } = await validateInput(req.params, idRules);

    if (req.user?.id !== id) {
      throw new InternalServerException("Not allowed to change username of other users");
    }

    const { username } = await validateInput(req.body, {
      username: "required|string",
    });
    await this.userService.updateUsernameById(id, username);
    res.send();
  }

  async changePassword(req: Request, res: Response) {
    this.throwIfDemoMode();

    const { id } = await validateInput(req.params, idRules);

    if (req.user?.id !== id) {
      throw new InternalServerException("Not allowed to change password of other users");
    }

    const { oldPassword, newPassword } = await validateInput(req.body, {
      oldPassword: "required|string",
      newPassword: "required|string",
    });
    await this.userService.updatePasswordById(id, oldPassword, newPassword);
    res.send();
  }

  isDemoMode() {
    return this.configService.get(AppConstants.OVERRIDE_IS_DEMO_MODE, "false") === "true";
  }

  throwIfDemoMode() {
    const isDemoMode = this.isDemoMode();
    if (isDemoMode) {
      throw new InternalServerException("Not allowed in demo mode");
    }
  }
}

export default createController(UserController)
  .prefix(AppConstants.apiRoute + "/user")
  .before([authenticate()])
  .get("/", "list", {
    before: [authorizeRoles([ROLES.ADMIN])],
  })
  .get("/profile", "profile")
  .get("/:id", "get", {
    before: [authorizeRoles([ROLES.ADMIN])],
  })
  .delete("/:id", "delete", {
    before: [authorizeRoles([ROLES.ADMIN])],
  })
  .post("/:id/change-username", "changeUsername")
  .post("/:id/change-password", "changePassword");
