// =============================================================
// DATA.TS — Firestore Data Layer (React Hooks + Cache)
// =============================================================
'use client';

import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import type { DataCache, Escola, Config, EscolaRede } from './types';
import { SEED } from './seed';

// ─── IN-MEMORY CACHE ──────────────────────────────────────────
let CACHE: Partial<DataCache> = {};
let dataLoaded = false;

// ─── MULTI-TENANT: ESCOLA ATIVA ──────────────────────────────
let ESCOLA_ATIVA: string | null = null;

export function getEscolaAtiva(): string | null {
  if (typeof window !== 'undefined' && !ESCOLA_ATIVA) {
    ESCOLA_ATIVA = localStorage.getItem('escolaAtiva') || 'semed';
  }
  return ESCOLA_ATIVA || 'semed';
}

export function setEscolaAtiva(id: string) {
  ESCOLA_ATIVA = id;
  if (typeof window !== 'undefined') {
    localStorage.setItem('escolaAtiva', id);
  }
  notifyListeners();
}

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
  'modalidades_ensino', 'niveis_ensino', 'registro_carga_horaria', 'dicionario_inep',
  'users', 'audit_logs',
];
const SINGLETON_COLLECTIONS: string[] = []; // Escola e Config agora são migrados para escolas_rede

// ─── LOAD ALL DATA ────────────────────────────────────────────
export async function loadAllData(): Promise<Partial<DataCache>> {
  if (dataLoaded) return CACHE;

  const db = getFirebaseDb();
  console.log('📦 Carregando dados do Firestore...');
  const start = Date.now();

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

  await Promise.allSettled(listPromises);

  dataLoaded = true;
  console.log(`✅ Dados carregados em ${Date.now() - start}ms`);
  return CACHE;
}

// ─── SYNC READ API (from cache) ──────────────────────────────
export function getEscolaInfo(): Escola {
  const escolaAtiva = getEscolaAtiva();
  if (!escolaAtiva || escolaAtiva === 'semed') {
    return {
      nome: 'SEMED - Secretaria Municipal de Educação',
      nomeAbreviado: 'SEMED',
      cidade: 'Viana - MA',
      anoLetivo: 2026,
      logomarca: '',
      whatsapp: '(98) 3351-1234',
      email: 'semed@viana.ma.gov.br',
    };
  }
  const escola = dbFind<EscolaRede>('escolas_rede', escolaAtiva);
  if (!escola) return SEED.escola as Escola;
  return {
    nome: escola.nome,
    nomeAbreviado: escola.nomeAbreviado || '',
    cidade: escola.cidade,
    anoLetivo: escola.anoLetivo,
    logomarca: escola.logomarca || '',
    whatsapp: escola.whatsapp || '',
    email: escola.email || '',
  };
}

export function getConfig(): Config {
  const escolaAtiva = getEscolaAtiva();
  if (!escolaAtiva || escolaAtiva === 'semed') {
    return {
      sistemaFechado: false,
      dataFechamento: null,
      notaMinima: 5.0,
      bimestreAtual: 1
    };
  }
  const escola = dbFind<EscolaRede>('escolas_rede', escolaAtiva);
  if (!escola) return SEED.config as Config;
  return {
    sistemaFechado: escola.sistemaFechado || false,
    dataFechamento: escola.dataFechamento || null,
    notaMinima: escola.notaMinima || 5.0,
    bimestreAtual: escola.bimestreAtual || 1
  };
}

export function dbGet<T>(key: string): T {
  if (key === 'escola') return getEscolaInfo() as unknown as T;
  if (key === 'config') return getConfig() as unknown as T;
  
  const cached = (CACHE as Record<string, unknown[]>)[key];
  const seed = (SEED as Record<string, unknown[]>)[key];
  return (cached && cached.length > 0 ? cached : seed || []) as T;
}

export function dbGetAll<T>(key: string): T[] {
  if (key === 'escola') return [getEscolaInfo()] as unknown as T[];
  if (key === 'config') return [getConfig()] as unknown as T[];

  const cached = (CACHE as Record<string, unknown[]>)[key];
  const seed = (SEED as Record<string, unknown[]>)[key];
  return (cached && cached.length > 0 ? cached : seed || []) as T[];
}

