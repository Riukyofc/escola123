// =============================================================
// DATA.TS — Firestore Data Layer (React Hooks + Cache)
// =============================================================
'use client';

import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import type { DataCache, Escola, Config } from './types';
import { SEED } from './seed';

// ─── IN-MEMORY CACHE ──────────────────────────────────────────
let CACHE: Partial<DataCache> = {};
let dataLoaded = false;

// ─── REFRESH LISTENERS ───────────────────────────────────────
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export function onCacheChange(fn: Listener) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function notifyListeners() {
  listeners.forEach(fn => fn());
}

const LIST_COLLECTIONS = [
  'turmas', 'professores', 'disciplinas', 'alunos', 'notas', 'frequencia',
  'diario', 'atividades', 'aee', 'avisos', 'horarios_aula', 'eventos_calendario',
  'equipe', 'galeria', 'depoimentos', 'repasses_financeiros', 'estoque_merenda',
  'circulares', 'ideb_historico', 'consumo_merenda', 'escolas_rede', 'mensagens',
];
const SINGLETON_COLLECTIONS = ['escola', 'config'];

// ─── LOAD ALL DATA ────────────────────────────────────────────
export async function loadAllData(): Promise<Partial<DataCache>> {
  if (dataLoaded) return CACHE;

  const db = getFirebaseDb();
  console.log('📦 Carregando dados do Firestore...');
  const start = Date.now();

  const singletonPromises = SINGLETON_COLLECTIONS.map(async (key) => {
    try {
      const snap = await getDoc(doc(db, key, 'info'));
      CACHE[key] = snap.exists() ? snap.data() as Escola | Config : null;
    } catch (e) {
      console.warn(`Erro ao carregar ${key}:`, e);
      CACHE[key] = null;
    }
  });

  const listPromises = LIST_COLLECTIONS.map(async (key) => {
    try {
      const snap = await getDocs(collection(db, key));
      (CACHE as Record<string, unknown[]>)[key] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err?.code !== 'permission-denied') {
        console.warn(`Erro ao carregar ${key}:`, e);
      }
      (CACHE as Record<string, unknown[]>)[key] = [];
    }
  });

  await Promise.allSettled([...singletonPromises, ...listPromises]);

  dataLoaded = true;
  console.log(`✅ Dados carregados em ${Date.now() - start}ms`);
  return CACHE;
}

// ─── SYNC READ API (from cache) ──────────────────────────────
export function dbGet<T>(key: string): T {
  if (SINGLETON_COLLECTIONS.includes(key)) {
    return (CACHE[key] ?? SEED[key] ?? null) as T;
  }
  const cached = (CACHE as Record<string, unknown[]>)[key];
  const seed = (SEED as Record<string, unknown[]>)[key];
  // Use cache if it has data, otherwise fall back to seed
  return (cached && cached.length > 0 ? cached : seed || []) as T;
}

export function dbGetAll<T>(key: string): T[] {
  const cached = (CACHE as Record<string, unknown[]>)[key];
  const seed = (SEED as Record<string, unknown[]>)[key];
  // Use cache if it has data, otherwise fall back to seed
  return (cached && cached.length > 0 ? cached : seed || []) as T[];
}

export function dbFind<T>(key: string, id: string): T | null {
  return (dbGetAll<T>(key).find((item) => (item as Record<string, unknown>).id === id) || null);
}

// ─── CACHE MUTATION API ──────────────────────────────────────
export function cacheAdd(col: string, item: Record<string, unknown>) {
  const list = (CACHE as Record<string, unknown[]>)[col];
  if (list) {
    list.push(item);
  } else {
    (CACHE as Record<string, unknown[]>)[col] = [item];
  }
  notifyListeners();
}

export function cacheUpdate(col: string, id: string, data: Record<string, unknown>) {
  const list = (CACHE as Record<string, unknown[]>)[col];
  if (list) {
    const idx = list.findIndex((item) => (item as Record<string, unknown>).id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx] as object, ...data };
    } else {
      list.push({ ...data, id });
    }
  } else {
    (CACHE as Record<string, unknown[]>)[col] = [{ ...data, id }];
  }
  notifyListeners();
}

export function cacheRemove(col: string, id: string) {
  const list = (CACHE as Record<string, unknown[]>)[col];
  if (list) {
    (CACHE as Record<string, unknown[]>)[col] = list.filter((item) => (item as Record<string, unknown>).id !== id);
  }
  notifyListeners();
}

export function cacheSingleton(col: string, data: Record<string, unknown>) {
  CACHE[col] = { ...(CACHE[col] as object || {}), ...data } as unknown as Escola | Config;
  notifyListeners();
}

// ─── CONFIG HELPERS ──────────────────────────────────────────
export function getConfig(): Config {
  return dbGet<Config>('config') || SEED.config;
}

export function isSistemaClosed(): boolean {
  return getConfig().sistemaFechado === true;
}

export function isDataLoaded(): boolean {
  return dataLoaded;
}

export function resetCache(): void {
  CACHE = {};
  dataLoaded = false;
}
