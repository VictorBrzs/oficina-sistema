import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { publicApiRequest } from '@/lib/api';

interface LoginProps {
  onLoginSuccess: (accessToken: string, userEmail: string) => void;
}

interface SignupResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

const featureCards = [
  {
    label: 'Ordens',
    description: 'Acompanhe servicos com mais clareza.',
  },
  {
    label: 'Clientes',
    description: 'Cadastros e historicos em um so lugar.',
  },
  {
    label: 'Estoque',
    description: 'Visual rapido para pecas e controle.',
  },
];

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function signInWithRetry(email: string, password: string) {
  const delays = [0, 400, 1200];
  let lastError: unknown = null;

  for (const delay of delays) {
    if (delay > 0) {
      await wait(delay);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.session?.access_token) {
      return data.session;
    }

    lastError = error || new Error('Sessao nao retornada pelo Supabase');
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Nao foi possivel iniciar a sessao apos criar a conta.');
}

async function signUpWithSupabaseAuth(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

function getAuthMessage(error: unknown, mode: 'signup' | 'signin') {
  const fallback =
    mode === 'signup'
      ? 'Nao foi possivel criar a conta.'
      : 'Nao foi possivel entrar.';

  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'Email ou senha invalidos. Se esta conta ainda nao existe, clique em "Criar conta".';
  }

  if (message.includes('user already registered')) {
    return 'Este email ja esta cadastrado. Tente entrar com ele.';
  }

  if (message.includes('email rate limit exceeded')) {
    return 'Muitas tentativas de cadastro em pouco tempo. Aguarde alguns minutos e tente novamente.';
  }

  if (message.includes('email address') && message.includes('invalid')) {
    return 'Esse email nao foi aceito pelo Supabase. Confira o endereco digitado.';
  }

  if (message.includes('fetch')) {
    return 'Falha de conexao com o Supabase. Tente novamente em alguns segundos.';
  }

  return error instanceof Error && error.message ? error.message : fallback;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedName = name.trim();

      try {
        await publicApiRequest<SignupResponse>('/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            email: normalizedEmail,
            password,
            name: normalizedName,
          }),
        });
      } catch (signupFunctionError) {
        console.error('Signup function error:', signupFunctionError);

        await signUpWithSupabaseAuth(normalizedEmail, password, normalizedName);
      }

      try {
        const session = await signInWithRetry(normalizedEmail, password);
        onLoginSuccess(session.access_token, normalizedEmail);
        return;
      } catch (signInAfterSignupError) {
        console.error('Signup signin retry error:', signInAfterSignupError);
      }

      setSuccess(
        'Conta criada com sucesso. Aguarde alguns segundos e entre com seu email e senha.',
      );
      setIsSignup(false);
      setPassword('');
    } catch (err) {
      console.error('Signup error:', err);
      setError(getAuthMessage(err, 'signup'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) throw signInError;

      if (!data.session?.access_token) {
        throw new Error('Sessao nao retornada pelo Supabase');
      }

      onLoginSuccess(data.session.access_token, email.trim().toLowerCase());
    } catch (err) {
      console.error('Signin error:', err);
      setError(getAuthMessage(err, 'signin'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#fffaf5_0%,_#f8fafc_100%)]">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.12),_transparent_24%),radial-gradient(circle_at_85%_20%,_rgba(15,23,42,0.05),_transparent_20%)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center">
          <div className="grid w-full overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-[0_24px_90px_rgba(15,23,42,0.10)] lg:grid-cols-[1.08fr_0.92fr]">
            <section className="relative flex flex-col justify-between gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
              <div className="absolute right-10 top-10 h-24 w-24 rounded-full bg-orange-100" />

              <div className="relative">
                <div className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">
                  sistema para oficinas
                </div>

                <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.02] text-slate-950 sm:text-5xl">
                  Gestao clara para a rotina da oficina.
                </h1>

                <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                  Uma tela direta, com o essencial para apresentar o sistema e
                  facilitar o acesso de quem vai usar no dia a dia.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {featureCards.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {card.label}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <aside className="border-t border-slate-200 bg-slate-50/80 px-6 py-8 sm:px-10 sm:py-10 lg:border-l lg:border-t-0 lg:px-12 lg:py-12">
              <div className="mx-auto max-w-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      acesso
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                      {isSignup ? 'Criar conta' : 'Entrar'}
                    </h2>
                  </div>

                  <div className="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-medium text-orange-700">
                    sistema para oficinas
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {isSignup
                    ? 'Cadastre sua empresa e comece a usar o painel.'
                    : 'Use seu email e senha para acessar o sistema.'}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-2 rounded-[1.2rem] bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignup(false);
                      setError('');
                      setSuccess('');
                    }}
                    className={`rounded-[0.95rem] px-4 py-2.5 text-sm font-medium transition ${
                      !isSignup
                        ? 'bg-slate-950 text-white'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignup(true);
                      setError('');
                      setSuccess('');
                    }}
                    className={`rounded-[0.95rem] px-4 py-2.5 text-sm font-medium transition ${
                      isSignup
                        ? 'bg-slate-950 text-white'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Criar conta
                  </button>
                </div>

                <form
                  onSubmit={isSignup ? handleSignup : handleSignin}
                  className="mt-6 space-y-4"
                >
                  {isSignup && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Nome
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                        placeholder="Seu nome"
                        required={isSignup}
                        autoComplete="name"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                      placeholder="seu@email.com"
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Senha
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
                      placeholder="********"
                      required
                      minLength={6}
                      autoComplete={isSignup ? 'new-password' : 'current-password'}
                    />
                  </div>

                  {error && (
                    <div className="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {success}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-[1rem] bg-orange-600 py-3.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? 'Processando...' : isSignup ? 'Criar conta' : 'Entrar'}
                  </button>
                </form>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
