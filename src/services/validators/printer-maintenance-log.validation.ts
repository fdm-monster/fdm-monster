import { z } from "zod";

export const createMaintenanceLogSchema = z.object({
  printerId: z.number().int().positive(),
  metadata: z.object({
    partsInvolved: z.array(z.string()).optional(),
    cause: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const completeMaintenanceLogSchema = z.object({
  completionNotes: z.string().optional(),
});

export const getMaintenanceLogsQuerySchema = z.object({
  printerId: z.coerce.number().int().positive().optional(),
  completed: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

