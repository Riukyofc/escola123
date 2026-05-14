'use client';
import { useState } from 'react';
import { dbGetAll } from '@/lib/data';
import { showToast, EmptyState, Modal, confirm } from '@/components/ui/DashboardUI';
import { saveDocument, removeDocument } from '@/lib/actions';

export default function ProfAEE() {
  const alunos = dbGetAll<Record<string, unknown>>('alunos').filter(a => a.ativo);
  const turmas = dbGetAll<Record<string, unknown>>('turmas');
  const aee = dbGetAll<Record<string, unknown>>('aee');
  const [modal, setModal] = useState(false);
  const [alunoId, setAlunoId] = useState(''); const [necessidade, setNecessidade] = useState('');
  const [plano, setPlano] = useState(''); const [obs, setObs] = useState('');

  const handleSave = async () => {
    if (!alunoId) return;
    await saveDocument('aee', null, { alunoId, necessidade, plano, observacoes: obs });
    showToast('Ficha AEE salva!', 'success'); setModal(false); setNecessidade(''); setPlano(''); setObs('');
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-brand" onClick={() => setModal(true)}><i className="fa-solid fa-plus" /> Nova Ficha AEE</button>
      </div>
      {aee.length === 0 ? <EmptyState icon="fa-heart-pulse" title="Nenhuma ficha AEE cadastrada" /> : (
        aee.map(f => {
          const al = alunos.find(a => a.id === f.alunoId);
          const tm = al ? turmas.find(t => t.id === al.turmaId) : null;
          return (
            <div key={f.id as string} className="aee-card">
              <div className="aee-header"><div><div className="aee-name">{al ? al.nome as string : '—'}</div>{tm && <div className="aee-turma">{tm.nome as string}</div>}</div></div>
              {f.necessidade ? <div className="aee-need">{String(f.necessidade)}</div> : null}
              {f.plano ? <div className="aee-desc">{String(f.plano)}</div> : null}
              {f.observacoes ? <div className="aee-obs">{String(f.observacoes)}</div> : null}
            </div>
          );
        })
      )}
      <Modal id="aee" open={modal} onClose={() => setModal(false)} title="Nova Ficha AEE" icon="fa-heart-pulse" iconColor="#9333ea" footer={
        <><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
        <button className="btn btn-brand" onClick={handleSave}><i className="fa-solid fa-floppy-disk" /> Salvar</button></>
      }>
        <div className="form-group"><label className="form-label">Aluno *</label>
          <select className="form-control form-select" value={alunoId} onChange={e => setAlunoId(e.target.value)}>
            <option value="">Selecione</option>{alunos.map(a => <option key={a.id as string} value={a.id as string}>{a.nome as string}</option>)}
          </select></div>
        <div className="form-group"><label className="form-label">Necessidade / Diagnóstico</label><textarea className="form-control" rows={2} value={necessidade} onChange={e => setNecessidade(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Plano de Atendimento</label><textarea className="form-control" rows={3} value={plano} onChange={e => setPlano(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Observações</label><textarea className="form-control" rows={2} value={obs} onChange={e => setObs(e.target.value)} /></div>
      </Modal>
    </>
  );
}
