import { z } from "zod";
import { AppConstants } from "@/server.constants";
import { ROLES } from "@/constants/authorization.constants";

const roleNameSchema = z.enum([ROLES.ADMIN, ROLES.OPERATOR, ROLES.GUEST]);

export const registerUserSchema = z.object({
  username: z.string().min(AppConstants.DEFAULT_USERNAME_MINLEN).nonempty(),
  password: z.string().min(AppConstants.DEFAULT_PASSWORD_MINLEN).nonempty(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().nonempty(),
  newPassword: z.string().min(AppConstants.DEFAULT_PASSWORD_MINLEN).nonempty(),
});

export const registerUserWithRolesSchema = z.object({
  username: z.string().min(AppConstants.DEFAULT_USERNAME_MINLEN).nonempty(),
  password: z.string().min(AppConstants.DEFAULT_PASSWORD_MINLEN).nonempty(),
  roles: z.array(roleNameSchema),
});

export const setUserRolesSchema = z.object({
  roles: z.array(roleNameSchema),
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
