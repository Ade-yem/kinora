
export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export function parsePagination(
  searchParams: Record<string, string | string[] | undefined>
): PaginationParams {
  const page = Math.max(
    1,
    parseInt(String(searchParams.page ?? "1")) || 1
  );
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(String(searchParams.pageSize ?? "20")) || 20)
  );

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function buildPaginationMeta(
  page: number,
  pageSize: number,
  totalItems: number
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / pageSize);
  return {
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
