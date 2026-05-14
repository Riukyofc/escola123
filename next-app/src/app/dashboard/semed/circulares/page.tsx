'use client';
import { dbGetAll } from '@/lib/data';
import { formatDate } from '@/lib/utils';
import { EmptyState, StatCard } from '@/components/ui/DashboardUI';
export default function SemedCirculares() {
  const circulares = dbGetAll<Record<string, unknown>>('circulares').sort((a, b) => String(b.dataPublicacao || '').localeCompare(String(a.dataPublicacao || '')));
  return (
    <>
      <div className="stats-row" style={{ marginBottom: 20 }}>
        <StatCard label="Circulares Publicadas" value={circulares.length} icon="fa-scroll" color="blue" />
      </div>
      <div className="panel-card"><div className="panel-card-header"><div className="panel-card-title"><i className="fa-solid fa-scroll" /> Circulares</div></div>
        <div className="panel-card-body">{circulares.length === 0 ? <EmptyState icon="fa-scroll" title="Nenhuma circular" /> :
          circulares.map(c => (<div key={c.id as string} className="dash-aviso-item"><div className="dash-aviso-icon info"><i className="fa-solid fa-scroll" /></div>
            <div><div className="dash-aviso-title">{c.titulo as string}</div><div className="dash-aviso-body">{c.conteudo as string || ''}</div>
            <div className="dash-aviso-date"><i className="fa-regular fa-calendar" /> {formatDate(c.dataPublicacao as string)}</div></div></div>))
        }</div></div>
    </>
  );
}
