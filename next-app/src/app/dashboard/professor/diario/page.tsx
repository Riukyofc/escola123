'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dbGetAll, dbGetAllEscola } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { formatDate, todayISO } from '@/lib/utils';
import { showToast, EmptyState, Modal, PageTransition, Badge } from '@/components/ui/DashboardUI';
import { saveDocument } from '@/lib/actions';

export default function ProfDiario() {
  useDataRefresh();
  const { session } = useAuth();
  const [selTurma, setSelTurma] = useState('');
  const [selDisc, setSelDisc] = useState('');
  const [modal, setModal] = useState(false);
  const [data, setData] = useState(todayISO());
  const [conteudo, setConteudo] = useState('');
  const [metodologia, setMetodologia] = useState('');

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
            Vincule seu login a um cadastro de Professor na Direção para gerenciar o Diário Digital.
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

  const diario = dbGetAllEscola<Record<string, unknown>>('diario')
    .filter(d => d.professorId === professorId)
    .sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')));

  const disciplinas = dbGetAll<Record<string, unknown>>('disciplinas').filter(d => d.ativo);

  const filtered = diario.filter(d => !selTurma || d.turmaId === selTurma);

  const handleSave = async () => {
    if (!conteudo || !selTurma) return;
    await saveDocument('diario', null, {
      turmaId: selTurma,
      disciplinaId: selDisc,
      professorId: professorId,
      data,
      conteudo,
      metodologia,
      status: 'pendente',
    });
    showToast('Diário registrado! Aguardando aprovação.', 'success');
    setModal(false);
    setConteudo('');
    setMetodologia('');
  };

  const statusConfig: Record<string, { icon: string; label: string; color: 'yellow' | 'green' | 'red' }> = {
    pendente: { icon: 'fa-clock', label: 'Pendente', color: 'yellow' },
    aprovado: { icon: 'fa-circle-check', label: 'Aprovado', color: 'green' },
    rejeitado: { icon: 'fa-circle-xmark', label: 'Rejeitado', color: 'red' },
  };

  return (
    <PageTransition>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <select className="form-control form-select" style={{ maxWidth: 220, background: 'var(--panel-bg)', borderColor: 'var(--border)' }} value={selTurma} onChange={e => setSelTurma(e.target.value)}>
          <option value="">Todas as turmas</option>
          {turmas.map(t => <option key={t.id as string} value={t.id as string}>{t.nome as string}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <i className="fa-solid fa-plus" /> Novo Registro
        </button>
      </div>

      <div className="panel-card">
        <div className="panel-card-header">
          <div className="panel-card-title"><i className="fa-solid fa-book-open" /> Diário de Classe</div>
          <span className="badge badge-blue">{filtered.length}</span>
        </div>
        <div className="panel-card-body">
          {filtered.length === 0 ? (
            <EmptyState icon="fa-book-open" title="Nenhum registro" desc="Clique em 'Novo Registro' para começar" />
          ) : (
            filtered.map(d => {
              const turma = turmas.find(t => t.id === d.turmaId);
              const disc = disciplinas.find(dd => dd.id === d.disciplinaId);
              const status = (d.status as string) || 'pendente';
              const cfg = statusConfig[status] || statusConfig.pendente;
              return (
                <div key={d.id as string} className="diario-entry">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div className="diario-date">
                      <i className="fa-regular fa-calendar" />
                      {formatDate(d.data as string)}
                      {turma && <span className="badge badge-blue" style={{ marginLeft: 8 }}>{turma.nome as string}</span>}
                      {disc && <span className="badge" style={{ marginLeft: 4, background: `${disc.cor as string}18`, color: disc.cor as string }}>{disc.nome as string}</span>}
                    </div>
                    <Badge color={cfg.color}><i className={`fa-solid ${cfg.icon}`} /> {cfg.label}</Badge>
                  </div>
                  <div className="diario-content">{d.conteudo as string}</div>
                  {d.metodologia ? <div style={{ marginTop: 6, fontSize: '.78rem', color: 'var(--text-muted)' }}><strong>Metodologia:</strong> {String(d.metodologia)}</div> : null}
                  {d.observacaoDiretor ? (
                    <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 'var(--r-md)', background: status === 'rejeitado' ? 'var(--danger-light)' : 'var(--success-light)', fontSize: '.78rem' }}>
                      <i className="fa-solid fa-comment" style={{ marginRight: 6 }} />
                      <strong>Direção:</strong> {String(d.observacaoDiretor)}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {modal && (
        <Modal
          id="new-diary-modal"
          title="Novo Registro de Diário"
          open={true}
          onClose={() => setModal(false)}
          footer={
            <div style={{ display: 'flex', gap: 10, justifyContent: 'end', width: '100%' }}>
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>Salvar Registro</button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Data da Aula</label>
              <input type="date" className="form-control" style={{ background: 'var(--panel-bg)', borderColor: 'var(--border)' }} value={data} onChange={e => setData(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Turma</label>
              <select className="form-control form-select" style={{ background: 'var(--panel-bg)', borderColor: 'var(--border)' }} value={selTurma} onChange={e => setSelTurma(e.target.value)}>
                <option value="">Selecione...</option>
                {turmas.map(t => <option key={t.id as string} value={t.id as string}>{t.nome as string}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Componente Curricular (Disciplina)</label>
              <select className="form-control form-select" style={{ background: 'var(--panel-bg)', borderColor: 'var(--border)' }} value={selDisc} onChange={e => setSelDisc(e.target.value)}>
                <option value="">Selecione...</option>
                {disciplinas.map(d => <option key={d.id as string} value={d.id as string}>{d.nome as string}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Conteúdo Lecionado</label>
              <textarea
                className="form-control"
                rows={3}
                style={{ background: 'var(--panel-bg)', borderColor: 'var(--border)' }}
                placeholder="Ex: Operações básicas de matemática, resolução de equações..."
                value={conteudo}
                onChange={e => setConteudo(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Metodologia Utilizada (Opcional)</label>
              <textarea
                className="form-control"
                rows={2}
                style={{ background: 'var(--panel-bg)', borderColor: 'var(--border)' }}
                placeholder="Ex: Aula expositiva dialógica, trabalho em grupos..."
                value={metodologia}
                onChange={e => setMetodologia(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}
    </PageTransition>
  );
}
