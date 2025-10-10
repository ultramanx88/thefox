import * as SecureStore from 'expo-secure-store';

const API_BASE = (global as any).API_BASE_URL || 'http://localhost:3000';

export async function authorizedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await SecureStore.getItemAsync('auth_token');
  const headers = { 'Content-Type': 'application/json', ...(init.headers || {}) } as any;
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = path.startsWith('http') ? path : `${API_BASE.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;

  let res = await fetch(url, { ...init, headers } as any);
  if (res.status !== 401) return res;

  const refresh = await SecureStore.getItemAsync('refresh_token');
  if (!refresh) return res;
  try {
    const r = await fetch(`${API_BASE.replace(/\/$/, '')}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh })
    });
    if (r.ok) {
      const data = await r.json();
      if (data?.accessToken) await SecureStore.setItemAsync('auth_token', data.accessToken);
      if (data?.refreshToken) await SecureStore.setItemAsync('refresh_token', data.refreshToken);
      const retryHeaders = { ...headers, Authorization: `Bearer ${data.accessToken}` } as any;
      res = await fetch(url, { ...init, headers: retryHeaders } as any);
    }
  } catch {}
  return res;
}


