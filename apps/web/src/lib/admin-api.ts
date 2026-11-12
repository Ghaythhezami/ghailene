import { apiBase } from "./api-base";

export class AdminRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  let response: Response;
  try {
    response = await fetch(`${apiBase}${path}`, { ...init, headers, credentials: "include" });
  } catch (error) {
    console.error("Admin API connection failed:", error);
    throw new Error("تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت وإعدادات الموقع والخادم.");
  }
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json() as { message?: string | string[] };
      message = Array.isArray(body.message) ? body.message.join(", ") : body.message || message;
    } catch {
      // Keep the HTTP status message when an upstream response is not JSON.
    }
    throw new AdminRequestError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
