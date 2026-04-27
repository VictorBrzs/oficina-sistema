import { apiBaseUrl, publicAnonKey } from './supabase';

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  const responseText =
    typeof data === 'string'
      ? data
      : response.statusText || 'Resposta inesperada do servidor.';

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      (response.status === 404
        ? 'Recurso do Supabase nao encontrado. A Edge Function pode precisar ser publicada ou atualizada.'
        : response.status === 401
          ? 'Acesso nao autorizado pelo Supabase. Entre novamente e tente outra vez.'
          : response.status >= 500
            ? 'O Supabase retornou um erro interno. Tente novamente em alguns instantes.'
            : `Nao foi possivel concluir a requisicao (${response.status}: ${responseText}).`);
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
      apikey: publicAnonKey,
      Authorization: `Bearer ${publicAnonKey}`,
      ...init?.headers,
    },
  });
}
