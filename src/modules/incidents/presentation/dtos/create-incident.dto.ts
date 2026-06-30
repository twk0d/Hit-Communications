import { z } from 'zod';

import { IncidentCategory } from '../../domain/enums/incident-category.enum';
import { IncidentPriority } from '../../domain/enums/incident-priority.enum';

export const createIncidentSchema = z.object({
  title: z
    .string({
      required_error: 'Title is required',
    })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(160, 'Title must be at most 160 characters'),
  description: z
    .string({
      required_error: 'Description is required',
    })
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be at most 2000 characters'),
  category: z.nativeEnum(IncidentCategory, {
    required_error: 'Category is required',
    invalid_type_error: 'Category must be a valid incident category',
  }),
  priority: z.nativeEnum(IncidentPriority, {
    required_error: 'Priority is required',
    invalid_type_error: 'Priority must be a valid incident priority',
  }),
  assigneeId: z
    .string({
      required_error: 'Assignee id is required',
    })
    .uuid('Assignee id must be a valid UUID'),
});

export class CreateIncidentDto {
  static readonly schema = createIncidentSchema;

  title!: string;
  description!: string;
  category!: IncidentCategory;
  priority!: IncidentPriority;
  assigneeId!: string;
}
