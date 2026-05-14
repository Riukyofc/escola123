'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { dbGetAll } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { showToast, Modal, PageTransition } from '@/components/ui/DashboardUI';
import { saveDocument } from '@/lib/actions';

const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex'] as const;
const DIA_LABEL: Record<string, string> = { seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta' };
const MAX_AULAS = 5;

interface Aula { ordem: number; disciplinaId: string; professorId: string; }
interface HorarioDoc { id: string; turmaId: string; diaSemana: string; aulas: Aula[]; }

export default function DirHorarios() {
  useDataRefresh();
  const turmas = dbGetAll<Record<string, unknown>>('turmas').filter(t => t.ativo);
  const profs = dbGetAll<Record<string, unknown>>('professores').filter(p => p.ativo);
  const disciplinas = dbGetAll<Record<string, unknown>>('disciplinas').filter(d => d.ativo);
  const horarios = dbGetAll<HorarioDoc>('horarios_aula');

  const [selTurma, setSelTurma] = useState('');
  const [modal, setModal] = useState(false);
  const [editDia, setEditDia] = useState('');
  const [slots, setSlots] = useState<Aula[]>([]);
  const [saving, setSaving] = useState(false);

  const turma = turmas.find(t => t.id === selTurma);

  const getHorario = (dia: string): Aula[] => {
    const h = horarios.find(h => h.turmaId === selTurma && h.diaSemana === dia);
    return h?.aulas || [];
  };

  const openEdit = (dia: string) => {
    const existing = getHorario(dia);
    const filled: Aula[] = [];
    for (let i = 1; i <= MAX_AULAS; i++) {
      const found = existing.find(a => a.ordem === i);
      filled.push(found || { ordem: i, disciplinaId: '', professorId: '' });
    }
    setSlots(filled);
    setEditDia(dia);
    setModal(true);
  };

  const updateSlot = (ordem: number, field: 'disciplinaId' | 'professorId', value: string) => {
    setSlots(prev => prev.map(s => s.ordem === ordem ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    if (!selTurma || !editDia) return;
    setSaving(true);
    const filledSlots = slots.filter(s => s.disciplinaId && s.professorId);
    const docId = `${selTurma}_${editDia}`;
    await saveDocument('horarios_aula', docId, {
      turmaId: selTurma,
      diaSemana: editDia,
      aulas: filledSlots,
    });
    showToast('Horário salvo!', 'success');
    setSaving(false);
    setModal(false);
  };

  const getDiscNome = (id: string) => disciplinas.find(d => d.id === id)?.nome as string || '';
  const getDiscCor = (id: string) => disciplinas.find(d => d.id === id)?.cor as string || '#94a3b8';
  const getProfNome = (id: string) => { const p = profs.find(p => p.id === id); return p ? (p.nome as string).split(' ')[0] : ''; };

  return (
    <PageTransition>
      {/* Toolbar */}
      <div className="panel-card" style={{ marginBottom: 20 }}>
        <div className="panel-card-body" style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <i className="fa-solid fa-calendar-days" style={{ color: 'var(--secondary)', fontSize: '1.1rem' }} />
            <select className="form-control form-select" style={{ minWidth: 220, flex: 1, maxWidth: 320 }}
              value={selTurma} onChange={e => setSelTurma(e.target.value)}>
              <option value="">Selecione a turma</option>
              {turmas.map(t => <option key={t.id as string} value={t.id as string}>{t.nome as string}</option>)}
            </select>
            {turma && <span className="badge badge-blue">{turma.turno as string}</span>}
          </div>
        </div>
      </div>

      {selTurma ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="panel-card">
            <div className="panel-card-header">
              <div className="panel-card-title"><i className="fa-solid fa-table-cells-large" /> Grade Semanal — {turma?.nome as string}</div>
            </div>
            <div className="panel-card-body" style={{ padding: 0, overflow: 'auto' }}>
              <table className="data-table schedule-grid">
                <thead>
                  <tr>
                    <th style={{ width: 60, textAlign: 'center' }}>Aula</th>
                    {DIAS.map(d => (
                      <th key={d} style={{ textAlign: 'center', minWidth: 150 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          {DIA_LABEL[d]}
                          <button className="btn btn-xs btn-ghost" onClick={() => openEdit(d)}
                            title={`Editar ${DIA_LABEL[d]}`}>
                            <i className="fa-solid fa-pen" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: MAX_AULAS }, (_, i) => i + 1).map(ordem => (
                    <tr key={ordem}>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--text-muted)', fontSize: '.8rem' }}>
                        {ordem}ª
                      </td>
                      {DIAS.map(dia => {
                        const aulas = getHorario(dia);
                        const aula = aulas.find(a => a.ordem === ordem);
                        if (!aula) {
                          return (
                            <td key={dia} style={{ textAlign: 'center' }}>
                              <div className="schedule-cell empty" onClick={() => openEdit(dia)}>
                                <i className="fa-solid fa-plus" />
                              </div>
                            </td>
                          );
                        }
                        const cor = getDiscCor(aula.disciplinaId);
                        return (
                          <td key={dia}>
                            <div className="schedule-cell filled" style={{ borderLeft: `4px solid ${cor}` }} onClick={() => openEdit(dia)}>
                              <div className="schedule-disc" style={{ color: cor }}>{getDiscNome(aula.disciplinaId)}</div>
                              <div className="schedule-prof">{getProfNome(aula.professorId)}</div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
            {disciplinas.map(d => (
              <div key={d.id as string} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.78rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: d.cor as string }} />
                {d.nome as string}
              </div>
            ))}
          </div>
        </motion.div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon"><i className="fa-solid fa-calendar-days" /></div>
          <div className="empty-state-title">Selecione uma turma</div>
          <div className="empty-state-desc">Escolha uma turma acima para montar a grade de horários</div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal id="horario-edit" open={modal} onClose={() => setModal(false)}
        title={`Horário — ${DIA_LABEL[editDia]} — ${turma?.nome as string || ''}`}
        icon="fa-calendar-day" size="lg"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <i className={`fa-solid ${saving ? 'fa-spinner spin' : 'fa-floppy-disk'}`} /> Salvar
          </button>
        </>}
      >
        <div style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          <i className="fa-solid fa-circle-info" style={{ marginRight: 6 }} />
          Configure até {MAX_AULAS} aulas para {DIA_LABEL[editDia]}. Deixe em branco para slot vazio.
        </div>
        {slots.map(slot => (
          <div key={slot.ordem} className="schedule-slot-editor">
            <div className="slot-number">{slot.ordem}ª</div>
            <select className="form-control form-select" value={slot.disciplinaId}
              onChange={e => updateSlot(slot.ordem, 'disciplinaId', e.target.value)}>
              <option value="">— Sem aula —</option>
              {disciplinas.map(d => (
                <option key={d.id as string} value={d.id as string}>{d.nome as string}</option>
              ))}
            </select>
            <select className="form-control form-select" value={slot.professorId}
              onChange={e => updateSlot(slot.ordem, 'professorId', e.target.value)}>
              <option value="">— Professor —</option>
              {profs.map(p => (
                <option key={p.id as string} value={p.id as string}>{p.nome as string}</option>
              ))}
            </select>
          </div>
        ))}
      </Modal>
    </PageTransition>
  );
}
