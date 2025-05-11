import { z } from "zod";

export const wizardSettingsSchema = z.object({
  loginRequired: z.boolean(),
  registration: z.boolean(),
  rootUsername: z.string().nonempty("rootUsername is required"),
  rootPassword: z
    .string()
    .min(8, "rootPassword must be at least 8 characters long")
    .nonempty("rootPassword is required"),
});

export const loginRequiredSchema = z.object({
  loginRequired: z.boolean(),
});

export const registrationEnabledSchema = z.object({
  registrationEnabled: z.boolean(),
});
