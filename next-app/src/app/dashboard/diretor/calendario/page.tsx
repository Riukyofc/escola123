'use client';
import { useState, useMemo } from 'react';
import { dbGetAllEscola } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { PageTransition, StatCard, Modal, EmptyState, showToast, confirm } from '@/components/ui/DashboardUI';
import { saveDocument, removeDocument } from '@/lib/actions';
import { formatDate, todayISO } from '@/lib/utils';

const EVENT_TYPES = [
  { value: 'feriado', label: 'Feriado', color: '#dc2626', icon: 'fa-umbrella-beach' },
  { value: 'prova', label: 'Prova/Avaliação', color: '#2563eb', icon: 'fa-file-pen' },
  { value: 'reuniao', label: 'Reunião', color: '#7c3aed', icon: 'fa-people-group' },
  { value: 'evento', label: 'Evento Escolar', color: '#059669', icon: 'fa-star' },
  { value: 'recesso', label: 'Recesso', color: '#d97706', icon: 'fa-mug-hot' },
  { value: 'outro', label: 'Outro', color: '#64748b', icon: 'fa-circle-info' },
];

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

export default function CalendarioPage() {
  useDataRefresh();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [data, setData] = useState(todayISO());
  const [tipo, setTipo] = useState('evento');
  const [descricao, setDescricao] = useState('');

  const eventos = dbGetAllEscola<Record<string, unknown>>('eventos_calendario');
  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  const eventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventos.filter(e => String(e.data || '').startsWith(dateStr));
  };

  const getTypeInfo = (t: string) => EVENT_TYPES.find(et => et.value === t) || EVENT_TYPES[5];
  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const openNew = (day?: number) => {
    setEditId(null); setTitulo(''); setDescricao(''); setTipo('evento');
    if (day) {
      setData(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    } else {
      setData(todayISO());
    }
    setModal(true);
  };

  const openEdit = (e: Record<string, unknown>) => {
    setEditId(e.id as string);
    setTitulo(e.titulo as string || '');
    setData(e.data as string || todayISO());
    setTipo(e.tipo as string || 'evento');
    setDescricao(e.descricao as string || '');
    setModal(true);
  };

  const handleSave = async () => {
    if (!titulo || !data) return;
    const typeInfo = getTypeInfo(tipo);
    await saveDocument('eventos_calendario', editId, {
      titulo, data, tipo, descricao, cor: typeInfo.color,
    });
    showToast(editId ? 'Evento atualizado!' : 'Evento criado!', 'success');
    setModal(false);
  };

  const handleDelete = async (id: string) => {
    if (await confirm('Excluir este evento?')) {
      await removeDocument('eventos_calendario', id);
      showToast('Evento removido', 'success');
    }
  };

  // Events for selected month
  const monthEvents = eventos.filter(e => {
    const d = String(e.data || '');
    return d.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`);
  }).sort((a, b) => String(a.data || '').localeCompare(String(b.data || '')));

  return (
    <PageTransition>
      <div className="panel-card" style={{ marginBottom: 20 }}>
        <div className="panel-card-header">
          <div className="panel-card-title">
            <i className="fa-solid fa-calendar-days" /> {MONTHS[month]} {year}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={prevMonth}><i className="fa-solid fa-chevron-left" /></button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); }}>Hoje</button>
            <button className="btn btn-ghost btn-sm" onClick={nextMonth}><i className="fa-solid fa-chevron-right" /></button>
            <button className="btn btn-primary btn-sm" onClick={() => openNew()}><i className="fa-solid fa-plus" /> Novo Evento</button>
          </div>
        </div>
        <div className="panel-card-body">
          {/* Legend */}
          <div className="calendar-legend">
            {EVENT_TYPES.map(t => (
              <div key={t.value} className="calendar-legend-item">
                <div className="calendar-legend-dot" style={{ background: t.color }} />
                {t.label}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="calendar-full-grid">
            {DAYS.map(d => <div key={d} className="calendar-day-header">{d}</div>)}
            {days.map((day, i) => (
              <div
                key={i}
                className={`calendar-day ${day === null ? 'empty' : ''} ${day && isToday(day) ? 'today' : ''}`}
                onClick={() => day && openNew(day)}
              >
                {day && (
                  <>
                    <div className="calendar-day-num">{day}</div>
                    {eventsForDay(day).slice(0, 3).map(ev => {
                      const t = getTypeInfo(ev.tipo as string);
                      return (
                        <div
                          key={ev.id as string}
                          className="calendar-event-chip"
                          style={{ background: t.color }}
                          onClick={e => { e.stopPropagation(); openEdit(ev); }}
                        >
                          {ev.titulo as string}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="panel-card">
        <div className="panel-card-header">
          <div className="panel-card-title"><i className="fa-solid fa-list" /> Eventos do Mês</div>
          <span className="badge badge-blue">{monthEvents.length}</span>
        </div>
        <div className="panel-card-body">
          {monthEvents.length === 0 ? (
            <EmptyState icon="fa-calendar-xmark" title="Nenhum evento neste mês" desc="Clique em um dia ou em 'Novo Evento' para adicionar" />
          ) : (
            monthEvents.map(ev => {
              const t = getTypeInfo(ev.tipo as string);
              return (
                <div key={ev.id as string} className="cal-event-item" style={{ marginBottom: 8 }}>
                  <div className="cal-event-dot" style={{ background: t.color }} />
                  <div className="cal-event-info">
                    <div className="cal-event-title">{ev.titulo as string}</div>
                    <div className="cal-event-date">
                      <i className={`fa-solid ${t.icon}`} style={{ color: t.color }} /> {formatDate(ev.data as string)} · {t.label}
                    </div>
                    {!!ev.descricao && <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{ev.descricao as string}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-xs btn-ghost" onClick={() => openEdit(ev)}><i className="fa-solid fa-pen" /></button>
                    <button className="btn btn-xs btn-danger" onClick={() => handleDelete(ev.id as string)}><i className="fa-solid fa-trash" /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Modal id="evento" open={modal} onClose={() => setModal(false)} title={editId ? 'Editar Evento' : 'Novo Evento'} icon="fa-calendar-plus" iconColor="var(--success)" footer={
        <><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}><i className="fa-solid fa-floppy-disk" /> Salvar</button></>
      }>
        <div className="form-group"><label className="form-label">Título *</label><input className="form-control" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Reunião de Pais" /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Data *</label><input type="date" className="form-control" value={data} onChange={e => setData(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Tipo</label>
            <select className="form-control form-select" value={tipo} onChange={e => setTipo(e.target.value)}>
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Descrição</label><textarea className="form-control" value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} placeholder="Detalhes do evento..." /></div>
      </Modal>
    </PageTransition>
  );
}
