import { useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck, User } from 'lucide-react';

interface AdminAuthScreenProps {
  configured: boolean;
  defaultUsername: string;
  onAuthenticated: (token: string, username: string) => void;
}

export function AdminAuthScreen({
  configured,
  defaultUsername,
  onAuthenticated,
}: AdminAuthScreenProps) {
  const [username, setUsername] = useState(defaultUsername || 'immo');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const endpoint = configured ? '/api/auth/login' : '/api/auth/setup';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = (await response.json()) as {
        token?: string;
        admin?: { username: string };
        error?: string;
      };

      if (!response.ok || !data.token || !data.admin) {
        setError(data.error || 'Échec de l’authentification.');
        return;
      }

      onAuthenticated(data.token, data.admin.username);
    } catch {
      setError('Impossible de joindre le serveur d’authentification.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Navy & Gold Header */}
        <div className="bg-[#0B1F3A] px-8 py-7 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C9A24D] text-[#0B1F3A] font-display font-bold text-base tracking-tight shrink-0">
              IL
            </span>
            <div>
              <h1 className="font-display text-lg font-semibold tracking-tight text-white">
                ImmoLuxe
              </h1>
              <p className="text-xs text-slate-300">
                Administration du tableau de bord
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#9A7524] mb-1">
              <ShieldCheck className="h-4 w-4" />
              <span>
                {configured
                  ? 'Accès administrateur protégé'
                  : 'Configuration initiale du compte administrateur'}
              </span>
            </div>
            <h2 className="font-display text-xl font-bold text-[#0B1F3A]">
              {configured ? 'Connexion administrateur' : 'Définir l’accès administrateur'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {configured
                ? 'Saisissez votre identifiant et votre mot de passe pour gérer les biens, ventes, clients et conseillers.'
                : 'Créez le mot de passe administrateur pour sécuriser l’accès au tableau de bord (pensez à configurer ADMIN_PASSWORD dans les secrets avant le partage).'}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="admin-username"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Identifiant administrateur
              </label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="immo"
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={4}
                  autoComplete={configured ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-10 py-2.5 text-sm text-[#0B1F3A] focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                  aria-label={
                    showPassword
                      ? 'Masquer le mot de passe'
                      : 'Afficher le mot de passe'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-lg bg-[#0B1F3A] text-white text-sm font-semibold hover:bg-[#132F54] disabled:opacity-60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24D]"
          >
            {submitting
              ? 'Vérification...'
              : configured
                ? 'Se connecter'
                : 'Activer et accéder au dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
