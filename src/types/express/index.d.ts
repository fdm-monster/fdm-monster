import { AwilixContainer } from "awilix";
import { IUser } from "@/models/Auth/User";
import { IdType } from "@/shared.constants";

export type RequestRole = IdType;

declare module "express" {
  interface Request {
    user?: IUser;
    container?: AwilixContainer;
    roles?: RequestRole[];
  }
}
