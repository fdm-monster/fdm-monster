import { z } from "zod";
import { AppConstants } from "@/server.constants";
import { idRuleV2 } from "./generic.validation";

export const registerUserSchema = z.object({
  username: z.string().min(AppConstants.DEFAULT_USERNAME_MINLEN).nonempty(),
  password: z.string().min(AppConstants.DEFAULT_PASSWORD_MINLEN).nonempty(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().nonempty(),
  newPassword: z.string().min(AppConstants.DEFAULT_PASSWORD_MINLEN).nonempty(),
});

export const registerUserWithRolesSchema =
  z.object({
    username: z.string().min(AppConstants.DEFAULT_USERNAME_MINLEN).nonempty(),
    password: z.string().min(AppConstants.DEFAULT_PASSWORD_MINLEN).nonempty(),
    roleIds: z.array(idRuleV2),
  });

export const setUserRolesSchema =
  z.object({
    roleIds: z.array(idRuleV2),
  });

export const usernameSchema = z.object({
  username: z.string().min(AppConstants.DEFAULT_USERNAME_MINLEN).nonempty(),
});

export const isVerifiedSchema = z.object({
  isVerified: z.boolean(),
});

export const isRootUserSchema = z.object({
  isRootUser: z.boolean(),
});
