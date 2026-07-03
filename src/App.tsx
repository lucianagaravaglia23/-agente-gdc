import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useGdcStore } from './store/store';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewProjectPage } from './pages/NewProjectPage';
import { QuestionnairePage } from './pages/QuestionnairePage';
import { ResultPage } from './pages/ResultPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { LeaderPanelPage } from './pages/LeaderPanelPage';
import { GdcConsultationsPage } from './pages/GdcConsultationsPage';
import { UsersPage } from './pages/UsersPage';

function ProtectedLayout() {
  const session = useGdcStore((s) => s.session);
  const authChecked = useGdcStore((s) => s.authChecked);
  const initialized = useGdcStore((s) => s.initialized);

  if (!authChecked || (session && !initialized)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Cargando…
      </div>
    );
  }
  if (!session) return <Navigate to="/" replace />;
  return <Layout />;
}

export default function App() {
  const setSession = useGdcStore((s) => s.setSession);
  const setAuthChecked = useGdcStore((s) => s.setAuthChecked);
  const initialize = useGdcStore((s) => s.initialize);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecked(true);
      if (data.session) void initialize();
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthChecked(true);
      if (session) void initialize();
    });

    return () => subscription.subscription.unsubscribe();
  }, [setSession, setAuthChecked, initialize]);

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/proyectos/nuevo" element={<NewProjectPage />} />
        <Route path="/proyectos/:id/cuestionario" element={<QuestionnairePage />} />
        <Route path="/proyectos/:id/resultado" element={<ResultPage />} />
        <Route path="/proyectos/:id" element={<ProjectDetailPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/usuarios" element={<UsersPage />} />
        <Route path="/panel-lider" element={<LeaderPanelPage />} />
        <Route path="/consultas-gdc" element={<GdcConsultationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
