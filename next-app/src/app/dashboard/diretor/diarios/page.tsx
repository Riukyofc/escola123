'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { dbGetAllEscola, dbFind } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { showToast, Modal, EmptyState, StatCard, PageTransition, Badge } from '@/components/ui/DashboardUI';
import { updateDocument } from '@/lib/actions';
import { formatDate } from '@/lib/utils';

export default function DirDiarios() {
  useDataRefresh();
  const diarios = dbGetAllEscola<Record<string, unknown>>('diario').sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')));
  const turmas = dbGetAllEscola<Record<string, unknown>>('turmas');
  const profs = dbGetAllEscola<Record<string, unknown>>('professores');

  const [filter, setFilter] = useState<'todos' | 'pendente' | 'aprovado' | 'rejeitado'>('todos');
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [obs, setObs] = useState('');

  const pendentes = diarios.filter(d => (d.status || 'pendente') === 'pendente').length;
  const aprovados = diarios.filter(d => d.status === 'aprovado').length;
  const rejeitados = diarios.filter(d => d.status === 'rejeitado').length;

  const filtered = filter === 'todos' ? diarios : diarios.filter(d => (d.status || 'pendente') === filter);

  const openReview = (d: Record<string, unknown>) => {
    setSelected(d);
    setObs('');
    setModal(true);
  };

  const handleAction = async (action: 'aprovado' | 'rejeitado') => {
    if (!selected) return;
    await updateDocument('diario', selected.id as string, {
      status: action,
      observacaoDiretor: obs,
      dataAprovacao: new Date().toISOString(),
    });
    showToast(action === 'aprovado' ? 'Diário aprovado!' : 'Diário rejeitado', action === 'aprovado' ? 'success' : 'info');
    setModal(false);
  };

  const statusConfig: Record<string, { color: string; icon: string; label: string; badgeColor: 'blue' | 'green' | 'red' | 'yellow' }> = {
    pendente: { color: 'var(--warning)', icon: 'fa-clock', label: 'Pendente', badgeColor: 'yellow' },
    aprovado: { color: 'var(--success)', icon: 'fa-circle-check', label: 'Aprovado', badgeColor: 'green' },
    rejeitado: { color: 'var(--danger)', icon: 'fa-circle-xmark', label: 'Rejeitado', badgeColor: 'red' },
  };

  return (
    <PageTransition>
      <div className="stats-row" style={{ marginBottom: 20 }}>
        <StatCard label="Total Diários" value={diarios.length} icon="fa-book-open" color="blue" />
        <StatCard label="Pendentes" value={pendentes} icon="fa-clock" color="amber" desc={pendentes > 0 ? 'Aguardando revisão' : ''} />
        <StatCard label="Aprovados" value={aprovados} icon="fa-circle-check" color="green" />
        <StatCard label="Rejeitados" value={rejeitados} icon="fa-circle-xmark" color="red" />
      </div>

      <div className="panel-card" style={{ marginBottom: 16 }}>
        <div className="panel-card-body" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['todos', 'pendente', 'aprovado', 'rejeitado'] as const).map(f => (
              <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
                {f === 'todos' ? 'Todos' : statusConfig[f].label}
                {f === 'pendente' && pendentes > 0 && <span className="badge badge-yellow" style={{ marginLeft: 6 }}>{pendentes}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-card-header">
          <div className="panel-card-title"><i className="fa-solid fa-book-open" /> Diários de Classe</div>
          <span className="badge badge-blue">{filtered.length}</span>
        </div>
        <div className="panel-card-body" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <EmptyState icon="fa-book-open" title="Nenhum diário encontrado" desc="Os professores ainda não registraram diários" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filtered.map((d, i) => {
                const turma = turmas.find(t => t.id === d.turmaId);
                const prof = profs.find(p => p.id === d.professorId);
                const status = (d.status as string) || 'pendente';
                const cfg = statusConfig[status];
                return (
                  <motion.div
                    key={d.id as string}
                    className="diario-review-card"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ borderLeft: `4px solid ${cfg.color}` }}
                  >
                    <div className="diario-review-main">
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <Badge color={cfg.badgeColor}><i className={`fa-solid ${cfg.icon}`} /> {cfg.label}</Badge>
                          <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{formatDate(d.data as string)}</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text)', marginBottom: 4 }}>
                          {d.conteudo ? String(d.conteudo).slice(0, 120) + (String(d.conteudo).length > 120 ? '...' : '') : 'Sem conteúdo'}
                        </div>
                        <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', display: 'flex', gap: 14 }}>
                          <span><i className="fa-solid fa-chalkboard-user" /> {prof?.nome as string || '—'}</span>
                          <span><i className="fa-solid fa-users" /> {turma?.nome as string || '—'}</span>
                        </div>
                        {d.observacaoDiretor ? (
                          <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 'var(--r-md)', background: 'var(--surface-3)', fontSize: '.78rem', color: 'var(--text-secondary)' }}>
                            <i className="fa-solid fa-comment" style={{ marginRight: 6 }} />
                            {String(d.observacaoDiretor)}
                          </div>
                        ) : null}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', flexShrink: 0 }}>
                        {status === 'pendente' ? (
                          <>
                            <button className="btn btn-sm btn-success" onClick={() => openReview(d)}>
                              <i className="fa-solid fa-check" /> Revisar
                            </button>
                          </>
                        ) : (
                          <button className="btn btn-xs btn-ghost" onClick={() => openReview(d)}>
                            <i className="fa-solid fa-eye" /> Ver
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal id="review" open={modal} onClose={() => setModal(false)}
        title="Revisar Diário" icon="fa-book-open" size="md"
        footer={(selected?.status || 'pendente') === 'pendente' ? <>
          <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn btn-danger" onClick={() => handleAction('rejeitado')}><i className="fa-solid fa-xmark" /> Rejeitar</button>
          <button className="btn btn-success" onClick={() => handleAction('aprovado')}><i className="fa-solid fa-check" /> Aprovar</button>
        </> : <button className="btn btn-ghost" onClick={() => setModal(false)}>Fechar</button>}
      >
        {selected && <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>
              <i className="fa-solid fa-calendar" /> {formatDate(selected.data as string)} ·
              <i className="fa-solid fa-chalkboard-user" style={{ marginLeft: 8 }} /> {profs.find(p => p.id === selected.professorId)?.nome as string || '—'} ·
              <i className="fa-solid fa-users" style={{ marginLeft: 8 }} /> {turmas.find(t => t.id === selected.turmaId)?.nome as string || '—'}
            </div>
          </div>
          <div className="panel-card" style={{ marginBottom: 16 }}>
            <div className="panel-card-body">
              <div style={{ fontSize: '.88rem', lineHeight: 1.7, color: 'var(--text)' }}>
                {selected.conteudo as string || 'Sem conteúdo registrado.'}
              </div>
            </div>
          </div>
          {(selected.status || 'pendente') === 'pendente' && (
            <div className="form-group">
              <label className="form-label">Observação (opcional)</label>
              <textarea className="form-control" rows={3} value={obs} onChange={e => setObs(e.target.value)}
                placeholder="Adicione um comentário sobre o diário..." />
            </div>
          )}
        </>}
      </Modal>
    </PageTransition>
  );
}
