// to make the file a module and avoid the TypeScript error
import { AwilixContainer } from "awilix";
import { IRole } from "@/models/Auth/Role";
import { IUser } from "@/models/Auth/User";
import { IdType } from "@/shared.constants";

export type RequestRole = IdType;

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      container?: AwilixContainer;
      roles?: RequestRole[];
    }
  }
}
