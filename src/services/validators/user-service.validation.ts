import { z } from "zod";
import { AppConstants } from "@/server.constants";
import { ROLES } from "@/constants/authorization.constants";

const roleNameSchema = z.enum([ROLES.ADMIN, ROLES.OPERATOR, ROLES.GUEST]);

export const registerUserSchema = z.object({
  username: z.string().min(AppConstants.DEFAULT_USERNAME_MINLEN),
  password: z.string().min(AppConstants.DEFAULT_PASSWORD_MINLEN),
  needsPasswordChange: z.boolean().optional(),
  roles: z.array(roleNameSchema),
  isDemoUser: z.boolean().optional(),
  isRootUser: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

export const newPasswordSchema = z.object({
  password: z.string().min(AppConstants.DEFAULT_PASSWORD_MINLEN),
});
