import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-indigo-600 text-white'
            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

function Chevron({ aberto }: { aberto: boolean }) {
  return (
    <svg
      className={`h-3 w-3 transition-transform ${aberto ? '' : '-rotate-90'}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// Grupo de navegação recolhível. A preferência (aberto/fechado) é lembrada
// no localStorage para sobreviver a recarregamentos.
function NavGroup({
  label,
  storageKey,
  defaultOpen = false,
  children,
}: {
  label: string;
  storageKey: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [aberto, setAberto] = useState(() => {
    const v = localStorage.getItem(storageKey);
    return v === null ? defaultOpen : v === '1'; // sem preferência salva, usa o default do grupo
  });

  function alternar() {
    setAberto((atual) => {
      const novo = !atual;
      localStorage.setItem(storageKey, novo ? '1' : '0');
      return novo;
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={alternar}
        aria-expanded={aberto}
        className="mt-5 mb-1 flex w-full items-center justify-between rounded px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-300"
      >
        <span>{label}</span>
        <Chevron aberto={aberto} />
      </button>
      {aberto && <div>{children}</div>}
    </div>
  );
}

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-slate-700/60 px-5 py-5">
        <span className="text-2xl leading-none">♪</span>
        <span className="text-base font-bold tracking-tight text-white">LouvorApp</span>
      </div>

      {/* Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <NavGroup label="Cadastros" storageKey="nav:cadastros" defaultOpen>
          <NavItem to="/songs" label="Músicas" />
          <NavItem to="/playlists" label="Playlists" />

          {user?.perfil === 'ADM' && (
            <>
              <NavItem to="/tempo" label="Tempos litúrgicos" />
              <NavItem to="/momento" label="Momentos litúrgicos" />
              <NavItem to="/artista" label="Artistas" />
            </>
          )}
        </NavGroup>

        {user?.perfil !== 'DEMO' && (
          <NavGroup label="Administração" storageKey="nav:administracao">
            <NavItem to="/account/password" label="Alterar senha" />
            {user?.perfil === 'PARTICIPANTE' && (
              <>
                <NavItem to="/planos" label="Planos" />
                <NavItem to="/account/subscription" label="Minha assinatura" />
              </>
            )}

            {user?.perfil === 'ADM' && (
              <>
                <NavItem to="/admin/planos" label="Planos" />
                <NavItem to="/admin/pagamentos" label="Pagamentos" />
                <NavItem to="/usuario" label="Usuários" />
                <NavItem to="/perfil" label="Perfis" />
              </>
            )}
          </NavGroup>
        )}
      </nav>

      {/* Rodapé: usuário + sair */}
      <div className="border-t border-slate-700/60 px-3 py-3">
        <div className="mb-2 px-3">
          <p className="truncate text-xs font-medium text-white">{user?.email}</p>
          <p className="text-[10px] text-slate-400">{user?.perfil}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
        >
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* ── Sidebar desktop (md+) ──────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-slate-900 md:flex">
        {sidebarContent}
      </aside>

      {/* ── Sidebar mobile: overlay + drawer ───────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 flex-col bg-slate-900 transition-transform duration-200 md:hidden ${
          open ? 'flex translate-x-0' : 'flex -translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* ── Área principal ─────────────────────────────────────────────────── */}
      <div className="flex min-h-screen flex-1 flex-col md:ml-60">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-md p-1 text-slate-600 hover:bg-slate-100"
            aria-label="Abrir menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-bold text-slate-800">♪ LouvorApp</span>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
