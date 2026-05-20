'use client';
import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dbGetAll, dbGetAllEscola } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { formatDate, todayISO } from '@/lib/utils';
import { showToast, EmptyState, PageTransition } from '@/components/ui/DashboardUI';
import { saveFrequenciaDoc } from '@/lib/actions';

const DIA_MAP: Record<number, string> = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' };

interface HorarioAula { ordem: number; disciplinaId: string; professorId: string; }
interface HorarioDoc { id: string; turmaId: string; diaSemana: string; aulas: HorarioAula[]; }

export default function ProfFrequencia() {
  useDataRefresh();
  const { session } = useAuth();
  const [selTurma, setSelTurma] = useState('');
  const [selData, setSelData] = useState(todayISO());
  const [freq, setFreq] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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
            Vincule seu login a um cadastro de Professor na Direção para registrar frequência.
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

  const myTurmaIdsSet = new Set(turmas.map(t => t.id as string));

  const allAlunos = dbGetAllEscola<Record<string, unknown>>('alunos').filter(a => 
    a.ativo && myTurmaIdsSet.has(a.turmaId as string)
  );

  const horarios = dbGetAllEscola<HorarioDoc>('horarios_aula');
  const disciplinas = dbGetAll<Record<string, unknown>>('disciplinas');

  const alunos = allAlunos.filter(a => a.turmaId === selTurma).sort((a, b) => String(a.nome).localeCompare(String(b.nome)));

  // Get the day of week for selected date
  const diaSemana = useMemo(() => {
    const d = new Date(selData + 'T12:00:00');
    return DIA_MAP[d.getDay()] || '';
  }, [selData]);

  // Find how many classes the professor has on this day/turma
  const aulasHoje = useMemo(() => {
    if (!selTurma || !diaSemana) return [];
    const horario = horarios.find(h => h.turmaId === selTurma && h.diaSemana === diaSemana);
    if (!horario) return [];
    return horario.aulas.filter(a => a.professorId === professorId);
  }, [selTurma, diaSemana, horarios, professorId]);

  const handleSave = async () => {
    if (!selTurma || !selData) return;
    setSaving(true);
    try {
      const aulas = alunos.map(a => ({ alunoId: a.id as string, status: freq[a.id as string] || 'presente' }));
      await saveFrequenciaDoc(selTurma, professorId, selData, aulas);
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
            <select className="form-control form-select" style={{ minWidth: 160, flex: 1, background: 'var(--panel-bg)', borderColor: 'var(--border)' }} value={selTurma} onChange={e => { setSelTurma(e.target.value); setFreq({}); }}>
              <option value="">Selecione a turma</option>
              {turmas.map(t => <option key={t.id as string} value={t.id as string}>{t.nome as string}</option>)}
            </select>
            <input type="date" className="form-control" style={{ minWidth: 150, maxWidth: 180, background: 'var(--panel-bg)', borderColor: 'var(--border)' }} value={selData} onChange={e => setSelData(e.target.value)} />
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
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th style={{ width: 60 }}>Nº</th><th>Nome do Aluno</th><th style={{ width: 240, textAlign: 'center' }}>Presença</th></tr></thead>
              <tbody>
                {alunos.map((a, i) => {
                  const status = freq[a.id as string] || 'presente';
                  return (
                    <tr key={a.id as string}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>{a.nome as string}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            className={`btn btn-sm ${status === 'presente' ? 'btn-success' : 'btn-outline'}`}
                            onClick={() => setFreq(prev => ({ ...prev, [a.id as string]: 'presente' }))}
                            style={{ flex: 1, maxWidth: 100 }}
                          >
                            Presente
                          </button>
                          <button
                            className={`btn btn-sm ${status === 'falta' ? 'btn-danger' : 'btn-outline'}`}
                            onClick={() => setFreq(prev => ({ ...prev, [a.id as string]: 'falta' }))}
                            style={{ flex: 1, maxWidth: 100 }}
                          >
                            Falta
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : <EmptyState icon="fa-hand-pointer" title={selTurma ? 'Nenhum aluno cadastrado nesta turma' : 'Selecione uma turma'} />}
    </PageTransition>
  );
}
