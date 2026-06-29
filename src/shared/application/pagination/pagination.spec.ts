import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
  createPaginatedResult,
  normalizePaginationParams,
} from './pagination';

describe('pagination helpers', () => {
  it('uses default page and limit when params are absent', () => {
    expect(normalizePaginationParams()).toEqual({
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      offset: 0,
    });
  });

  it('caps limit at the approved maximum', () => {
    expect(normalizePaginationParams({ page: 2, limit: 500 })).toEqual({
      page: 2,
      limit: MAX_LIMIT,
      offset: MAX_LIMIT,
    });
  });

  it('falls back to defaults for invalid numeric values', () => {
    expect(normalizePaginationParams({ page: 0, limit: -1 })).toEqual({
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      offset: 0,
    });
  });

  it('creates the standard paginated response envelope', () => {
    const result = createPaginatedResult(['incident-1', 'incident-2'], 21, {
      page: 2,
      limit: 10,
    });

    expect(result).toEqual({
      data: ['incident-1', 'incident-2'],
      meta: {
        page: 2,
        limit: 10,
        total: 21,
        totalPages: 3,
      },
    });
  });
});
