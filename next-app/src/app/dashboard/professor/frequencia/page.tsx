'use client';
import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dbGetAll } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { formatDate, todayISO } from '@/lib/utils';
import { showToast, EmptyState, PageTransition, StatCard } from '@/components/ui/DashboardUI';
import { saveFrequenciaDoc } from '@/lib/actions';

const DIA_MAP: Record<number, string> = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' };

interface HorarioAula { ordem: number; disciplinaId: string; professorId: string; }
interface HorarioDoc { id: string; turmaId: string; diaSemana: string; aulas: HorarioAula[]; }

export default function ProfFrequencia() {
  useDataRefresh();
  const { session } = useAuth();
  const turmas = dbGetAll<Record<string, unknown>>('turmas').filter(t => t.ativo);
  const allAlunos = dbGetAll<Record<string, unknown>>('alunos').filter(a => a.ativo);
  const horarios = dbGetAll<HorarioDoc>('horarios_aula');
  const disciplinas = dbGetAll<Record<string, unknown>>('disciplinas');

  const [selTurma, setSelTurma] = useState('');
  const [selData, setSelData] = useState(todayISO());
  const [freq, setFreq] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const alunos = allAlunos.filter(a => a.turmaId === selTurma).sort((a, b) => String(a.nome).localeCompare(String(b.nome)));

  // Get the day of week for selected date
  const diaSemana = useMemo(() => {
    const d = new Date(selData + 'T12:00:00');
    return DIA_MAP[d.getDay()] || '';
  }, [selData]);

  // Find how many classes the professor has on this day/turma
  const aulasHoje = useMemo(() => {
    if (!selTurma || !diaSemana || !session) return [];
    const horario = horarios.find(h => h.turmaId === selTurma && h.diaSemana === diaSemana);
    if (!horario) return [];
    return horario.aulas.filter(a => a.professorId === session.userData.uid);
  }, [selTurma, diaSemana, horarios, session]);

  const handleSave = async () => {
    if (!selTurma || !selData || !session) return;
    setSaving(true);
    try {
      const aulas = alunos.map(a => ({ alunoId: a.id as string, status: freq[a.id as string] || 'presente' }));
      await saveFrequenciaDoc(selTurma, session.userData.uid, selData, aulas);
      showToast(`Frequência salva! (${aulasHoje.length || 1} aula${aulasHoje.length !== 1 ? 's' : ''})`, 'success');
    } catch { showToast('Erro ao salvar', 'error'); }
    setSaving(false);
  };

  const markAll = (status: string) => {
    const updated: Record<string, string> = {};
    alunos.forEach(a => { updated[a.id as string] = status; });
    setFreq(updated);
  };

  const getDiscNome = (id: string) => disciplinas.find(d => d.id === id)?.nome as string || '';

  return (
    <PageTransition>
      <div className="panel-card" style={{ marginBottom: 20 }}>
        <div className="panel-card-body" style={{ padding: '14px 22px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="form-control form-select" style={{ minWidth: 160, flex: 1 }} value={selTurma} onChange={e => { setSelTurma(e.target.value); setFreq({}); }}>
              <option value="">Selecione a turma</option>
              {turmas.map(t => <option key={t.id as string} value={t.id as string}>{t.nome as string}</option>)}
            </select>
            <input type="date" className="form-control" style={{ minWidth: 150, maxWidth: 180 }} value={selData} onChange={e => setSelData(e.target.value)} />
            <button className="btn btn-sm btn-success" onClick={() => markAll('presente')}><i className="fa-solid fa-check-double" /> Todos Presentes</button>
            <button className="btn btn-sm btn-danger" onClick={() => markAll('falta')}><i className="fa-solid fa-xmark" /> Todos Falta</button>
          </div>
        </div>
      </div>

      {/* Schedule info card */}
      {selTurma && diaSemana && diaSemana !== 'dom' && diaSemana !== 'sab' && (
        <div className="panel-card" style={{ marginBottom: 16, borderLeft: aulasHoje.length > 0 ? '4px solid var(--success)' : '4px solid var(--warning)' }}>
          <div className="panel-card-body" style={{ padding: '12px 16px' }}>
            {aulasHoje.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-calendar-check" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--text)' }}>
                    Você tem <strong>{aulasHoje.length} aula{aulasHoje.length !== 1 ? 's' : ''}</strong> nesta turma hoje
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', display: 'flex', gap: 10, marginTop: 2 }}>
                    {aulasHoje.map(a => (
                      <span key={a.ordem}>{a.ordem}ª aula: <strong>{getDiscNome(a.disciplinaId)}</strong></span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', background: 'var(--warning-light)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-circle-info" />
                </div>
                <div style={{ fontSize: '.85rem', color: 'var(--text-secondary)' }}>
                  Sem aulas cadastradas no horário para este dia. Você ainda pode registrar a frequência manualmente.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {selTurma && alunos.length > 0 ? (
        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-card-title"><i className="fa-solid fa-calendar-check" /> Chamada — {formatDate(selData)}</div>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <i className={`fa-solid ${saving ? 'fa-spinner spin' : 'fa-floppy-disk'}`} /> Salvar
            </button>
          </div>
          <div className="panel-card-body">
            <div className="freq-grid">
              {alunos.map((a, i) => (
                <div key={a.id as string} className="freq-aluno-row">
                  <div><div className="freq-aluno-name">{a.nome as string}</div><div className="freq-aluno-num">Nº {i + 1} · {a.matricula as string}</div></div>
                  <div className="freq-buttons">
                    {['presente', 'falta', 'justificado'].map(s => (
                      <button key={s} className={`freq-btn ${s} ${(freq[a.id as string] || 'presente') === s ? 'active' : ''}`}
                        onClick={() => setFreq(p => ({ ...p, [a.id as string]: s }))}>
                        {s === 'presente' ? '✅ Presente' : s === 'falta' ? '❌ Falta' : '📝 Justificado'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : selTurma ? (
        <EmptyState icon="fa-users-slash" title="Nenhum aluno nesta turma" />
      ) : (
        <EmptyState icon="fa-hand-pointer" title="Selecione uma turma" desc="Escolha uma turma para registrar a frequência" />
      )}
    </PageTransition>
  );
}
