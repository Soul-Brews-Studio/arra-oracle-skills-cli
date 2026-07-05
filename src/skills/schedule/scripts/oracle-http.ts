export interface OracleRequestOptions extends RequestInit {
  query?: URLSearchParams | Record<string, string | number | boolean | undefined>;
}

const DEFAULT_ORACLE_API = 'http://localhost:47778';

export function oracleApiBase(env: Record<string, string | undefined> = process.env): string {
  return (env.ORACLE_API ?? DEFAULT_ORACLE_API).replace(/\/+$/, '');
}

export function oracleApiUrl(
  path: string,
  query?: OracleRequestOptions['query'],
  env: Record<string, string | undefined> = process.env,
): string {
  const normalizedPath = path
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\/?api\/?v1\/?/i, '')
    .replace(/^\/?api\/?/i, '')
    .replace(/^\/+/, '');
  const url = new URL(`/api/v1/${normalizedPath}`, oracleApiBase(env));
  const params = query instanceof URLSearchParams ? query : new URLSearchParams();
  if (query && !(query instanceof URLSearchParams)) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params.set(key, String(value));
    }
  }
  for (const [key, value] of params) url.searchParams.set(key, value);
  return url.toString();
}

export function oracleHeaders(
  extra?: HeadersInit,
  env: Record<string, string | undefined> = process.env,
): Headers {
  const headers = new Headers(extra);
  const token = env.ARRA_API_TOKEN ?? env.ORACLE_API_TOKEN;
  const tenant = env.X_ORACLE_TENANT ?? env.ORACLE_TENANT ?? env.ARRA_TENANT;
  const tenantToken = env.X_ORACLE_TENANT_TOKEN ?? env.ORACLE_TENANT_TOKEN ?? env.ARRA_TENANT_TOKEN;
  if (token && !headers.has('authorization')) headers.set('authorization', `Bearer ${token}`);
  if (tenant && !headers.has('x-oracle-tenant')) headers.set('x-oracle-tenant', tenant);
  if (tenantToken && !headers.has('x-oracle-tenant-token')) headers.set('x-oracle-tenant-token', tenantToken);
  return headers;
}

export async function oracleJson<T>(path: string, options: OracleRequestOptions = {}): Promise<T> {
  const { query, headers, ...init } = options;
  const finalHeaders = oracleHeaders(headers);
  if (init.body && !finalHeaders.has('content-type')) finalHeaders.set('content-type', 'application/json');
  const response = await fetch(oracleApiUrl(path, query), {
    ...init,
    headers: finalHeaders,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Oracle API ${response.status} ${response.statusText}${body ? `: ${body}` : ''}`);
  }
  return response.json() as Promise<T>;
}
