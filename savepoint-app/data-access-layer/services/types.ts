export type PaginatedResult<TItem> = {
  items: TItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};
export type PaginationInput = {
  page?: number;
  pageSize?: number;
  cursor?: string;
};
export type CursorPaginatedResult<TItem> = {
  items: TItem[];
  nextCursor: string | null;
  hasMore: boolean;
};
export type BaseServiceInput = {
  userId: string;
};
