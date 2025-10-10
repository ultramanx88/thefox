import { useCallback, useState } from 'react';
import { authorizedFetch } from '../utils/authFetch';

type Json = Record<string, any> | any[] | null;

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async (path: string, init?: RequestInit) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authorizedFetch(path, init);
      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data: Json = isJson ? await res.json() : null;
      if (!res.ok) throw new Error((data as any)?.message || res.statusText);
      return { data, res } as const;
    } catch (e: any) {
      setError(e?.message || 'Request failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback(async (path: string) => {
    return request(path, { method: 'GET' });
  }, [request]);

  const post = useCallback(async (path: string, body?: any) => {
    return request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  }, [request]);

  return { loading, error, get, post };
}


