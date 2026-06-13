import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Sem sessão (cookie) válida → redireciona pra /login (regra transversal da spec).
export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Carregando…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <Outlet />;
}

// Páginas exclusivas de ADM; participante é devolvido para /songs.
export function RequireAdm() {
  const { user } = useAuth();

  if (user?.perfil !== 'ADM') {
    return <Navigate to="/songs" replace />;
  }
  return <Outlet />;
}
