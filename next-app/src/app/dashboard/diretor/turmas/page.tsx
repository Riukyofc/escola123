'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { dbGetAll } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { showToast, Modal, EmptyState, confirm, PageTransition } from '@/components/ui/DashboardUI';
import { saveDocument, removeDocument } from '@/lib/actions';
import { turnoIcon } from '@/lib/utils';

export default function DirTurmas() {
  useDataRefresh();
  const turmas = dbGetAll<Record<string, unknown>>('turmas').filter(t => t.ativo);
  const alunos = dbGetAll<Record<string, unknown>>('alunos').filter(a => a.ativo);
  const profs = dbGetAll<Record<string, unknown>>('professores').filter(p => p.ativo);
  const [modal, setModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState(''); const [turno, setTurno] = useState('manhã'); const [profId, setProfId] = useState('');

  const openNew = () => { setEditId(null); setNome(''); setTurno('manhã'); setProfId(''); setModal(true); };
  const openEdit = (t: Record<string, unknown>) => { setEditId(t.id as string); setNome(t.nome as string); setTurno(t.turno as string || 'manhã'); setProfId(t.professorId as string || ''); setModal(true); };
  const handleSave = async () => { if (!nome) return; await saveDocument('turmas', editId, { nome, turno, professorId: profId || null, ativo: true }); showToast('Turma salva!', 'success'); setModal(false); };
  const handleDelete = async (id: string) => { if (await confirm('Excluir turma?')) { await removeDocument('turmas', id); showToast('Excluída', 'success'); } };

  return (
    <PageTransition>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={openNew}><i className="fa-solid fa-plus" /> Nova Turma</button>
      </div>
      <div className="panel-card">
        <div className="panel-card-header"><div className="panel-card-title"><i className="fa-solid fa-chalkboard" /> Turmas</div><span className="badge badge-blue">{turmas.length}</span></div>
        <div className="table-scroll"><table className="data-table"><thead><tr><th>Nome</th><th>Turno</th><th className="text-center">Alunos</th><th className="text-right">Ações</th></tr></thead>
          <tbody>{turmas.map(t => (<tr key={t.id as string}><td style={{ fontWeight: 600 }}>{t.nome as string}</td>
            <td>{turnoIcon(t.turno as string)} {t.turno as string}</td>
            <td className="text-center"><span className="badge badge-blue">{alunos.filter(a => a.turmaId === t.id).length}</span></td>
            <td className="text-right"><button className="btn btn-xs btn-ghost" onClick={() => openEdit(t)}><i className="fa-solid fa-pen" /></button>
            <button className="btn btn-xs btn-danger" onClick={() => handleDelete(t.id as string)} style={{ marginLeft: 4 }}><i className="fa-solid fa-trash" /></button></td></tr>))}
          </tbody></table></div>
      </div>
      <Modal id="turma" open={modal} onClose={() => setModal(false)} title={editId ? 'Editar Turma' : 'Nova Turma'} icon="fa-chalkboard" size="sm" footer={
        <><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}><i className="fa-solid fa-floppy-disk" /> Salvar</button></>
      }>
        <div className="form-group"><label className="form-label">Nome *</label><input className="form-control" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: 1º Ano A" /></div>
        <div className="form-group"><label className="form-label">Turno</label>
          <select className="form-control form-select" value={turno} onChange={e => setTurno(e.target.value)}>
            <option value="manhã">🌅 Manhã</option><option value="tarde">☀️ Tarde</option><option value="noite">🌙 Noite</option>
          </select></div>
        <div className="form-group"><label className="form-label">Professor Responsável</label>
          <select className="form-control form-select" value={profId} onChange={e => setProfId(e.target.value)}>
            <option value="">Sem professor</option>{profs.map(p => <option key={p.id as string} value={p.id as string}>{p.nome as string}</option>)}
          </select></div>
      </Modal>
    </PageTransition>
  );
}
