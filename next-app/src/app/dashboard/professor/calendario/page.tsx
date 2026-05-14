'use client';
import { useMemo } from 'react';
import { dbGetAll } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { PageTransition, EmptyState } from '@/components/ui/DashboardUI';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';

const EVENT_TYPES: Record<string, { label: string; color: string; icon: string }> = {
  feriado: { label: 'Feriado', color: '#dc2626', icon: 'fa-umbrella-beach' },
  prova: { label: 'Prova', color: '#2563eb', icon: 'fa-file-pen' },
  reuniao: { label: 'Reunião', color: '#7c3aed', icon: 'fa-people-group' },
  evento: { label: 'Evento', color: '#059669', icon: 'fa-star' },
  recesso: { label: 'Recesso', color: '#d97706', icon: 'fa-mug-hot' },
  outro: { label: 'Outro', color: '#64748b', icon: 'fa-circle-info' },
};

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

export default function ProfCalendario() {
  useDataRefresh();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const eventos = dbGetAll<Record<string, unknown>>('eventos_calendario');
  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  const eventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventos.filter(e => String(e.data || '').startsWith(dateStr));
  };

  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <PageTransition>
      <div className="panel-card">
        <div className="panel-card-header">
          <div className="panel-card-title"><i className="fa-solid fa-calendar-days" /> {MONTHS[month]} {year}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={prevMonth}><i className="fa-solid fa-chevron-left" /></button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); }}>Hoje</button>
            <button className="btn btn-ghost btn-sm" onClick={nextMonth}><i className="fa-solid fa-chevron-right" /></button>
          </div>
        </div>
        <div className="panel-card-body">
          <div className="calendar-legend">
            {Object.entries(EVENT_TYPES).map(([k, v]) => (
              <div key={k} className="calendar-legend-item"><div className="calendar-legend-dot" style={{ background: v.color }} />{v.label}</div>
            ))}
          </div>
          <div className="calendar-full-grid">
            {DAYS.map(d => <div key={d} className="calendar-day-header">{d}</div>)}
            {days.map((day, i) => (
              <div key={i} className={`calendar-day ${!day ? 'empty' : ''} ${day && isToday(day) ? 'today' : ''}`}>
                {day && (<>
                  <div className="calendar-day-num">{day}</div>
                  {eventsForDay(day).slice(0, 3).map(ev => {
                    const t = EVENT_TYPES[ev.tipo as string] || EVENT_TYPES.outro;
                    return <div key={ev.id as string} className="calendar-event-chip" style={{ background: t.color }}>{ev.titulo as string}</div>;
                  })}
                </>)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
