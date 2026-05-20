'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dbGetAllEscola } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { formatDate } from '@/lib/utils';
import { showToast, EmptyState, Modal, confirm, PageTransition } from '@/components/ui/DashboardUI';
import { saveDocument, removeDocument } from '@/lib/actions';

export default function ProfAtividades() {
  useDataRefresh();
  const { session } = useAuth();
  const [modal, setModal] = useState(false);
  const [titulo, setTitulo] = useState(''); 
  const [turmaId, setTurmaId] = useState('');
  const [tipo, setTipo] = useState('prova'); 
  const [prazo, setPrazo] = useState('');
  const [pontos, setPontos] = useState('10'); 
  const [desc, setDesc] = useState('');

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
            Vincule seu login a um cadastro de Professor na Direção para gerenciar atividades.
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

  const atividades = dbGetAllEscola<Record<string, unknown>>('atividades')
    .filter(a => myTurmaIdsSet.has(a.turmaId as string))
    .sort((a, b) => String(b.prazo || '').localeCompare(String(a.prazo || '')));

  const iconMap: Record<string, string> = { prova: 'fa-file-lines', trabalho: 'fa-clipboard', exercicio: 'fa-pencil', projeto: 'fa-flask' };

  const handleSave = async () => {
    if (!titulo || !turmaId) return;
    await saveDocument('atividades', null, { 
      titulo, 
      turmaId, 
      tipo, 
      prazo, 
      pontos: parseFloat(pontos), 
      descricao: desc,
      professorId: professorId 
    });
    showToast('Atividade salva!', 'success');
    setModal(false); setTitulo(''); setDesc('');
  };

  const handleDelete = async (id: string) => {
    if (await confirm('Deseja excluir esta atividade?')) {
      await removeDocument('atividades', id);
      showToast('Atividade excluída', 'success');
    }
  };

  return (
    <PageTransition>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setModal(true)}><i className="fa-solid fa-plus" /> Nova Atividade</button>
      </div>
      <div className="panel-card">
        <div className="panel-card-header"><div className="panel-card-title"><i className="fa-solid fa-clipboard-list" /> Atividades</div></div>
        <div className="panel-card-body">
          {atividades.length === 0 ? <EmptyState icon="fa-clipboard-list" title="Nenhuma atividade" /> : (
            atividades.map(a => (
              <div key={a.id as string} className="ativ-card">
                <div className={`ativ-icon ${a.tipo as string}`}><i className={`fa-solid ${iconMap[a.tipo as string] || 'fa-file'}`} /></div>
                <div style={{ flex: 1 }}>
                  <div className="ativ-title">{a.titulo as string}</div>
                  <div className="ativ-meta">
                    <span><i className="fa-regular fa-calendar" /> {formatDate(a.prazo as string)}</span>
                    <span><i className="fa-solid fa-star" /> {a.pontos as number} pts</span>
                  </div>
                </div>
                <button className="btn btn-xs btn-danger" onClick={() => handleDelete(a.id as string)}><i className="fa-solid fa-trash" /></button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {modal && (
        <Modal id="ativ" open={modal} onClose={() => setModal(false)} title="Nova Atividade" icon="fa-clipboard-list" footer={
          <><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}><i className="fa-solid fa-floppy-disk" /> Salvar</button></>
        }>
          <div className="form-group"><label className="form-label">Título *</label><input className="form-control" style={{ background: 'var(--panel-bg)', borderColor: 'var(--border)' }} value={titulo} onChange={e => setTitulo(e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Turma *</label>
              <select className="form-control form-select" style={{ background: 'var(--panel-bg)', borderColor: 'var(--border)' }} value={turmaId} onChange={e => setTurmaId(e.target.value)}>
                <option value="">Selecione</option>{turmas.map(t => <option key={t.id as string} value={t.id as string}>{t.nome as string}</option>)}
              </select></div>
            <div className="form-group"><label className="form-label">Tipo</label>
              <select className="form-control form-select" style={{ background: 'var(--panel-bg)', borderColor: 'var(--border)' }} value={tipo} onChange={e => setTipo(e.target.value)}>
                <option value="prova">📝 Prova</option><option value="trabalho">📋 Trabalho</option><option value="exercicio">✏️ Exercício</option><option value="projeto">🔬 Projeto</option>
              </select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Prazo</label><input type="date" className="form-control" style={{ background: 'var(--panel-bg)', borderColor: 'var(--border)' }} value={prazo} onChange={e => setPrazo(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Pontuação</label><input type="number" className="form-control" style={{ background: 'var(--panel-bg)', borderColor: 'var(--border)' }} value={pontos} onChange={e => setPontos(e.target.value)} min="0" max="100" /></div>
          </div>
          <div className="form-group"><label className="form-label">Descrição</label><textarea className="form-control" rows={3} style={{ background: 'var(--panel-bg)', borderColor: 'var(--border)' }} value={desc} onChange={e => setDesc(e.target.value)} /></div>
        </Modal>
      )}
    </PageTransition>
  );
}
