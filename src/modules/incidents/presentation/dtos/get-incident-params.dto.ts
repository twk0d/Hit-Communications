import { z } from 'zod';

export const getIncidentParamsSchema = z.object({
  id: z
    .string({
      required_error: 'Incident id is required',
    })
    .uuid('Incident id must be a valid UUID'),
});

export class GetIncidentParamsDto {
  static readonly schema = getIncidentParamsSchema;

  id!: string;
}
