import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home,
  Music,
  ListMusic,
  CalendarDays,
  Clock,
  Mic,
  KeyRound,
  Sparkles,
  CreditCard,
  Receipt,
  Users,
  ShieldCheck,
  LogOut,
  Menu,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import logoBranco from '../assets/louvorapp-horizontal-branco.png';
import logoColorido from '../assets/louvorapp-horizontal.png';

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: LucideIcon }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-md px-3 py-2 font-display text-sm transition-colors ${
          isActive
            ? 'bg-teal-400/15 font-semibold text-white'
            : 'font-medium text-white/65 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={isActive ? 'text-teal-300' : 'text-white/55'}
            size={19}
            strokeWidth={isActive ? 2.4 : 2}
          />
          {label}
        </>
      )}
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
        className="mt-5 mb-1 flex w-full items-center justify-between rounded px-3 py-1 font-display text-[10px] font-semibold uppercase tracking-widest text-white/40 transition-colors hover:text-white/70"
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
      <div className="flex items-center border-b border-white/10 px-5 py-5">
        <img src={logoBranco} alt="LouvorApp" className="h-7 w-auto" />
      </div>

      {/* Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <NavItem to="/" label="Início" icon={Home} />

        <NavGroup label="Cadastros" storageKey="nav:cadastros" defaultOpen>
          <NavItem to="/songs" label="Músicas" icon={Music} />
          <NavItem to="/playlists" label="Playlists" icon={ListMusic} />

          {user?.perfil === 'ADM' && (
            <>
              <NavItem to="/tempo" label="Tempos litúrgicos" icon={CalendarDays} />
              <NavItem to="/momento" label="Momentos litúrgicos" icon={Clock} />
              <NavItem to="/artista" label="Artistas" icon={Mic} />
            </>
          )}
        </NavGroup>

        {user?.perfil !== 'DEMO' && (
          <NavGroup label="Administração" storageKey="nav:administracao">
            <NavItem to="/account/password" label="Alterar senha" icon={KeyRound} />
            {user?.perfil === 'PARTICIPANTE' && (
              <>
                <NavItem to="/planos" label="Planos" icon={Sparkles} />
                <NavItem to="/account/subscription" label="Minha assinatura" icon={CreditCard} />
              </>
            )}

            {user?.perfil === 'ADM' && (
              <>
                <NavItem to="/admin/planos" label="Planos" icon={Sparkles} />
                <NavItem to="/admin/pagamentos" label="Pagamentos" icon={Receipt} />
                <NavItem to="/usuario" label="Usuários" icon={Users} />
                <NavItem to="/perfil" label="Perfis" icon={ShieldCheck} />
              </>
            )}
          </NavGroup>
        )}
      </nav>

      {/* Rodapé: usuário + sair */}
      <div className="border-t border-white/10 px-3 py-3">
        <div className="mb-2 px-3">
          <p className="truncate text-xs font-medium text-white">{user?.email}</p>
          <p className="text-[10px] text-white/45">{user?.perfil}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 font-display text-sm font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut size={19} strokeWidth={2} className="text-white/55" />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-papel">
      {/* ── Sidebar desktop (md+) ──────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-marinho-profundo md:flex">
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
        className={`fixed inset-y-0 left-0 z-50 w-60 flex-col bg-marinho-profundo transition-transform duration-200 md:hidden ${
          open ? 'flex translate-x-0' : 'flex -translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* ── Área principal ─────────────────────────────────────────────────── */}
      <div className="flex min-h-screen flex-1 flex-col md:ml-60">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-nevoa bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-md p-1 text-marinho hover:bg-papel"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img src={logoColorido} alt="LouvorApp" className="h-6 w-auto" />
        </header>

        <main className="flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
