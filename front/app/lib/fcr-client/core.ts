export type QueryValue =
    | string
    | number
    | boolean
    | string[]
    | number[]
    | undefined
    | null;

/**
 * Serializes a params object to a URL query string.
 * - null/undefined values are omitted
 * - Arrays are joined with commas
 */
export function buildQuery(params: Record<string, QueryValue>): string {
    const qs = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
        if (val == null) continue;
        if (Array.isArray(val)) {
            if (val.length > 0) qs.set(key, val.join(","));
        } else {
            qs.set(key, String(val));
        }
    }
    return qs.toString();
}

/** Thrown when an API response has a non-2xx status code. */
export class ApiError extends Error {
    readonly status: number;
    constructor(status: number, message: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

/** Throws ApiError if the response is not ok, otherwise returns parsed JSON. */
export async function parseResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new ApiError(res.status, text);
    }
    return res.json() as Promise<T>;
}
