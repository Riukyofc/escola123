'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getConfig, isSistemaClosed, dbGetAll } from '@/lib/data';
import SearchPalette from './SearchPalette';
import NotificationPanel from './NotificationPanel';

const NAV: Record<string, { path: string; icon: string; label: string; sub: string }[]> = {
  aluno: [
    { path: '/dashboard/aluno', icon: 'fa-gauge-high', label: 'Início', sub: 'Resumo geral' },
    { path: '/dashboard/aluno/notas', icon: 'fa-chart-bar', label: 'Minhas Notas', sub: 'Notas por bimestre' },
    { path: '/dashboard/aluno/frequencia', icon: 'fa-calendar-check', label: 'Minha Frequência', sub: 'Presença nas aulas' },
    { path: '/dashboard/aluno/avisos', icon: 'fa-bell', label: 'Avisos', sub: 'Comunicados da escola' },
  ],
  professor: [
    { path: '/dashboard/professor', icon: 'fa-gauge-high', label: 'Início', sub: 'Visão geral da turma' },
    { path: '/dashboard/professor/notas', icon: 'fa-pen-to-square', label: 'Lançar Notas', sub: 'Notas por bimestre' },
    { path: '/dashboard/professor/turma', icon: 'fa-users', label: 'Minha Turma', sub: 'Lista de alunos' },
    { path: '/dashboard/professor/frequencia', icon: 'fa-calendar-check', label: 'Frequência', sub: 'Registro de presença' },
    { path: '/dashboard/professor/diario', icon: 'fa-book-open', label: 'Diário Digital', sub: 'Registros de aula' },
    { path: '/dashboard/professor/atividades', icon: 'fa-clipboard-list', label: 'Atividades', sub: 'Exercícios e tarefas' },
    { path: '/dashboard/professor/aee', icon: 'fa-heart-pulse', label: 'AEE', sub: 'Atendimento Especializado' },
    { path: '/dashboard/professor/mensagens', icon: 'fa-comments', label: 'Mensagens', sub: 'Comunicação com direção' },
    { path: '/dashboard/professor/calendario', icon: 'fa-calendar-days', label: 'Calendário', sub: 'Eventos escolares' },
    { path: '/dashboard/professor/avisos', icon: 'fa-bell', label: 'Avisos', sub: 'Publicar comunicados' },
  ],
  diretor: [
    { path: '/dashboard/diretor', icon: 'fa-gauge-high', label: 'Dashboard', sub: 'Visão geral da escola' },
    { path: '/dashboard/diretor/alunos', icon: 'fa-user-graduate', label: 'Alunos', sub: 'Cadastro de alunos' },
    { path: '/dashboard/diretor/professores', icon: 'fa-chalkboard-user', label: 'Professores', sub: 'Cadastro de professores' },
    { path: '/dashboard/diretor/turmas', icon: 'fa-chalkboard', label: 'Turmas', sub: 'Salas e turnos' },
    { path: '/dashboard/diretor/horarios', icon: 'fa-clock', label: 'Horários', sub: 'Grade semanal de aulas' },
    { path: '/dashboard/diretor/calendario', icon: 'fa-calendar-days', label: 'Calendário', sub: 'Eventos escolares' },
    { path: '/dashboard/diretor/diarios', icon: 'fa-book-open', label: 'Diários', sub: 'Aprovar diários de classe' },
    { path: '/dashboard/diretor/relatorios', icon: 'fa-chart-pie', label: 'Relatórios', sub: 'Notas e desempenho' },
    { path: '/dashboard/diretor/mensagens', icon: 'fa-comments', label: 'Mensagens', sub: 'Comunicação com professores' },
    { path: '/dashboard/diretor/conteudo', icon: 'fa-palette', label: 'Conteúdo do Site', sub: 'Equipe, galeria e depoimentos' },
    { path: '/dashboard/diretor/circulares', icon: 'fa-scroll', label: 'Circulares SEMED', sub: 'Ofícios e resoluções' },
    { path: '/dashboard/diretor/avisos', icon: 'fa-bell', label: 'Avisos', sub: 'Comunicados gerais' },
    { path: '/dashboard/diretor/config', icon: 'fa-sliders', label: 'Configurações', sub: 'Dados e senhas' },
  ],
  secretaria: [
    { path: '/dashboard/semed', icon: 'fa-building-columns', label: 'Dashboard', sub: 'Visão macro da educação' },
    { path: '/dashboard/semed/escolas', icon: 'fa-school', label: 'Escolas da Rede', sub: 'Cadastro e gestão' },
    { path: '/dashboard/semed/financeiro', icon: 'fa-money-bill-wave', label: 'Financeiro', sub: 'Repasses e merenda' },
    { path: '/dashboard/semed/indicadores', icon: 'fa-chart-line', label: 'Indicadores', sub: 'Censo e rendimento' },
    { path: '/dashboard/semed/circulares', icon: 'fa-scroll', label: 'Circulares', sub: 'Ofícios e resoluções' },
  ],
};

