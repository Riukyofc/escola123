'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dbGetAllEscola } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { showToast, EmptyState, Modal, PageTransition } from '@/components/ui/DashboardUI';
import { saveDocument } from '@/lib/actions';

export default function ProfAEE() {
  useDataRefresh();
  const { session } = useAuth();
  const [modal, setModal] = useState(false);
  const [alunoId, setAlunoId] = useState(''); 
  const [necessidade, setNecessidade] = useState('');
  const [plano, setPlano] = useState(''); 
  const [obs, setObs] = useState('');

  if (!session) return null;

  const professorId = session.userData?.professorId;

  // Render a premium glassmorphic warning if profile is not linked
  if (!professorId) {
    return (
      <PageTransition>
        <div style={{
          background: 'linear-gradient(135deg, #1e3d7a 0%, #0f2347 100%)',
          borderRadius: 24,
          padding: '40px 30px',
          textAlign: 'center',
          color: '#fff',
          maxWidth: 600,
          margin: '40px auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{
            width: 70,
            height: 70,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            fontSize: '2rem'
          }}>
            <i className="fa-solid fa-link-slash" style={{ color: '#fbbf24' }} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 12 }}>Acesso não Vinculado</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '.95rem', lineHeight: '1.6', marginBottom: 24 }}>
            Vincule seu login a um cadastro de Professor na Direção para gerenciar as Fichas AEE.
          </p>
        </div>
      </PageTransition>
    );
  }

  const professorDoc = session.user;
  const myTurmaIds = (professorDoc?.turmaIds as string[]) || [];

  // Filter classes & students belonging exclusively to the current teacher
  const turmas = dbGetAllEscola<Record<string, unknown>>('turmas').filter(t => 
    t.ativo && (t.professorId === professorId || (Array.isArray(t.professorIds) && t.professorIds.includes(professorId)) || myTurmaIds.includes(t.id as string))
  );

  const myTurmaIdsSet = new Set(turmas.map(t => t.id as string));

  const alunos = dbGetAllEscola<Record<string, unknown>>('alunos').filter(a => 
    a.ativo && myTurmaIdsSet.has(a.turmaId as string)
  );

  const aee = dbGetAllEscola<Record<string, unknown>>('aee').filter(f => {
    const al = alunos.find(a => a.id === f.alunoId);
    return !!al;
  });

  const handleSave = async () => {
    if (!alunoId) return;
    await saveDocument('aee', null, { 
      alunoId, 
      necessidade, 
      plano, 
      observacoes: obs,
      professorId: professorId 
    });
    showToast('Ficha AEE salva!', 'success'); setModal(false); setNecessidade(''); setPlano(''); setObs('');
  };

  return (
    <PageTransition>
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
      {modal && (
        <Modal id="aee" open={modal} onClose={() => setModal(false)} title="Nova Ficha AEE" icon="fa-heart-pulse" iconColor="#9333ea" footer={
          <><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn btn-brand" onClick={handleSave}><i className="fa-solid fa-floppy-disk" /> Salvar</button></>
        }>
          <div className="form-group"><label className="form-label">Aluno *</label>
            <select className="form-control form-select" style={{ background: 'var(--panel-bg)', borderColor: 'var(--border)' }} value={alunoId} onChange={e => setAlunoId(e.target.value)}>
              <option value="">Selecione</option>{alunos.map(a => <option key={a.id as string} value={a.id as string}>{a.nome as string}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Necessidade / Diagnóstico</label><textarea className="form-control" rows={2} style={{ background: 'var(--panel-bg)', borderColor: 'var(--border)' }} value={necessidade} onChange={e => setNecessidade(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Plano de Atendimento</label><textarea className="form-control" rows={3} style={{ background: 'var(--panel-bg)', borderColor: 'var(--border)' }} value={plano} onChange={e => setPlano(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Observações</label><textarea className="form-control" rows={2} style={{ background: 'var(--panel-bg)', borderColor: 'var(--border)' }} value={obs} onChange={e => setObs(e.target.value)} /></div>
        </Modal>
      )}
    </PageTransition>
  );
}
