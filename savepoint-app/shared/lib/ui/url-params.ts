export type ListParams = {
  page?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  platform?: string;
  storefront?: string;
  status?: string;
};

export function parseListParams(input: URLSearchParams): ListParams {
  const page = Number(input.get("page") || 1);
  const search = input.get("search") || undefined;
  const sort = input.get("sort") || undefined;
  const order = (input.get("order") as "asc" | "desc") || undefined;
  const platform = input.get("platform") || undefined;
  const storefront = input.get("storefront") || undefined;
  const status = input.get("status") || undefined;

  return { page, search, sort, order, platform, storefront, status };
}

export function updateListParams(
  current: URLSearchParams,
  updates: Partial<ListParams>
): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
  });
  return next;
}
