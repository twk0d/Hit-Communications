import { z } from 'zod';

export const getUserParamsSchema = z.object({
  id: z
    .string({
      required_error: 'User id is required',
    })
    .uuid('User id must be a valid UUID'),
});

export class GetUserParamsDto {
  static readonly schema = getUserParamsSchema;

  id!: string;
}
