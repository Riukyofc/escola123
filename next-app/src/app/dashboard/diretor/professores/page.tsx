'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { dbGetAll, dbGetAllEscola } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { showToast, Modal, EmptyState, confirm, PageTransition, StatCard } from '@/components/ui/DashboardUI';
import { saveDocument, removeDocument } from '@/lib/actions';

export default function DirProfessores() {
  useDataRefresh();
  const profs = dbGetAllEscola<Record<string, unknown>>('professores').filter(p => p.ativo);
  const disciplinas = dbGetAll<Record<string, unknown>>('disciplinas').filter(d => d.ativo);
  const turmas = dbGetAllEscola<Record<string, unknown>>('turmas').filter(t => t.ativo);

  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [selDiscs, setSelDiscs] = useState<string[]>([]);
  const [selTurmas, setSelTurmas] = useState<string[]>([]);

  const openNew = () => {
    setEditId(null); setNome(''); setEmail('');
    setSelDiscs([]); setSelTurmas([]);
    setModal(true);
  };

  const openEdit = (p: Record<string, unknown>) => {
    setEditId(p.id as string);
    setNome(p.nome as string);
    setEmail(p.email as string || '');
    setSelDiscs((p.disciplinas as string[]) || []);
    setSelTurmas((p.turmaIds as string[]) || []);
    setModal(true);
  };

  const toggleDisc = (id: string) => {
    setSelDiscs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleTurma = (id: string) => {
    setSelTurmas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!nome) return;
    await saveDocument('professores', editId, {
      nome, email,
      disciplinas: selDiscs,
      turmaIds: selTurmas,
      ativo: true,
    });
    showToast(editId ? 'Professor atualizado!' : 'Professor cadastrado!', 'success');
    setModal(false);
  };

  const handleDelete = async (id: string) => {
    if (await confirm('Excluir professor?')) {
      await removeDocument('professores', id);
      showToast('Excluído', 'success');
    }
  };

  const getDiscNomes = (ids: string[] | undefined) => {
    if (!ids || ids.length === 0) return '—';
    return ids.map(id => disciplinas.find(d => d.id === id)?.nome as string || '').filter(Boolean).join(', ');
  };

  const getTurmaCount = (ids: string[] | undefined) => ids?.length || 0;

  return (
    <PageTransition>
      <div className="stats-row" style={{ marginBottom: 20 }}>
        <StatCard label="Total Professores" value={profs.length} icon="fa-chalkboard-user" color="blue" />
        <StatCard label="Disciplinas" value={disciplinas.length} icon="fa-layer-group" color="purple" />
        <StatCard label="Turmas" value={turmas.length} icon="fa-chalkboard" color="green" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={openNew}>
          <i className="fa-solid fa-plus" /> Novo Professor
        </button>
      </div>

      <div className="panel-card">
        <div className="panel-card-header">
          <div className="panel-card-title"><i className="fa-solid fa-chalkboard-user" /> Professores</div>
          <span className="badge badge-blue">{profs.length}</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Disciplinas</th>
                <th className="text-center">Turmas</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {profs.length === 0 ? (
                <tr><td colSpan={5}><EmptyState icon="fa-chalkboard-user" title="Nenhum professor" /></td></tr>
              ) : profs.map((p, i) => (
                <motion.tr key={p.id as string} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'linear-gradient(135deg,#2563eb,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.8rem', fontWeight: 800, flexShrink: 0 }}>
                        {(p.nome as string).charAt(0)}
                      </div>
                      <span style={{ fontWeight: 700 }}>{p.nome as string}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.email as string || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {((p.disciplinas as string[]) || []).map(id => {
                        const disc = disciplinas.find(d => d.id === id);
                        return disc ? (
                          <span key={id} className="badge" style={{ background: `${disc.cor as string}18`, color: disc.cor as string, border: `1px solid ${disc.cor as string}30` }}>
                            {disc.nome as string}
                          </span>
                        ) : null;
                      })}
                      {!((p.disciplinas as string[])?.length) && <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </div>
                  </td>
                  <td className="text-center">
                    <span className="badge badge-green">{getTurmaCount(p.turmaIds as string[])}</span>
                  </td>
                  <td className="text-right">
                    <button className="btn btn-xs btn-ghost" onClick={() => openEdit(p)}><i className="fa-solid fa-pen" /></button>
                    <button className="btn btn-xs btn-danger" onClick={() => handleDelete(p.id as string)} style={{ marginLeft: 4 }}><i className="fa-solid fa-trash" /></button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal id="prof" open={modal} onClose={() => setModal(false)}
        title={editId ? 'Editar Professor' : 'Novo Professor'} icon="fa-chalkboard-user" size="lg"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}><i className="fa-solid fa-floppy-disk" /> Salvar</button>
        </>}
      >
        <div className="form-row">
          <div className="form-group"><label className="form-label">Nome Completo *</label>
            <input className="form-control" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do professor" /></div>
          <div className="form-group"><label className="form-label">Email</label>
            <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@escola.edu" /></div>
        </div>

        <div className="form-group">
          <label className="form-label"><i className="fa-solid fa-book-open" style={{ marginRight: 6 }} />Disciplinas</label>
          <div className="checkbox-grid">
            {disciplinas.map(d => (
              <label key={d.id as string} className={`checkbox-card ${selDiscs.includes(d.id as string) ? 'active' : ''}`}
                style={{ '--card-color': d.cor as string } as React.CSSProperties}>
                <input type="checkbox" checked={selDiscs.includes(d.id as string)} onChange={() => toggleDisc(d.id as string)} />
                <i className={`fa-solid ${d.icone as string}`} style={{ color: d.cor as string }} />
                <span>{d.nome as string}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label"><i className="fa-solid fa-chalkboard" style={{ marginRight: 6 }} />Turmas</label>
          <div className="checkbox-grid">
            {turmas.map(t => (
              <label key={t.id as string} className={`checkbox-card ${selTurmas.includes(t.id as string) ? 'active' : ''}`}>
                <input type="checkbox" checked={selTurmas.includes(t.id as string)} onChange={() => toggleTurma(t.id as string)} />
                <i className="fa-solid fa-users" />
                <span>{t.nome as string}</span>
              </label>
            ))}
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}
