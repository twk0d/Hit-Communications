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
  const page = normalizePositiveInteger(params.page, DEFAULT_PAGE);
  const requestedLimit = normalizePositiveInteger(params.limit, DEFAULT_LIMIT);
  const limit = Math.min(requestedLimit, MAX_LIMIT);

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

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value) || value < 1) {
    return fallback;
  }

  return Math.trunc(value);
}