export function dbGetAllEscola<T>(key: string): T[] {
  const items = dbGetAll<T>(key);
  const escolaAtiva = getEscolaAtiva();
  if (!escolaAtiva || escolaAtiva === 'semed') return items;

  // Build a Set of matching school IDs/slugs to resolve database/seed ID inconsistencies
  const schools = dbGetAll<Record<string, any>>('escolas_rede');
  const activeSchool = schools.find(s => s.id === escolaAtiva || s.slug === escolaAtiva);

  const activeIds = new Set<string>();
  if (escolaAtiva) activeIds.add(escolaAtiva);
  if (activeSchool) {
    if (activeSchool.id) activeIds.add(activeSchool.id);
    if (activeSchool.slug) activeIds.add(activeSchool.slug);
    if (activeSchool.nomeAbreviado) activeIds.add(activeSchool.nomeAbreviado);
  }

  // Cross-reference fallback for known default schools in the seed data
  if (activeIds.has('esc01') || activeIds.has('ueedithnair')) {
    activeIds.add('esc01');
    activeIds.add('ueedithnair');
  }
  if (activeIds.has('esc02') || activeIds.has('uemanoel')) {
    activeIds.add('esc02');
    activeIds.add('uemanoel');
  }
  if (activeIds.has('esc03') || activeIds.has('uesaojoao')) {
    activeIds.add('esc03');
    activeIds.add('uesaojoao');
  }

  return items.filter((item) => {
    const record = item as Record<string, any>;

    // 1. Direct school binding check (positive match)
    if (record.escolaId && activeIds.has(record.escolaId)) {
      return true;
    }

    // 2. Alunos -> Turma -> Escola relation
    if (key === 'alunos') {
      const classId = record.turmaId;
      if (classId) {
        const classObj = dbFind<Record<string, any>>('turmas', classId);
        if (classObj && (activeIds.has(classObj.escolaId) || activeIds.has(classObj.id))) {
          return true;
        }
      }
    }

    // 3. Professores -> Turma -> Escola relation
    if (key === 'professores') {
      const classIds = record.turmaIds || [];
      if (classIds.length > 0) {
        const hasMatchingClass = classIds.some((cid: string) => {
          const classObj = dbFind<Record<string, any>>('turmas', cid);
          return classObj && (activeIds.has(classObj.escolaId) || activeIds.has(classObj.id));
        });
        if (hasMatchingClass) return true;
      }
      if (record.escolas && Array.isArray(record.escolas)) {
        const hasMatchingEscola = record.escolas.some((eid: string) => activeIds.has(eid));
        if (hasMatchingEscola) return true;
      }
    }

    // 4. Diários, Frequência, Carga Horária, Horários, Atividades, AEE, Notas -> Turma/Aluno relation
    if (['diario', 'frequencia', 'registro_carga_horaria', 'horarios_aula', 'atividades'].includes(key)) {
      const classId = record.turmaId;
      if (classId) {
        const classObj = dbFind<Record<string, any>>('turmas', classId);
        if (classObj && (activeIds.has(classObj.escolaId) || activeIds.has(classObj.id))) {
          return true;
        }
      }
    }

    // AEE can be mapped through student (alunoId)
    if (key === 'aee') {
      const studentId = record.alunoId;
      if (studentId) {
        const studentObj = dbFind<Record<string, any>>('alunos', studentId);
        if (studentObj) {
          if (studentObj.escolaId && activeIds.has(studentObj.escolaId)) {
            return true;
          }
          const classId = studentObj.turmaId;
          if (classId) {
            const classObj = dbFind<Record<string, any>>('turmas', classId);
            if (classObj && (activeIds.has(classObj.escolaId) || activeIds.has(classObj.id))) {
              return true;
            }
          }
        }
      }
    }

    // Notas can be mapped through student (alunoId)
    if (key === 'notas') {
      const studentId = record.alunoId;
      if (studentId) {
        const studentObj = dbFind<Record<string, any>>('alunos', studentId);
        if (studentObj) {
          if (studentObj.escolaId && activeIds.has(studentObj.escolaId)) {
            return true;
          }
          const classId = studentObj.turmaId;
          if (classId) {
            const classObj = dbFind<Record<string, any>>('turmas', classId);
            if (classObj && (activeIds.has(classObj.escolaId) || activeIds.has(classObj.id))) {
              return true;
            }
          }
        }
      }
    }

    // 5. Avisos and Calendário -> Escola
    if (key === 'avisos' || key === 'eventos_calendario') {
      return !record.escolaId || record.escolaId === 'global' || activeIds.has(record.escolaId);
    }

    // Fallback: If it has direct school binding but didn't match positive check above, filter it out.
    // If it has no school binding at all, keep it as a fallback.
    if (record.escolaId) {
      return activeIds.has(record.escolaId);
    }

    return true; // Fallback
  });
}

export function dbFind<T>(key: string, id: string): T | null {
  const items = dbGetAll<T>(key);
  if (key === 'escolas_rede') {
    return (items.find((item) => {
      const record = item as Record<string, unknown>;
      return record.id === id || record.slug === id;
    }) || null);
  }
  return (items.find((item) => (item as Record<string, unknown>).id === id) || null);
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
