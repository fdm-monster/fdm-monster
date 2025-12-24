import { z } from "zod";
import { AppConstants } from "@/server.constants";
import { idRuleV2 } from "@/controllers/validation/generic.validation";

export const registerUserSchema =
  z.object({
    username: z.string().min(AppConstants.DEFAULT_USERNAME_MINLEN),
    password: z.string().min(AppConstants.DEFAULT_PASSWORD_MINLEN),
    needsPasswordChange: z.boolean().optional(),
    roles: z.array(idRuleV2),
    isDemoUser: z.boolean().optional(),
    isRootUser: z.boolean().optional(),
    isVerified: z.boolean().optional(),
  });

export const newPasswordSchema = z.object({
  password: z.string().min(AppConstants.DEFAULT_PASSWORD_MINLEN),
});
