'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { dbGetAllEscola, dbFind } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { showToast, EmptyState, Modal, StatCard, PageTransition } from '@/components/ui/DashboardUI';
import { saveDocument, removeDocument, logAuditoriaAction } from '@/lib/actions';
import { confirm } from '@/components/ui/DashboardUI';
import { generateBoletim } from '@/lib/reports';

export default function DirAlunos() {
  useDataRefresh();
  const turmas = dbGetAllEscola<Record<string, unknown>>('turmas').filter(t => t.ativo);
  const alunos = dbGetAllEscola<Record<string, unknown>>('alunos').filter(a => a.ativo);
  const [busca, setBusca] = useState(''); const [filtroTurma, setFiltroTurma] = useState('');
  const [modal, setModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState(''); const [matricula, setMatricula] = useState('');
  const [cpf, setCpf] = useState(''); const [turmaId, setTurmaId] = useState('');

  const filtered = alunos.filter(a => {
    if (filtroTurma && a.turmaId !== filtroTurma) return false;
    if (busca && !String(a.nome).toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  }).sort((a, b) => String(a.nome).localeCompare(String(b.nome)));

  const openNew = () => { setEditId(null); setNome(''); setMatricula(''); setCpf(''); setTurmaId(''); setModal(true); };
  const openEdit = (a: Record<string, unknown>) => { setEditId(a.id as string); setNome(a.nome as string); setMatricula(a.matricula as string || ''); setCpf(a.cpf as string || ''); setTurmaId(a.turmaId as string || ''); setModal(true); };

  const handleSave = async () => {
    if (!nome || !turmaId) return;
    const docId = await saveDocument('alunos', editId, { nome, matricula, cpf, turmaId, ativo: true });
    await logAuditoriaAction(
      docId,
      editId ? 'editar_aluno' : 'cadastrar_aluno',
      `Aluno ${nome} foi ${editId ? 'atualizado' : 'cadastrado'} no sistema.`
    );
    showToast(editId ? 'Aluno atualizado!' : 'Aluno cadastrado!', 'success'); setModal(false);
  };

  const handleDelete = async (id: string) => {
    if (await confirm('Deseja excluir este aluno?')) {
      const student = alunos.find(a => a.id === id);
      await removeDocument('alunos', id);
      await logAuditoriaAction(
        id,
        'excluir_aluno',
        `Aluno ${student?.nome || id} foi removido do sistema.`
      );
      showToast('Aluno excluído', 'success');
    }
  };

  return (
    <PageTransition>
      <div className="stats-row" style={{ marginBottom: 20 }}>
        <StatCard label="Total de Alunos" value={alunos.length} icon="fa-user-graduate" color="blue" />
        {turmas.slice(0, 3).map(t => <StatCard key={t.id as string} label={t.nome as string} value={alunos.filter(a => a.turmaId === t.id).length} icon="fa-users" color="green" />)}
      </div>
      <div className="panel-card" style={{ marginBottom: 16 }}>
        <div className="panel-card-body" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="text" className="form-control" placeholder="🔍 Buscar aluno..." style={{ flex: 1, minWidth: 200 }} value={busca} onChange={e => setBusca(e.target.value)} />
            <select className="form-control form-select" style={{ width: 'auto', minWidth: 160 }} value={filtroTurma} onChange={e => setFiltroTurma(e.target.value)}>
              <option value="">Todas as turmas</option>{turmas.map(t => <option key={t.id as string} value={t.id as string}>{t.nome as string}</option>)}
            </select>
            <button className="btn btn-primary" onClick={openNew}><i className="fa-solid fa-plus" /> Novo Aluno</button>
          </div>
        </div>
      </div>
      <div className="panel-card">
        <div className="panel-card-header"><div className="panel-card-title"><i className="fa-solid fa-user-graduate" /> Alunos Matriculados</div><span className="badge badge-blue">{filtered.length}</span></div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Nome</th><th>Matrícula</th><th>CPF</th><th>Turma</th><th className="text-right">Ações</th></tr></thead>
            <tbody>
              {filtered.map((a, i) => {
                const t = dbFind<Record<string, unknown>>('turmas', a.turmaId as string);
                return (
                  <motion.tr key={a.id as string} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                    <td style={{ fontWeight: 600 }}>{a.nome as string}</td>
                    <td>{a.matricula as string || '—'}</td><td>{a.cpf as string || '—'}</td>
                    <td>{t ? <span className="badge badge-blue">{t.nome as string}</span> : '—'}</td>
                    <td className="text-right">
                      <button className="btn btn-xs btn-ghost" onClick={() => generateBoletim(a.id as string)} data-tooltip="Boletim PDF"><i className="fa-solid fa-file-pdf" /></button>
                      <button className="btn btn-xs btn-ghost" onClick={() => openEdit(a)}><i className="fa-solid fa-pen" /></button>
                      <button className="btn btn-xs btn-danger" onClick={() => handleDelete(a.id as string)} style={{ marginLeft: 4 }}><i className="fa-solid fa-trash" /></button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Modal id="aluno" open={modal} onClose={() => setModal(false)} title={editId ? 'Editar Aluno' : 'Novo Aluno'} icon="fa-user-graduate" footer={
        <><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}><i className="fa-solid fa-floppy-disk" /> Salvar</button></>
      }>
        <div className="form-group"><label className="form-label">Nome Completo *</label><input className="form-control" value={nome} onChange={e => setNome(e.target.value)} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Matrícula</label><input className="form-control" value={matricula} onChange={e => setMatricula(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">CPF</label><input className="form-control" value={cpf} onChange={e => setCpf(e.target.value)} maxLength={14} /></div>
        </div>
        <div className="form-group"><label className="form-label">Turma *</label>
          <select className="form-control form-select" value={turmaId} onChange={e => setTurmaId(e.target.value)}>
            <option value="">Selecione</option>{turmas.map(t => <option key={t.id as string} value={t.id as string}>{t.nome as string}</option>)}
          </select></div>
      </Modal>
    </PageTransition>
  );
}
