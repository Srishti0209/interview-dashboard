// Response helpers shared by the /api functions. Every error goes out as
// { error: code, message } so the client can switch to the hand-off.

export type ErrorCode =
  | 'unauthorized'
  | 'bad_request'
  | 'not_found'
  | 'no_key'
  | 'cap_reached'
  | 'refused'
  | 'bad_output'
  | 'server_error';

export class HttpError extends Error {
  status: number;
  code: ErrorCode;
  constructor(status: number, code: ErrorCode, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

/** Wraps a handler so thrown HttpErrors (and anything else) become JSON. */
export function handle(fn: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    try {
      return await fn(req);
    } catch (e) {
      if (e instanceof HttpError) {
        return json({ error: e.code, message: e.message }, e.status);
      }
      console.error(e);
      return json({ error: 'server_error', message: 'Something went wrong. Try again.' }, 500);
    }
  };
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, 'bad_request', 'Expected a JSON body.');
  }
}
