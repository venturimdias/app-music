import { useAuth } from '../auth/AuthContext';

export function Home() {
  const { user } = useAuth();

  const primeiroNome = user?.nome?.trim().split(' ')[0] ?? '';

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-marinho">
          Bem-vindo{primeiroNome ? `, ${primeiroNome}` : ''} ♪
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Sugestões de playlists para suas celebrações.
        </p>
      </header>

      {/* Sugestões de playlist — conteúdo definitivo virá futuramente
          (ex.: "Festa de São Pedro"). Por ora, um placeholder. */}
      <section>
        <h2 className="mb-3 font-display text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Sugestões para você
        </h2>
        <div className="rounded-xl border border-dashed border-nevoa bg-white p-8 text-center">
          <p className="text-sm text-neutral-500">
            Em breve: sugestões de playlists para as próximas festas litúrgicas.
          </p>
        </div>
      </section>
    </div>
  );
}
