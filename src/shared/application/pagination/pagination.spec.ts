import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  createPaginatedResult,
  normalizePaginationParams,
} from './pagination';
import { ValidationError } from '../errors/application.error';

describe('pagination helpers', () => {
  it('uses default page and limit when params are absent', () => {
    expect(normalizePaginationParams()).toEqual({
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      offset: 0,
    });
  });

  it('throws ValidationError when page is invalid', () => {
    expect(() => normalizePaginationParams({ page: 0 })).toThrow(ValidationError);
  });

  it('throws ValidationError when limit is invalid', () => {
    expect(() => normalizePaginationParams({ limit: -1 })).toThrow(ValidationError);
  });

  it('throws ValidationError when limit is greater than the approved maximum', () => {
    expect(() => normalizePaginationParams({ limit: 101 })).toThrow(ValidationError);
  });

  it('reports all invalid pagination fields together', () => {
    try {
      normalizePaginationParams({ page: 0, limit: 101 });
      fail('Expected pagination validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).errors).toEqual([
        {
          field: 'page',
          message: 'Page must be a positive integer',
        },
        {
          field: 'limit',
          message: 'Limit must be less than or equal to 100',
        },
      ]);
    }
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
