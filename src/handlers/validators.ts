import type { Request } from "express";
import { ValidationException } from "@/exceptions/runtime.exceptions";
import { ZodSchema } from "zod";

export async function validateInput<I, S>(data: I, zodSchema: ZodSchema<S>): Promise<S> {
  const result = await zodSchema.safeParseAsync(data);

  if (!result.success) {
    throw new ValidationException(result.error);
  }
  return result.data;
}

export async function validateMiddleware<I, S>(req: Request<I>, zodSchema: ZodSchema<S>): Promise<S> {
  return validateInput(req.body, zodSchema);
}
