import { z } from "zod";

export const searchJobsSchema = z.object({
  searchPrinter: z.string().trim().min(1).optional(),
  searchFile: z.string().trim().min(1).optional(),
  startDate: z.string().date().min(1).optional(),
  endDate: z.string().date().min(1).optional(),
});

export const searchJobsPagedSchema = searchJobsSchema.extend({
  page: z.coerce.number().int().min(1),
  pageSize: z.coerce.number().int().min(1).max(500),
});
