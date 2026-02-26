/**
 * Pagination utilities for large lists
 * Reduces load time by fetching only needed data
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Default pagination settings
 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Parse pagination parameters from URL
 * @param searchParams - URL search params
 * @returns Parsed pagination params
 */
export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(
    parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE)),
    MAX_PAGE_SIZE
  );

  return {
    page: Math.max(1, page),
    limit: Math.max(1, limit),
    offset: (Math.max(1, page) - 1) * Math.max(1, limit),
  };
}

/**
 * Create pagination result
 * @param data - Array of data
 * @param total - Total count
 * @param page - Current page
 * @param limit - Items per page
 * @returns Pagination result object
 */
export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Apply pagination to Supabase query
 * @param query - Supabase query builder
 * @param params - Pagination params
 * @returns Query with pagination applied
 */
export function applyPagination<T>(query: any, params: PaginationParams) {
  const { offset = 0, limit = DEFAULT_PAGE_SIZE } = params;
  return query.range(offset, offset + limit - 1);
}
