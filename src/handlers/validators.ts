import { Request } from "express";
import { ValidationException } from "@/exceptions/runtime.exceptions";
import { z, ZodSchema } from "zod";

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

export function numberEnum<T extends number>(values: readonly T[]) {
  const set = new Set<unknown>(values);
  return (v: number, ctx: z.RefinementCtx): v is T => {
    if (!set.has(v)) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_enum_value,
        received: v,
        options: [...values],
      });
    }
    return z.NEVER;
  };
}
