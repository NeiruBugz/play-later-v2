import { FormState } from "./types";

export function buildUrl(pathname: string, filters: FormState) {
  const { order, purchaseType, search, sortBy, status } = filters;
  let url = pathname;

  url += `?status=${status}`;
  url += `&order=${order}`;
  url += `&sortBy=${sortBy}`;

  if (purchaseType) {
    url += `&purchaseType=${purchaseType}`;
  }
  if (search) {
    url += `&search=${search}`;
  }

  return url;
}
