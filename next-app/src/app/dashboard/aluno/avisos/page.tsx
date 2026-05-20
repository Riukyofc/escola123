'use client';

import { useAuth } from '@/contexts/AuthContext';
import { dbGetAllEscola } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { formatDate } from '@/lib/utils';
import { EmptyState, PageTransition } from '@/components/ui/DashboardUI';

const tipoIcon: Record<string, string> = { info: 'fa-circle-info', urgente: 'fa-triangle-exclamation', sucesso: 'fa-circle-check', geral: 'fa-bullhorn' };
const tipoLabel: Record<string, string> = { info: 'Informativo', urgente: 'Urgente', sucesso: 'Destaque', geral: 'Geral' };

export default function AlunoAvisos() {
  useDataRefresh();
  const { session } = useAuth();
  if (!session || !session.user) return null;

  const aluno = session.user;
  const avisos = dbGetAllEscola<Record<string, unknown>>('avisos')
    .filter(a => a.ativo && (!a.turmaId || a.turmaId === aluno.turmaId))
    .sort((a, b) => String(b.dataCriacao || '').localeCompare(String(a.dataCriacao || '')));

  return (
    <PageTransition>
    <div className="panel-card">
      <div className="panel-card-header">
        <div className="panel-card-title"><i className="fa-solid fa-bell" /> Comunicados da Escola</div>
      </div>
      <div className="panel-card-body">
        {avisos.length === 0 ? (
          <EmptyState icon="fa-bell-slash" title="Nenhum aviso no momento" />
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {avisos.map(av => {
              const tipo = (av.tipo as string) || 'geral';
              return (
                <div key={av.id as string} className={`aviso-card ${tipo}`}>
                  <span className={`aviso-badge badge-${tipo}`}>
                    <i className={`fa-solid ${tipoIcon[tipo] || 'fa-bullhorn'}`} />
                    {tipoLabel[tipo] || 'Geral'}
                  </span>
                  <div style={{ fontWeight: 700, marginTop: 10, fontSize: '.9rem', color: 'var(--text)' }}>{av.titulo as string}</div>
                  <div style={{ marginTop: 6, fontSize: '.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{av.corpo as string}</div>
                  <div style={{ marginTop: 8, fontSize: '.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="fa-regular fa-calendar" />
                    {formatDate(av.dataCriacao as string)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
