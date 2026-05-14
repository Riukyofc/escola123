'use client';

import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { generateId } from './utils';
import { cacheAdd, cacheUpdate, cacheRemove, cacheSingleton } from './data';

const db = () => getFirebaseDb();

// ─── GENERIC CRUD ────────────────────────────────
export async function saveDocument(col: string, id: string | null, data: Record<string, unknown>) {
  const docId = id || generateId(col.slice(0, 3));
  const fullData = { ...data, id: docId };
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

export async function saveNota(alunoId: string, disciplinaId: string, bimestre: number, valor: number) {
  const id = `${alunoId}_${disciplinaId}`;
  const key = `b${bimestre}`;
  const data = { id, alunoId, disciplinaId, [key]: valor };
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
