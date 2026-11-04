/** What the API answered when it did not say yes: the status code, and the sentence the backend gave. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, detail: string) {
    super(detail)
    this.status = status
  }
}

interface ApiOptions extends Omit<RequestInit, 'body'> {
  /** A JSON body. */
  json?: unknown
  /** A multipart body (files): the browser sets the content type and its boundary. */
  form?: FormData
}

/** Calls the backend (the session cookie goes with it) and returns the JSON answer; throws ApiError otherwise. */
export async function api<T>(path: string, { json, form, ...init }: ApiOptions = {}): Promise<T> {
  const headers = json !== undefined ? { 'content-type': 'application/json', ...init.headers } : init.headers
  const body = json !== undefined ? JSON.stringify(json) : form
  const response = await fetch(path, { ...init, headers, body })
  if (!response.ok) throw new ApiError(response.status, await detailOf(response))
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

/** FastAPI answers `{ detail: "sentence" }`, or a list of problems when a field is wrong: only a sentence is kept. */
async function detailOf(response: Response) {
  try {
    const body = (await response.json()) as { detail?: unknown }
    return typeof body.detail === 'string' ? body.detail : response.statusText
  } catch {
    return response.statusText
  }
}
