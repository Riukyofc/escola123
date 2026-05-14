'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardIndex() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (session) {
      const roleMap: Record<string, string> = { secretaria: 'semed' };
      const path = roleMap[session.role] || session.role;
      router.replace(`/dashboard/${path}`);
    } else {
      router.replace('/dashboard/login');
    }
  }, [session, loading, router]);

  return null;
}
