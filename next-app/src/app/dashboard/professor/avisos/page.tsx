'use client';
import { useAuth } from '@/contexts/AuthContext';
import { dbGetAllEscola } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/ui/DashboardUI';
const tipoIcon: Record<string, string> = { info: 'fa-circle-info', urgente: 'fa-triangle-exclamation', sucesso: 'fa-circle-check', geral: 'fa-bullhorn' };
export default function ProfAvisos() {
  useDataRefresh();
  const avisos = dbGetAllEscola<Record<string, unknown>>('avisos').filter(a => a.ativo).sort((a, b) => String(b.dataCriacao || '').localeCompare(String(a.dataCriacao || '')));
  return (
    <div className="panel-card">
      <div className="panel-card-header"><div className="panel-card-title"><i className="fa-solid fa-bell" /> Avisos</div></div>
      <div className="panel-card-body">
        {avisos.length === 0 ? <EmptyState icon="fa-bell-slash" title="Nenhum aviso" /> : (
          avisos.map(av => (
            <div key={av.id as string} className="dash-aviso-item">
              <div className={`dash-aviso-icon ${av.tipo as string}`}><i className={`fa-solid ${tipoIcon[av.tipo as string] || 'fa-bullhorn'}`} /></div>
              <div><div className="dash-aviso-title">{av.titulo as string}</div><div className="dash-aviso-body">{av.corpo as string}</div>
              <div className="dash-aviso-date"><i className="fa-regular fa-calendar" /> {formatDate(av.dataCriacao as string)}</div></div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
