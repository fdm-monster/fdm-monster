import { z } from "zod";

// Path validation: no parent directory traversal, reasonable length, safe characters
const fileNamePathRule = z
  .string()
  .min(1, "fileName cannot be empty")
  .max(500, "fileName path too long (max 500 chars)")
  .regex(
    /^[a-zA-Z0-9_\-\.\/\s]+$/,
    "fileName contains invalid characters (allowed: alphanumeric, /, -, _, ., space)"
  )
  .refine(
    (path) => !path.includes(".."),
    "fileName cannot contain parent directory references (..)"
  )
  .refine(
    (path) => !path.startsWith("/"),
    "fileName cannot start with /"
  );

// Schema for updating single file metadata
export const updateFileMetadataSchema = z.object({
  fileName: fileNamePathRule.optional(),
  metadata: z.record(z.any()).optional(),
}).strict().refine(
  (data) => data.fileName !== undefined || data.metadata !== undefined,
  "At least one of fileName or metadata must be provided"
);

// Schema for batch update - array of file updates
export const batchUpdateFileMetadataSchema = z.object({
  updates: z.array(
    z.object({
      fileStorageId: z.string().min(1, "fileStorageId is required"),
      fileName: fileNamePathRule.optional(),
      metadata: z.record(z.any()).optional(),
    }).refine(
      (data) => data.fileName !== undefined || data.metadata !== undefined,
      "At least one of fileName or metadata must be provided"
    )
  ).min(1, "updates array cannot be empty").max(100, "Maximum 100 files can be updated at once"),
}).strict();