const roleLabels: Record<string, string> = { aluno: 'Aluno', professor: 'Professor(a)', diretor: 'Diretor(a)', secretaria: 'SEMED' };
const roleColors: Record<string, string> = { aluno: '#059669', professor: '#2563eb', diretor: '#d97706', secretaria: '#991b1b' };

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { session, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('darkMode') === 'true';
    setDarkMode(saved);
    if (saved) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('darkMode', String(next));
      document.documentElement.classList.toggle('dark', next);
      document.body.classList.toggle('dark-mode', next);
      return next;
    });
  }, []);

  // Global keyboard shortcut: Ctrl+K for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!session) return null;

  const navItems = NAV[session.role] || [];
  const currentNav = navItems.find(n => n.path === pathname) || navItems[0];
  const closed = isSistemaClosed();
  const initial = session.name.charAt(0).toUpperCase();

  return (
    <div id="dashboard-app" className="active">
      {/* Sidebar overlay mobile */}
      {sidebarOpen && <div id="sidebar-overlay" className="open" onClick={() => setSidebarOpen(false)} />}

      {/* SIDEBAR */}
      <aside id="dash-sidebar" className={sidebarOpen ? 'open' : ''}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon"><i className="fa-solid fa-school" /></div>
            <div className="sidebar-logo-text">
              <div className="s-name">Edith Nair</div>
              <div className="s-sub">Portal Escolar</div>
              <div className="sidebar-semed">SEMED · Viana·MA</div>
            </div>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-inner">
            <div className="sidebar-avatar" style={{ background: roleColors[session.role] }}>{initial}</div>
            <div style={{ minWidth: 0 }}>
              <div className="sidebar-user-name">{session.name}</div>
              <div className="sidebar-user-role">
                <span className="role-badge" style={{ background: `${roleColors[session.role]}22`, color: roleColors[session.role] }}>
                  {roleLabels[session.role]}
                </span>
              </div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Menu</div>
          {navItems.map(item => (
            <Link
              key={item.path}
              href={item.path}
              className={`sidebar-link ${pathname === item.path ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <i className={`fa-solid ${item.icon}`} /> {item.label}
            </Link>
          ))}
        </nav>

        <div className="system-status-bar">
          <div className={`system-status-inner ${closed ? 'closed' : 'open'}`}>
            <div className="system-status-dot" />
            <span>{closed ? 'Sistema fechado' : 'Sistema aberto'}</span>
          </div>
        </div>

        <div className="sidebar-footer">
          <Link href="/" className="sidebar-site-link"><i className="fa-solid fa-arrow-up-right-from-square" /> Ver site público</Link>
          <button className="sidebar-logout" onClick={logout}><i className="fa-solid fa-right-from-bracket" /> Sair</button>
        </div>
      </aside>

      {/* MAIN */}
      <div id="dash-main">
        <div className="dash-topbar">
          <div className="topbar-left">
            <button id="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <i className="fa-solid fa-bars" />
            </button>
            <div className="topbar-title-block">
              <div id="topbar-page-title">{currentNav?.label || 'Dashboard'}</div>
              <div id="topbar-page-sub">{currentNav?.sub || ''}</div>
            </div>
          </div>
          <div className="topbar-right">
            {/* Search Button */}
            <button className="topbar-action-btn" onClick={() => setSearchOpen(true)} data-tooltip="Buscar (Ctrl+K)">
              <i className="fa-solid fa-magnifying-glass" />
            </button>

            {/* Dark Mode Toggle */}
            <button className="topbar-action-btn" onClick={toggleDarkMode} data-tooltip={darkMode ? 'Modo claro' : 'Modo escuro'}>
              <i className={`fa-solid ${darkMode ? 'fa-sun' : 'fa-moon'}`} />
            </button>

            {/* Notifications Bell */}
            <div style={{ position: 'relative' }}>
              <button className="topbar-action-btn" onClick={() => setNotifOpen(!notifOpen)}>
                <i className="fa-solid fa-bell" />
                <span className="topbar-bell-badge" id="notif-badge" />
              </button>
              <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>

            <div className={`topbar-system-badge ${closed ? 'closed' : 'open'}`}>
              <i className="fa-solid fa-circle" style={{ fontSize: '.55rem' }} />
              <span>{closed ? 'Fechado' : 'Aberto'}</span>
            </div>
            <div className="topbar-avatar" style={{ background: roleColors[session.role] }}>{initial}</div>
          </div>
        </div>

        <div className="dash-pages">
          <div className="dash-page active">
            {children}
          </div>
        </div>
      </div>

      {/* BOTTOM NAV (Mobile) */}
      <nav id="bottom-nav">
        <div id="bottom-nav-inner">
          {navItems.slice(0, 5).map(item => (
            <Link
              key={item.path}
              href={item.path}
              className={`bnav-item ${pathname === item.path ? 'active' : ''}`}
            >
              <i className={`fa-solid ${item.icon}`} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Search Palette (Ctrl+K) */}
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} navItems={navItems} />
    </div>
  );
}
