import { apiBaseUrl, publicAnonKey } from './supabase';

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error || data?.message || 'Nao foi possivel concluir a requisicao.';
    throw new Error(message);
  }

  return data as T;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, init);

    return parseResponse<T>(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Falha de conexao com o Supabase. Verifique sua internet e tente novamente.',
      );
    }

    throw error;
  }
}

export async function apiRequest<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  return request<T>(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });
}

export async function publicApiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  return request<T>(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${publicAnonKey}`,
      ...init?.headers,
    },
  });
}
