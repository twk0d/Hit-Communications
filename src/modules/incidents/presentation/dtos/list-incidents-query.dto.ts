import { z } from 'zod';

import { MAX_LIMIT } from '../../../../shared/application/pagination/pagination';
import { IncidentCategory } from '../../domain/enums/incident-category.enum';
import { IncidentPriority } from '../../domain/enums/incident-priority.enum';
import { IncidentStatus } from '../../domain/enums/incident-status.enum';

const incidentStatusValues = Object.values(IncidentStatus);
const incidentPriorityValues = Object.values(IncidentPriority);
const incidentCategoryValues = Object.values(IncidentCategory);

export const listIncidentsQuerySchema = z
  .object({
    page: positiveIntegerQueryParam('Page'),
    limit: positiveIntegerQueryParam('Limit').refine(
      (value) => value === undefined || value <= MAX_LIMIT,
      `Limit must be less than or equal to ${MAX_LIMIT}`,
    ),
    status: enumQueryParam(
      incidentStatusValues,
      'Status must be a valid incident status',
    ),
    priority: enumQueryParam(
      incidentPriorityValues,
      'Priority must be a valid incident priority',
    ),
    category: enumQueryParam(
      incidentCategoryValues,
      'Category must be a valid incident category',
    ),
    assigneeId: z
      .string({
        invalid_type_error: 'Assignee id must be a valid UUID',
      })
      .uuid('Assignee id must be a valid UUID')
      .optional(),
    createdFrom: isoDateQueryParam('Created from must be a valid ISO 8601 date'),
    createdTo: isoDateQueryParam('Created to must be a valid ISO 8601 date'),
    resolvedFrom: isoDateQueryParam(
      'Resolved from must be a valid ISO 8601 date',
    ),
    resolvedTo: isoDateQueryParam('Resolved to must be a valid ISO 8601 date'),
  })
  .superRefine((query, ctx) => {
    if (query.createdFrom && query.createdTo && query.createdFrom > query.createdTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['createdFrom'],
        message: 'Created from must be before or equal to created to',
      });
    }

    if (
      query.resolvedFrom &&
      query.resolvedTo &&
      query.resolvedFrom > query.resolvedTo
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resolvedFrom'],
        message: 'Resolved from must be before or equal to resolved to',
      });
    }
  });

export class ListIncidentsQueryDto {
  static readonly schema = listIncidentsQuerySchema;

  page?: number;
  limit?: number;
  status?: IncidentStatus;
  priority?: IncidentPriority;
  category?: IncidentCategory;
  assigneeId?: string;
  createdFrom?: Date;
  createdTo?: Date;
  resolvedFrom?: Date;
  resolvedTo?: Date;
}

function positiveIntegerQueryParam(label: string): z.ZodEffects<
  z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>,
  number | undefined,
  unknown
> {
  return z.preprocess(
    (value) => (typeof value === 'number' ? String(value) : value),
    z
      .string({
        invalid_type_error: `${label} must be a positive integer`,
      })
      .regex(/^[1-9]\d*$/, `${label} must be a positive integer`)
      .transform(Number)
      .optional(),
  );
}

function enumQueryParam<TValue extends string>(
  values: readonly TValue[],
  message: string,
): z.ZodEffects<z.ZodOptional<z.ZodString>, TValue | undefined, string | undefined> {
  return z
    .string({
      invalid_type_error: message,
    })
    .optional()
    .refine(
      (value): value is TValue | undefined =>
        value === undefined || values.includes(value as TValue),
      message,
    );
}

function isoDateQueryParam(
  message: string,
): z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>> {
  return z
    .string({
      invalid_type_error: message,
    })
    .datetime({
      offset: true,
      message,
    })
    .transform((value) => new Date(value))
    .optional();
}
