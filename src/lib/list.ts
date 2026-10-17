export const PAGE_SIZE = 10;

export type SearchParams = Record<string, string | string[] | undefined>;

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function getPage(params: SearchParams) {
  const raw = Number(firstParam(params.page) ?? "1");
  return Number.isInteger(raw) && raw > 0 ? raw : 1;
}

export function getQuery(params: SearchParams) {
  return firstParam(params.q)?.trim() ?? "";
}

export function getParam(params: SearchParams, key: string) {
  return firstParam(params[key])?.trim() ?? "";
}

export function preservedParams(params: SearchParams, keys: string[]) {
  const preserved: Record<string, string> = {};

  for (const key of keys) {
    const value = getParam(params, key);
    if (value) {
      preserved[key] = value;
    }
  }

  return preserved;
}
