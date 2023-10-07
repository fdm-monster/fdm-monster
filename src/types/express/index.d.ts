// to make the file a module and avoid the TypeScript error
import { AwilixContainer } from "awilix";
import { IRole } from "@/models/Auth/Role";

declare global {
  declare module "express-serve-static-core" {
    import { IUser } from "@/models/Auth/User";

    interface Request {
      user?: IUser;
      container?: AwilixContainer;
      roles?: IRole[];
    }
  }
}
