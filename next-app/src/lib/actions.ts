'use client';

import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { generateId } from './utils';
import { cacheAdd, cacheUpdate, cacheRemove, cacheSingleton, getEscolaAtiva } from './data';

const db = () => getFirebaseDb();

// ─── AUDIT LOGS UTILITY ─────────────────────────
export async function logAuditoriaAction(alunoId: string | null, acao: string, detalhe: string) {
  const logId = generateId('log');
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('usuarioLogado') || 'Anonymous' : 'Server';
  let userId = 'unknown';
  try {
    const userObj = JSON.parse(userStr);
    userId = userObj.email || userObj.id || 'Anonymous';
  } catch (e) {
    userId = userStr;
  }
  
  const logData = {
    id: logId,
    alunoId,
    acao,
    detalhe,
    usuarioId: userId,
    dataHora: new Date().toISOString(),
    escolaId: getEscolaAtiva() || 'system'
  };

  await setDoc(doc(db(), 'audit_logs', logId), logData);
  cacheAdd('audit_logs', logData);
}

// ─── GENERIC CRUD ────────────────────────────────
export async function saveDocument(col: string, id: string | null, data: Record<string, unknown>) {
  const docId = id || generateId(col.slice(0, 3));
  const activeSchoolId = getEscolaAtiva();
  
  const tenantScopedCollections = ['alunos', 'professores', 'turmas', 'avisos', 'eventos_calendario', 'horarios_aula', 'registro_carga_horaria'];
  
  const fullData = { ...data, id: docId };
  if (tenantScopedCollections.includes(col) && activeSchoolId && !(fullData as any).escolaId) {
    (fullData as any).escolaId = activeSchoolId;
  }

  await setDoc(doc(db(), col, docId), fullData, { merge: true });
  if (id) {
    cacheUpdate(col, docId, fullData);
  } else {
    cacheAdd(col, fullData);
  }
  return docId;
}

export async function updateDocument(col: string, id: string, data: Record<string, unknown>) {
  await updateDoc(doc(db(), col, id), data);
  cacheUpdate(col, id, data);
}

export async function removeDocument(col: string, id: string) {
  await deleteDoc(doc(db(), col, id));
  cacheRemove(col, id);
}

// ─── SINGLETONS ──────────────────────────────────
export async function saveSingleton(col: string, data: Record<string, unknown>) {
  await setDoc(doc(db(), col, 'info'), data, { merge: true });
  cacheSingleton(col, data);
}

// ─── SPECIFIC ACTIONS ────────────────────────────
export async function toggleSistema(closed: boolean) {
  await saveSingleton('config', {
    sistemaFechado: closed,
    dataFechamento: closed ? new Date().toISOString() : null,
  });
}

export async function saveNota(
  alunoId: string,
  disciplinaId: string,
  bimestre: number,
  valor: number,
  parciais?: { n1?: number | null; n2?: number | null; n3?: number | null; n4?: number | null }
) {
  const id = `${alunoId}_${disciplinaId}`;
  const key = `b${bimestre}`;
  const data: Record<string, any> = { id, alunoId, disciplinaId, [key]: valor };
  if (parciais) {
    data[`b${bimestre}_n1`] = parciais.n1 ?? null;
    data[`b${bimestre}_n2`] = parciais.n2 ?? null;
    data[`b${bimestre}_n3`] = parciais.n3 ?? null;
    data[`b${bimestre}_n4`] = parciais.n4 ?? null;
  }
  await setDoc(doc(db(), 'notas', id), data, { merge: true });
  cacheUpdate('notas', id, data);
}

export async function saveRecuperacao(alunoId: string, disciplinaId: string, valor: number) {
  const id = `${alunoId}_${disciplinaId}`;
  const data = { id, alunoId, disciplinaId, recuperacao: valor };
  await setDoc(doc(db(), 'notas', id), data, { merge: true });
  cacheUpdate('notas', id, data);
}

export async function saveFrequenciaDoc(turmaId: string, professorId: string, data: string, aulas: { alunoId: string; status: string }[]) {
  const id = `${turmaId}_${data}`;
  const fullData = { id, turmaId, professorId, data, aulas };
  await setDoc(doc(db(), 'frequencia', id), fullData, { merge: true });
  cacheUpdate('frequencia', id, fullData);
}

export async function saveAviso(data: { titulo: string; corpo: string; tipo: string; turmaId: string | null; autoria: string }) {
  const id = generateId('av');
  const fullData = { ...data, id, dataCriacao: new Date().toISOString(), ativo: true };
  await setDoc(doc(db(), 'avisos', id), fullData);
  cacheAdd('avisos', fullData);
  return id;
}
