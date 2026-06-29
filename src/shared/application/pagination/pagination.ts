import { FieldValidationError, ValidationError } from '../errors/application.error';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type NormalizedPaginationParams = {
  page: number;
  limit: number;
  offset: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResult<TData> = {
  data: TData[];
  meta: PaginationMeta;
};

export function normalizePaginationParams(
  params: PaginationParams = {},
): NormalizedPaginationParams {
  const errors: FieldValidationError[] = [];
  const page = normalizePage(params.page, errors);
  const limit = normalizeLimit(params.limit, errors);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

export function createPaginatedResult<TData>(
  data: TData[],
  total: number,
  params: PaginationParams = {},
): PaginatedResult<TData> {
  const pagination = normalizePaginationParams(params);
  const normalizedTotal = Math.max(0, Math.trunc(total));

  return {
    data,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total: normalizedTotal,
      totalPages:
        normalizedTotal === 0 ? 0 : Math.ceil(normalizedTotal / pagination.limit),
    },
  };
}

function normalizePage(
  value: number | undefined,
  errors: FieldValidationError[],
): number {
  if (value === undefined) {
    return DEFAULT_PAGE;
  }

  if (!Number.isInteger(value) || value < 1) {
    errors.push({
      field: 'page',
      message: 'Page must be a positive integer',
    });
    return DEFAULT_PAGE;
  }

  return value;
}

function normalizeLimit(
  value: number | undefined,
  errors: FieldValidationError[],
): number {
  if (value === undefined) {
    return DEFAULT_LIMIT;
  }

  if (!Number.isInteger(value) || value < 1) {
    errors.push({
      field: 'limit',
      message: 'Limit must be a positive integer',
    });
    return DEFAULT_LIMIT;
  }

  if (value > MAX_LIMIT) {
    errors.push({
      field: 'limit',
      message: `Limit must be less than or equal to ${MAX_LIMIT}`,
    });
    return MAX_LIMIT;
  }

  return value;
}
