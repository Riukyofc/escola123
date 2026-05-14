'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { dbGetAll } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { showToast, Modal, EmptyState, StatCard, PageTransition, confirm } from '@/components/ui/DashboardUI';
import { saveDocument, removeDocument } from '@/lib/actions';

export default function SemedEscolas() {
  useDataRefresh();
  const escolas = dbGetAll<Record<string, unknown>>('escolas_rede');
  const alunos = dbGetAll<Record<string, unknown>>('alunos').filter(a => a.ativo);
  const profs = dbGetAll<Record<string, unknown>>('professores').filter(p => p.ativo);

  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [diretor, setDiretor] = useState('');
  const [telefone, setTelefone] = useState('');
  const [qtdAlunos, setQtdAlunos] = useState('');
  const [qtdProf, setQtdProf] = useState('');
  const [status, setStatus] = useState('ativa');

  const openNew = () => {
    setEditId(null); setNome(''); setLocalizacao(''); setDiretor('');
    setTelefone(''); setQtdAlunos(''); setQtdProf(''); setStatus('ativa');
    setModal(true);
  };

  const openEdit = (e: Record<string, unknown>) => {
    setEditId(e.id as string);
    setNome(e.nome as string || '');
    setLocalizacao(e.localizacao as string || '');
    setDiretor(e.diretor as string || '');
    setTelefone(e.telefone as string || '');
    setQtdAlunos(String(e.qtdAlunos || ''));
    setQtdProf(String(e.qtdProfessores || ''));
    setStatus(e.status as string || 'ativa');
    setModal(true);
  };

  const handleSave = async () => {
    if (!nome) return;
    await saveDocument('escolas_rede', editId, {
      nome, localizacao, diretor, telefone,
      qtdAlunos: parseInt(qtdAlunos) || 0,
      qtdProfessores: parseInt(qtdProf) || 0,
      status,
    });
    showToast(editId ? 'Escola atualizada!' : 'Escola cadastrada!', 'success');
    setModal(false);
  };

  const handleDelete = async (id: string) => {
    if (await confirm('Deseja excluir esta escola da rede?')) {
      await removeDocument('escolas_rede', id);
      showToast('Escola removida', 'success');
    }
  };

  const ativas = escolas.filter(e => e.status !== 'inativa');

  return (
    <PageTransition>
      <div className="stats-row stagger-container" style={{ marginBottom: 20 }}>
        <StatCard label="Escolas na Rede" value={ativas.length || 1} icon="fa-school" color="blue" />
        <StatCard label="Alunos na Rede" value={alunos.length} icon="fa-user-graduate" color="green" />
        <StatCard label="Professores" value={profs.length} icon="fa-chalkboard-user" color="purple" />
        <StatCard label="Total Cadastradas" value={escolas.length} icon="fa-building" color="amber" />
      </div>

      <div className="panel-card" style={{ marginBottom: 16 }}>
        <div className="panel-card-body" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={openNew}>
              <i className="fa-solid fa-plus" /> Nova Escola
            </button>
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-card-header">
          <div className="panel-card-title"><i className="fa-solid fa-building" /> Escolas da Rede Municipal</div>
          <span className="badge badge-blue">{escolas.length}</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Escola</th>
                <th>Localização</th>
                <th>Diretor(a)</th>
                <th className="text-center">Alunos</th>
                <th className="text-center">Professores</th>
                <th className="text-center">Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {escolas.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon="fa-building" title="Nenhuma escola cadastrada" desc="Clique em 'Nova Escola' para começar" /></td></tr>
              ) : (
                escolas.map((e, i) => (
                  <motion.tr
                    key={e.id as string}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                  >
                    <td style={{ fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'linear-gradient(135deg,#991b1b,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.85rem', flexShrink: 0 }}>
                          <i className="fa-solid fa-school" />
                        </div>
                        {e.nome as string}
                      </div>
                    </td>
                    <td>{e.localizacao as string || '—'}</td>
                    <td>{e.diretor as string || '—'}</td>
                    <td className="text-center"><span className="badge badge-blue">{e.qtdAlunos as number || 0}</span></td>
                    <td className="text-center"><span className="badge badge-purple">{e.qtdProfessores as number || 0}</span></td>
                    <td className="text-center">
                      {e.status === 'inativa'
                        ? <span className="badge badge-red">Inativa</span>
                        : <span className="badge badge-green">Ativa</span>}
                    </td>
                    <td className="text-right">
                      <button className="btn btn-xs btn-ghost" onClick={() => openEdit(e)}><i className="fa-solid fa-pen" /></button>
                      <button className="btn btn-xs btn-danger" onClick={() => handleDelete(e.id as string)} style={{ marginLeft: 4 }}><i className="fa-solid fa-trash" /></button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal id="escola" open={modal} onClose={() => setModal(false)} title={editId ? 'Editar Escola' : 'Nova Escola'} icon="fa-school" iconColor="#dc2626" footer={
        <>
          <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}><i className="fa-solid fa-floppy-disk" /> Salvar</button>
        </>
      }>
        <div className="form-group"><label className="form-label">Nome da Escola *</label><input className="form-control" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: U.E. Professora Edith Nair..." /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Localização</label><input className="form-control" value={localizacao} onChange={e => setLocalizacao(e.target.value)} placeholder="Bairro / Cidade" /></div>
          <div className="form-group"><label className="form-label">Diretor(a)</label><input className="form-control" value={diretor} onChange={e => setDiretor(e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Telefone</label><input className="form-control" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(98) 9..." /></div>
          <div className="form-group"><label className="form-label">Status</label>
            <select className="form-control form-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="ativa">🟢 Ativa</option><option value="inativa">🔴 Inativa</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Qtd Alunos</label><input type="number" className="form-control" value={qtdAlunos} onChange={e => setQtdAlunos(e.target.value)} min="0" /></div>
          <div className="form-group"><label className="form-label">Qtd Professores</label><input type="number" className="form-control" value={qtdProf} onChange={e => setQtdProf(e.target.value)} min="0" /></div>
        </div>
      </Modal>
    </PageTransition>
  );
}
