'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import { loadAllData, dbFind, dbGetAll, resetCache } from '@/lib/data';

// ─── Types ───────────────────────────────────────
export interface UserData {
  uid: string;
  nome: string;
  email: string;
  roles: string[];
  alunoId?: string;
  professorId?: string;
  [key: string]: unknown;
}

export interface Session {
  role: string;
  user: Record<string, unknown> | null;
  name: string;
  userData: UserData;
}

interface AuthContextType {
  firebaseUser: User | null;
  userData: UserData | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (cpf: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  enterDashboard: (role: string) => void;
  availableRoles: string[];
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

// ─── Provider ────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  const buildSession = useCallback((role: string, ud: UserData) => {
    let user: Record<string, unknown> | null = null;
    let name = ud.nome || 'Usuário';

    if (role === 'aluno' && ud.alunoId) {
      user = dbFind('alunos', ud.alunoId);
      if (user) name = user.nome as string;
    } else if (role === 'professor' && ud.professorId) {
      user = dbFind('professores', ud.professorId);
      if (user) name = user.nome as string;
    } else if (role === 'diretor') {
      name = ud.nome || 'Diretor(a)';
    } else if (role === 'secretaria') {
      name = ud.nome || 'Secretaria de Educação';
    }

    setSession({ role, user, name, userData: ud });
  }, []);

  // Listen to auth state
  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setUserData(null);
        setSession(null);
        setAvailableRoles([]);
        setLoading(false);
        return;
      }
      try {
        // Load user doc
        const db = getFirebaseDb();
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (!snap.exists()) {
          setError('Conta sem perfil configurado. Contate a direção.');
          await signOut(auth);
          setLoading(false);
          return;
        }
        const ud = { uid: user.uid, ...snap.data() } as UserData;
        setUserData(ud);

        // Load all data
        await loadAllData();

        const roles = ud.roles || [];
        if (roles.length === 0) {
          setError('Conta sem permissão de acesso.');
          await signOut(auth);
          setLoading(false);
          return;
        }
        setAvailableRoles(roles);

        if (roles.length === 1) {
          buildSession(roles[0], ud);
        } else if (roles.length > 1) {
          // Auto-select based on URL if navigating directly
          const path = window.location.pathname;
          const matchedRole = roles.find(r => {
            const rolePath = r === 'secretaria' ? 'semed' : r;
            return path.startsWith(`/dashboard/${rolePath}`);
          });
          if (matchedRole) {
            buildSession(matchedRole, ud);
          }
        }
      } catch (e) {
        console.error('Auth error:', e);
        setError('Erro ao conectar. Tente novamente.');
        await signOut(auth);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [buildSession]);


  const enterDashboard = useCallback((role: string) => {
    if (userData) buildSession(role, userData);
  }, [userData, buildSession]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: unknown) {
      const err = e as { code?: string };
      const msgs: Record<string, string> = {
        'auth/user-not-found': 'Email não cadastrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/invalid-email': 'Email inválido.',
        'auth/too-many-requests': 'Muitas tentativas. Aguarde.',
        'auth/invalid-credential': 'Email ou senha incorretos.',
      };
      setError(msgs[err.code || ''] || 'Email ou senha incorretos.');
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (cpf: string, email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      // Find aluno by CPF
      const alunos = dbGetAll<Record<string, unknown>>('alunos');
      const aluno = alunos.find(a => {
        const c = String(a.cpf || '').replace(/\D/g, '');
        return c === cpf.replace(/\D/g, '');
      });
      if (!aluno) throw new Error('CPF não encontrado na matrícula.');
      if (aluno.uid) throw new Error('CPF já possui conta cadastrada.');

      const auth = getFirebaseAuth();
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const db = getFirebaseDb();

      // Create user doc
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'users', cred.user.uid), {
        nome: aluno.nome,
        email,
        roles: ['aluno'],
        alunoId: aluno.id,
        criadoEm: new Date().toISOString(),
      });

      // Link aluno to uid
      await updateDoc(doc(db, 'alunos', aluno.id as string), { uid: cred.user.uid });
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      const msgs: Record<string, string> = {
        'auth/email-already-in-use': 'Este email já está em uso.',
        'auth/weak-password': 'Senha muito fraca (mín. 6 caracteres).',
        'auth/invalid-email': 'Email inválido.',
      };
      setError(msgs[err.code || ''] || err.message || 'Erro ao criar conta.');
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    setSession(null);
    setUserData(null);
    setAvailableRoles([]);
    resetCache();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{
      firebaseUser, userData, session, loading, error,
      login, register, logout, enterDashboard, availableRoles, clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
