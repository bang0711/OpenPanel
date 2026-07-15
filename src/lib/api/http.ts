export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type RequestOptions = {
  query?: Record<string, string | number | undefined>;
  body?: unknown;
};

/** Shared fetch wrapper used by all API resources. Throws ApiError on non-2xx. */
export async function request<T>(
  method: string,
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const qs = opts.query
    ? "?" +
      new URLSearchParams(
        Object.entries(opts.query)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : "";

  const isForm = opts.body instanceof FormData;
  const res = await fetch(`/api${path}${qs}`, {
    method,
    headers: isForm ? undefined : { "content-type": "application/json" },
    body: isForm
      ? (opts.body as FormData)
      : opts.body !== undefined
        ? JSON.stringify(opts.body)
        : undefined,
    credentials:'include'
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : null) ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}
