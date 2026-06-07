import { useAuthStore } from '@/store/authStore';

const BASE_URL = '/api';

export interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { skipAuth, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (!skipAuth) {
    const state = useAuthStore.getState();
    if (state.token) {
      finalHeaders['Authorization'] = `Bearer ${state.token}`;
    }
    if (state.currentUser?.role) {
      finalHeaders['x-user-role'] = state.currentUser.role;
    }
    if (state.currentUser?.id) {
      finalHeaders['x-user-id'] = state.currentUser.id;
    }
  }

  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  const response = await fetch(url, {
    ...rest,
    headers: finalHeaders,
  });

  if (!response.ok) {
    let message = `请求失败: ${response.status}`;
    try {
      const err = await response.json();
      if (err?.message) message = err.message;
    } catch {
      try {
        const text = await response.text();
        if (text) message = text;
      } catch {
        // ignore
      }
    }
    throw new Error(message);
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}
