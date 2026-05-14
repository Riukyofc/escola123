'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { ToastContainer, ConfirmDialog } from '@/components/ui/DashboardUI';
import '../dashboard.css';

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { firebaseUser, session, loading, availableRoles } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Sync dark mode from localStorage
    if (typeof window !== 'undefined' && localStorage.getItem('darkMode') === 'true') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    const isLoginPage = pathname === '/dashboard/login';

    if (!firebaseUser && !isLoginPage) {
      console.log('Redirecting to login: No firebaseUser');
      router.replace('/dashboard/login');
      return;
    }

    // Se tem usuário mas não tem sessão (precisa escolher role), e não está no login
    if (firebaseUser && !session && !isLoginPage) {
      console.log('Redirecting to login: Has user but no session');
      router.replace('/dashboard/login');
      return;
    }

    if (firebaseUser && session && isLoginPage) {
      const path = session.role === 'secretaria' ? 'semed' : session.role;
      console.log('Redirecting to role dashboard:', path);
      router.replace(`/dashboard/${path}`);
      return;
    }
  }, [firebaseUser, session, loading, pathname, router]);

  const isLoginPage = pathname === '/dashboard/login';

  if (loading && !isLoginPage) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: 16 }}>
        <i className="fa-solid fa-spinner spin" style={{ fontSize: '2rem', color: 'var(--color-accent)' }} />
        <div style={{ color: 'var(--fg-muted)', fontWeight: 600 }}>Carregando...</div>
      </div>
    );
  }

  if (isLoginPage) return <>{children}</>;

  if (!session) return null;

  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardGuard>{children}</DashboardGuard>
      <ToastContainer />
      <ConfirmDialog />
    </AuthProvider>
  );
}
