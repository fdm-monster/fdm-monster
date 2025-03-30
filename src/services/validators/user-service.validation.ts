import { z } from "zod";
import { AppConstants } from "@/server.constants";
import { idRuleV2 } from "@/controllers/validation/generic.validation";

export const registerUserSchema = (isSqlite: boolean) =>
  z.object({
    username: z.string().min(AppConstants.DEFAULT_USERNAME_MINLEN), // Ensures username length
    password: z.string().min(AppConstants.DEFAULT_PASSWORD_MINLEN), // Ensures password length
    needsPasswordChange: z.boolean().optional(),
    roles: z.array(idRuleV2(isSqlite)).min(1), // Ensure at least one role is provided
    isDemoUser: z.boolean().optional(),
    isRootUser: z.boolean().optional(),
    isVerified: z.boolean().optional(),
  });

export const newPasswordSchema = z.object({
  password: z.string().min(AppConstants.DEFAULT_PASSWORD_MINLEN),
});
