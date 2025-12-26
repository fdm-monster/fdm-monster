import { z } from "zod";

export const startPrintFileSchema = z.object({
  filePath: z.string().min(1),
});

export const downloadFileSchema = z.object({
  path: z.string().min(1),
});

export const getFileSchema = z.object({
  path: z.string().min(1),
});

export const uploadFileSchema = z.object({
  startPrint: z.enum(["true", "false"]),
});
