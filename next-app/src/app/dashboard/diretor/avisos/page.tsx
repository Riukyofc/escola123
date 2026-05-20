'use client';
import { useState } from 'react';
import { dbGetAllEscola } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { formatDate } from '@/lib/utils';
import { showToast, EmptyState, Modal, PageTransition } from '@/components/ui/DashboardUI';
import { saveAviso } from '@/lib/actions';
import { useAuth } from '@/contexts/AuthContext';
export default function DirAvisos() {
  useDataRefresh();
  const { session } = useAuth();
  const turmas = dbGetAllEscola<Record<string, unknown>>('turmas').filter(t => t.ativo);
  const avisos = dbGetAllEscola<Record<string, unknown>>('avisos').filter(a => a.ativo).sort((a, b) => String(b.dataCriacao || '').localeCompare(String(a.dataCriacao || '')));
  const [modal, setModal] = useState(false); const [titulo, setTitulo] = useState(''); const [corpo, setCorpo] = useState('');
  const [tipo, setTipo] = useState('info'); const [turmaId, setTurmaId] = useState('');
  const tipoIcon: Record<string, string> = { info: 'fa-circle-info', urgente: 'fa-triangle-exclamation', sucesso: 'fa-circle-check', geral: 'fa-bullhorn' };

  const handleSave = async () => {
    if (!titulo || !corpo || !session) return;
    await saveAviso({ titulo, corpo, tipo, turmaId: turmaId || null, autoria: session.name });
    showToast('Aviso publicado!', 'success'); setModal(false); setTitulo(''); setCorpo('');
  };

  return (
    <PageTransition>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setModal(true)}><i className="fa-solid fa-plus" /> Novo Aviso</button>
      </div>
      <div className="panel-card"><div className="panel-card-header"><div className="panel-card-title"><i className="fa-solid fa-bell" /> Todos os Avisos</div></div>
        <div className="panel-card-body">{avisos.length === 0 ? <EmptyState icon="fa-bell-slash" title="Nenhum aviso" /> :
          avisos.map(av => (<div key={av.id as string} className="dash-aviso-item"><div className={`dash-aviso-icon ${av.tipo as string}`}><i className={`fa-solid ${tipoIcon[av.tipo as string] || 'fa-bullhorn'}`} /></div>
            <div><div className="dash-aviso-title">{av.titulo as string}</div><div className="dash-aviso-body">{av.corpo as string}</div>
            <div className="dash-aviso-date"><i className="fa-regular fa-calendar" /> {formatDate(av.dataCriacao as string)}</div></div></div>))
        }</div></div>
      <Modal id="aviso" open={modal} onClose={() => setModal(false)} title="Publicar Aviso" icon="fa-bell" iconColor="var(--warning)" footer={
        <><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}><i className="fa-solid fa-paper-plane" /> Publicar</button></>
      }>
        <div className="form-group"><label className="form-label">Título *</label><input className="form-control" value={titulo} onChange={e => setTitulo(e.target.value)} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Tipo</label><select className="form-control form-select" value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="info">ℹ️ Informativo</option><option value="urgente">⚠️ Urgente</option><option value="sucesso">✅ Destaque</option><option value="geral">📢 Geral</option></select></div>
          <div className="form-group"><label className="form-label">Destinatário</label><select className="form-control form-select" value={turmaId} onChange={e => setTurmaId(e.target.value)}>
            <option value="">Toda a escola</option>{turmas.map(t => <option key={t.id as string} value={t.id as string}>{t.nome as string}</option>)}</select></div>
        </div>
        <div className="form-group"><label className="form-label">Mensagem *</label><textarea className="form-control" rows={4} value={corpo} onChange={e => setCorpo(e.target.value)} /></div>
      </Modal>
    </PageTransition>
  );
}
