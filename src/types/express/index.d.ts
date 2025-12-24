import { AwilixContainer } from "awilix";
import { IUser } from "@/models/Auth/User";
import { IdType } from "@/shared.constants";

export type RequestRole = IdType | string;

declare module "express" {
  interface Request<KeyType = IdType> {
    local?: any;
    user?: IUser<KeyType>;
    container: AwilixContainer;
    roles?: readonly RequestRole[];
  }
}
