import { z } from "zod";
import { AppConstants } from "@/server.constants";
import { idRuleV2 } from "./generic.validation";

export const registerUserSchema = z.object({
  username: z.string().min(AppConstants.DEFAULT_USERNAME_MINLEN).nonempty("Username is required"),
  password: z.string().min(AppConstants.DEFAULT_PASSWORD_MINLEN).nonempty("Password is required"),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(AppConstants.DEFAULT_PASSWORD_MINLEN).nonempty("Password is required"),
  newPassword: z.string().min(AppConstants.DEFAULT_PASSWORD_MINLEN).nonempty("Password is required"),
});

export const registerUserWithRolesSchema = (isSqlite: boolean) =>
  z.object({
    username: z.string().min(AppConstants.DEFAULT_USERNAME_MINLEN).nonempty("Username is required"),
    password: z.string().min(AppConstants.DEFAULT_PASSWORD_MINLEN).nonempty("Password is required"),
    roleIds: z.array(idRuleV2(isSqlite)),
  });

export const setUserRolesSchema = (isSqlite: boolean) =>
  z.object({
    roleIds: z.array(idRuleV2(isSqlite)),
  });

export const usernameSchema = z.object({
  username: z.string().min(AppConstants.DEFAULT_USERNAME_MINLEN).nonempty("Username is required"),
});

export const isVerifiedSchema = z.object({
  isVerified: z.boolean(),
});

export const isRootUserSchema = z.object({
  isRootUser: z.boolean(),
});
