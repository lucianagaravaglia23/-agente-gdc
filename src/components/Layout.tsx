import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useGdcStore } from '../store/store';

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

function TemplateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" strokeLinecap="round" />
      <path d="M16 4.5c1.7.4 3 1.9 3 3.7 0 1.8-1.3 3.3-3 3.7M21.5 20c0-3-2.1-5.3-5-5.9" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20V10M12 20V4M20 20v-7" strokeLinecap="round" />
      <path d="M2.5 20h19" strokeLinecap="round" />
    </svg>
  );
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 12h4.5l1.5 3h6l1.5-3H21" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="6" width="18" height="13" rx="2" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ className, direction }: { className?: string; direction: 'left' | 'right' | 'down' }) {
  const rotation = direction === 'left' ? 'rotate-180' : direction === 'down' ? 'rotate-90' : '';
  return (
    <svg className={`${className} ${rotation}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

const DEMO_LABEL = 'Demo';

const NAV_ITEMS = [
  { to: '/dashboard', end: true, label: 'Dashboard', Icon: DashboardIcon },
  { to: '/templates', end: false, label: 'Templates', Icon: TemplateIcon },
  { to: '/usuarios', end: false, label: 'Usuarios', Icon: UsersIcon },
  { to: '/panel-lider', end: false, label: 'Panel Líder', Icon: ChartIcon },
] as const;

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const signOut = useGdcStore((s) => s.signOut);
  const questionEscalations = useGdcStore((s) => s.questionEscalations);

  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const openConsultCount = useMemo(
    () => questionEscalations.filter((e) => e.estado === 'abierta').length,
    [questionEscalations],
  );

  const navItems = useMemo(() => {
    const items: { to: string; end: boolean; label: string; Icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
      ...NAV_ITEMS,
    ];
    items.push({ to: '/consultas-gdc', end: false, label: 'Consultas GDC', Icon: InboxIcon, badge: openConsultCount });
    return items;
  }, [openConsultCount]);

  const currentSectionLabel = useMemo(() => {
    const match = navItems.find((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)));
    return match?.label ?? 'Agente GDC';
  }, [navItems, location.pathname]);

  const handleLogout = () => {
    void signOut();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside
        className={`flex shrink-0 flex-col bg-sidebar py-4 transition-all ${collapsed ? 'w-16 items-center' : 'w-60 px-3'}`}
      >
        <div className={`mb-6 flex items-center gap-2 ${collapsed ? 'justify-center' : 'px-1'}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white">
            GDC
          </div>
          {!collapsed && <span className="text-sm font-semibold text-white">Agente GDC</span>}
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  collapsed ? 'justify-center' : ''
                } ${isActive ? 'bg-brand-500 text-white' : 'text-slate-400 hover:bg-sidebar-hover hover:text-white'}`
              }
            >
              <item.Icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <span className="flex flex-1 items-center justify-between">
                  {item.label}
                  {!!item.badge && (
                    <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                      {item.badge}
                    </span>
                  )}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="mt-2 flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-sidebar-hover hover:text-white"
        >
          <ChevronIcon className="h-4 w-4" direction={collapsed ? 'right' : 'left'} />
        </button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <span className="text-sm font-semibold text-slate-800">{currentSectionLabel}</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400">
              <SearchIcon className="h-4 w-4" />
              <input
                placeholder="Buscar…"
                disabled
                className="w-40 bg-transparent text-slate-500 outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {initials(DEMO_LABEL)}
                </div>
                <div className="text-left text-sm leading-tight">
                  <p className="font-medium text-slate-800">{DEMO_LABEL}</p>
                  <p className="text-xs text-slate-500">Equipo Experto de GDC</p>
                </div>
                <ChevronIcon className="h-4 w-4 text-slate-400" direction="down" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 z-10 mt-2 w-44 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
