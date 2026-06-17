import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { RequireAdm, RequireAuth } from './auth/RequireAuth';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CadastroBase } from './pages/adm/CadastroBase';
import { Perfis } from './pages/adm/Perfis';
import { Usuarios } from './pages/adm/Usuarios';
import { Songs } from './pages/songs/Songs';
import { SongDetalhe } from './pages/songs/SongDetalhe';
import { SongForm } from './pages/songs/SongForm';
import { Playlists } from './pages/playlists/Playlists';
import { PlaylistDetalhe } from './pages/playlists/PlaylistDetalhe';
import { ListaRepertorio } from './pages/playlists/ListaRepertorio';
import { Planos } from './pages/planos/Planos';
import { AdminPlanos } from './pages/adm/AdminPlanos';
import { AdminPagamentos } from './pages/adm/AdminPagamentos';
import { MinhaAssinatura } from './pages/account/MinhaAssinatura';
import { AlterarSenha } from './pages/account/AlterarSenha';
import { BillingSucesso } from './pages/billing/BillingSucesso';
import { BillingCancelado } from './pages/billing/BillingCancelado';
import { BillingPix } from './pages/billing/BillingPix';

// /login e /register não fazem sentido para quem já está logado.
function PublicOnly({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/songs" replace /> : children;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

      {/* Acesso externo, sem login — protegido pela senha da playlist */}
      <Route path="/lista-repertorio/:slug" element={<ListaRepertorio />} />
      <Route path="/billing/sucesso" element={<BillingSucesso />} />
      <Route path="/billing/cancelado" element={<BillingCancelado />} />
      <Route path="/billing/pix" element={<BillingPix />} />

      {/* Rotas autenticadas */}
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/songs" replace />} />

          <Route path="/songs" element={<Songs />} />
          <Route path="/songs/:id" element={<SongDetalhe />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/playlists/:id" element={<PlaylistDetalhe />} />
          <Route path="/planos" element={<Planos />} />
          <Route path="/account/subscription" element={<MinhaAssinatura />} />
          <Route path="/account/password" element={<AlterarSenha />} />

          {/* Só ADM */}
          <Route element={<RequireAdm />}>
            <Route path="/admin/planos" element={<AdminPlanos />} />
            <Route path="/admin/pagamentos" element={<AdminPagamentos />} />
            <Route path="/songs/new" element={<SongForm />} />
            <Route path="/songs/:id/edit" element={<SongForm />} />
            <Route
              path="/tempo"
              element={<CadastroBase recurso="tempo" tituloPagina="Tempos litúrgicos" nomeItem="tempo" />}
            />
            <Route
              path="/momento"
              element={<CadastroBase recurso="momento" tituloPagina="Momentos litúrgicos" nomeItem="momento" />}
            />
            <Route
              path="/artista"
              element={<CadastroBase recurso="artista" tituloPagina="Artistas" nomeItem="artista" />}
            />
            <Route path="/usuario" element={<Usuarios />} />
            <Route path="/perfil" element={<Perfis />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
