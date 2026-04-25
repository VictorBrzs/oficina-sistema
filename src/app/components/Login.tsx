import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface LoginProps {
  onLoginSuccess: (accessToken: string, userEmail: string) => void;
}

function getAuthMessage(error: unknown, mode: 'signup' | 'signin') {
  const fallback =
    mode === 'signup'
      ? 'Nao foi possivel criar a conta.'
      : 'Nao foi possivel entrar.';

  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'Email ou senha invalidos. Se esta conta ainda nao existe, clique em "Registre-se".';
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.session?.access_token) {
        onLoginSuccess(data.session.access_token, email.trim());
        return;
      }

      setSuccess('Conta criada com sucesso. Agora tente entrar com seu email e senha.');
      setIsSignup(false);
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
        email: email.trim(),
        password,
      });

      if (signInError) throw signInError;

      if (!data.session?.access_token) {
        throw new Error('Sessao nao retornada pelo Supabase');
      }

      onLoginSuccess(data.session.access_token, email.trim());
    } catch (err) {
      console.error('Signin error:', err);
      setError(getAuthMessage(err, 'signin'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.12),_transparent_24%),linear-gradient(145deg,_#fff7ed,_#f8fafc_50%,_#e2e8f0)] p-4">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden rounded-[2rem] border border-white/60 bg-slate-950/92 p-10 text-white shadow-2xl shadow-orange-200/40 backdrop-blur lg:block">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-orange-200">
            Estoque, servicos e categorias em um unico painel
          </div>
          <h1 className="mt-8 max-w-xl text-5xl font-semibold leading-tight">
            Gestao de oficina com dados salvos no Supabase em tempo real.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-300">
            Acompanhe pecas, valor em estoque e itens com pouca cobertura em uma
            interface mais limpa e pronta para uso diario.
          </p>
        </section>

        <div className="w-full max-w-md justify-self-center">
          <div className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-2xl shadow-slate-300/30 backdrop-blur">
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-200">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">
                {isSignup ? 'Criar Conta' : 'AutoMaster'}
              </h1>
              <p className="text-gray-600">
                {isSignup
                  ? 'Cadastre-se para acessar o painel'
                  : 'Entre com sua conta para continuar'}
              </p>
            </div>

            <form
              onSubmit={isSignup ? handleSignup : handleSignin}
              className="space-y-4"
            >
              {isSignup && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-transparent focus:ring-2 focus:ring-orange-500"
                    placeholder="Seu nome"
                    required={isSignup}
                    autoComplete="name"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-transparent focus:ring-2 focus:ring-orange-500"
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-transparent focus:ring-2 focus:ring-orange-500"
                  placeholder="********"
                  required
                  minLength={6}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-orange-600 py-3 font-medium text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Processando...' : isSignup ? 'Criar Conta' : 'Entrar'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError('');
                  setSuccess('');
                }}
                className="text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                {isSignup
                  ? 'Ja tem uma conta? Entre aqui'
                  : 'Nao tem conta? Registre-se'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
