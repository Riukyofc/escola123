'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dbGetAll } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { formatDate, todayISO } from '@/lib/utils';
import { showToast, EmptyState, Modal, PageTransition, Badge } from '@/components/ui/DashboardUI';
import { saveDocument } from '@/lib/actions';

export default function ProfDiario() {
  useDataRefresh();
  const { session } = useAuth();
  const turmas = dbGetAll<Record<string, unknown>>('turmas').filter(t => t.ativo);
  const diario = dbGetAll<Record<string, unknown>>('diario').sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')));
  const disciplinas = dbGetAll<Record<string, unknown>>('disciplinas').filter(d => d.ativo);

  const [selTurma, setSelTurma] = useState('');
  const [selDisc, setSelDisc] = useState('');
  const [modal, setModal] = useState(false);
  const [data, setData] = useState(todayISO());
  const [conteudo, setConteudo] = useState('');
  const [metodologia, setMetodologia] = useState('');

  const filtered = diario.filter(d => !selTurma || d.turmaId === selTurma);

  const handleSave = async () => {
    if (!session || !conteudo || !selTurma) return;
    await saveDocument('diario', null, {
      turmaId: selTurma,
      disciplinaId: selDisc,
      professorId: session.userData.uid,
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
        <select className="form-control form-select" style={{ maxWidth: 220 }} value={selTurma} onChange={e => setSelTurma(e.target.value)}>
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

      <Modal id="diario" open={modal} onClose={() => setModal(false)} title="Novo Registro" icon="fa-book-open" footer={
        <><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSave}><i className="fa-solid fa-floppy-disk" /> Registrar</button></>
      }>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Turma *</label>
            <select className="form-control form-select" value={selTurma} onChange={e => setSelTurma(e.target.value)}>
              <option value="">Selecione</option>{turmas.map(t => <option key={t.id as string} value={t.id as string}>{t.nome as string}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Disciplina</label>
            <select className="form-control form-select" value={selDisc} onChange={e => setSelDisc(e.target.value)}>
              <option value="">Selecione</option>{disciplinas.map(d => <option key={d.id as string} value={d.id as string}>{d.nome as string}</option>)}
            </select></div>
        </div>
        <div className="form-group"><label className="form-label">Data</label><input type="date" className="form-control" value={data} onChange={e => setData(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Conteúdo da Aula *</label><textarea className="form-control" rows={4} value={conteudo} onChange={e => setConteudo(e.target.value)} placeholder="Descreva o conteúdo trabalhado..." /></div>
        <div className="form-group"><label className="form-label">Metodologia</label><textarea className="form-control" rows={2} value={metodologia} onChange={e => setMetodologia(e.target.value)} placeholder="Como o conteúdo foi trabalhado..." /></div>
      </Modal>
    </PageTransition>
  );
}
