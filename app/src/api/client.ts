const apiOrigin = (): string => import.meta.env.VITE_API_ORIGIN ?? "http://localhost:8787";

export const apiFetch = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${apiOrigin()}${path}`, {
    ...init,
    credentials: "include",
    headers: { "content-type": "application/json", ...init.headers }
  });

  if (!response.ok) throw new Error(await response.text());
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
};
