'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, type Permission } from '@/lib/permissions';

interface PermissionGuardProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wrapper component that only renders children if user has the required permission.
 */
export default function PermissionGuard({ permission, children, fallback }: PermissionGuardProps) {
  const { session } = useAuth();
  
  if (!session) return null;
  
  if (!hasPermission(session.role, permission)) {
    if (fallback) return <>{fallback}</>;
    return (
      <div style={{
        textAlign: 'center', padding: '48px 24px',
        color: 'var(--text-muted)',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12, opacity: 0.3 }}>
          <i className="fa-solid fa-lock" />
        </div>
        <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
          Acesso Restrito
        </div>
        <div style={{ fontSize: '.82rem' }}>
          Você não tem permissão para acessar este recurso.
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
