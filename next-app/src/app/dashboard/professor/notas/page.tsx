'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dbGetAll, dbGetAllEscola, getConfig } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { getNotaAnual } from '@/lib/utils';
import { showToast, PageTransition } from '@/components/ui/DashboardUI';
import { saveNota, saveRecuperacao } from '@/lib/actions';

export default function ProfNotas() {
  useDataRefresh();
  const { session } = useAuth();
  const cfg = getConfig();

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
            Vincule seu login a um cadastro de Professor na Direção para gerenciar e lançar notas.
          </p>
        </div>
      </PageTransition>
    );
  }

  const professorDoc = session.user;
  const myTurmaIds = (professorDoc?.turmaIds as string[]) || [];

  const turmas = dbGetAllEscola<Record<string, unknown>>('turmas').filter(t => 
    t.ativo && (t.professorId === professorId || (Array.isArray(t.professorIds) && t.professorIds.includes(professorId)) || myTurmaIds.includes(t.id as string))
  );

  const disciplinas = dbGetAll<Record<string, unknown>>('disciplinas').filter(d => d.ativo);
  
  const myTurmaIdsSet = new Set(turmas.map(t => t.id as string));
  const allAlunos = dbGetAllEscola<Record<string, unknown>>('alunos').filter(a => a.ativo && myTurmaIdsSet.has(a.turmaId as string));
  const allNotas = dbGetAllEscola<Record<string, unknown>>('notas');

  const [subTab, setSubTab] = useState<'bimestral' | 'recuperacao'>('bimestral');
  const [selTurma, setSelTurma] = useState('');
  const [selDisc, setSelDisc] = useState('');
  const [selBim, setSelBim] = useState(String(cfg.bimestreAtual || 1));
  const [editedParciais, setEditedParciais] = useState<Record<string, { n1: string; n2: string; n3: string; n4: string }>>({});
  const [editedRecs, setEditedRecs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Sync selection with active school bimestre config
  useEffect(() => {
    if (cfg.bimestreAtual) {
      setSelBim(String(cfg.bimestreAtual));
    }
  }, [cfg.bimestreAtual]);

  // Reset edited states when switching tabs, turmas, or disciplines
  useEffect(() => {
    setEditedParciais({});
    setEditedRecs({});
  }, [subTab, selTurma, selDisc]);

  const alunos = allAlunos
    .filter(a => a.turmaId === selTurma)
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome)));

  const handleSaveBimestral = async () => {
    if (!selDisc || !selTurma) return;
    setSaving(true);
    try {
      let hasError = false;
      for (const aluno of alunos) {
        const alunoId = aluno.id as string;
        if (editedParciais[alunoId]) {
          const p = editedParciais[alunoId];
          const n1 = p.n1 !== '' ? parseFloat(p.n1) : null;
          const n2 = p.n2 !== '' ? parseFloat(p.n2) : null;
          const n3 = p.n3 !== '' ? parseFloat(p.n3) : null;
          const n4 = p.n4 !== '' ? parseFloat(p.n4) : null;

          const average = +(((n1 ?? 0) + (n2 ?? 0) + (n3 ?? 0) + (n4 ?? 0)) / 4).toFixed(1);

          if (
            (n1 !== null && (isNaN(n1) || n1 < 0 || n1 > 10)) ||
            (n2 !== null && (isNaN(n2) || n2 < 0 || n2 > 10)) ||
            (n3 !== null && (isNaN(n3) || n3 < 0 || n3 > 10)) ||
            (n4 !== null && (isNaN(n4) || n4 < 0 || n4 > 10))
          ) {
            showToast(`Valores de nota inválidos para ${aluno.nome as string}!`, 'error');
            hasError = true;
            break;
          }

          await saveNota(alunoId, selDisc, parseInt(selBim), average, { n1, n2, n3, n4 });
        }
      }
      if (!hasError) {
        showToast('Notas bimestrais salvas com sucesso!', 'success');
        setEditedParciais({});
      }
    } catch {
      showToast('Erro ao salvar notas bimestrais.', 'error');
    }
    setSaving(false);
  };

  const handleSaveRecuperacao = async () => {
    if (!selDisc || !selTurma) return;
    setSaving(true);
    try {
      let hasError = false;
      for (const [alunoId, valor] of Object.entries(editedRecs)) {
        if (valor === '') {
          await saveRecuperacao(alunoId, selDisc, 0);
        } else {
          const v = parseFloat(valor);
          if (!isNaN(v) && v >= 0 && v <= 10) {
            await saveRecuperacao(alunoId, selDisc, v);
          } else {
            showToast('Valores de recuperação inválidos!', 'error');
            hasError = true;
            break;
          }
        }
      }
      if (!hasError) {
        showToast('Notas de recuperação salvas com sucesso!', 'success');
        setEditedRecs({});
      }
    } catch {
      showToast('Erro ao salvar notas de recuperação.', 'error');
    }
    setSaving(false);
  };

  const hasEdits = subTab === 'bimestral'
    ? Object.keys(editedParciais).length > 0
    : Object.keys(editedRecs).length > 0;

  const handleSaveClick = subTab === 'bimestral' ? handleSaveBimestral : handleSaveRecuperacao;
  const saveButtonText = saving ? 'Salvando...' : (subTab === 'bimestral' ? 'Salvar Notas' : 'Salvar Recuperações');
  const titleText = subTab === 'bimestral'
    ? `Lançamento Bimestral — ${selBim}º Bimestre (Ativo)`
    : 'Recuperação Anual & Fechamento';

  return (
    <PageTransition>
      {/* TABS DE SELEÇÃO */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          className={`btn ${subTab === 'bimestral' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('bimestral')}
          style={{ transition: 'all 0.2s ease-in-out' }}
        >
          <i className="fa-solid fa-calendar-days" style={{ marginRight: 8 }} />
          Lançamento Bimestral
        </button>
        <button
          className={`btn ${subTab === 'recuperacao' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('recuperacao')}
          style={{ transition: 'all 0.2s ease-in-out' }}
        >
          <i className="fa-solid fa-graduation-cap" style={{ marginRight: 8 }} />
          Recuperação Anual & Fechamento
        </button>
      </div>

      {/* FILTROS */}
      <div className="panel-card" style={{ marginBottom: 20 }}>
        <div className="panel-card-body" style={{ padding: '14px 22px' }}>
          <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="form-control form-select"
              style={{ minWidth: 180, maxWidth: 240, flex: 1 }}
              value={selTurma}
              onChange={e => setSelTurma(e.target.value)}
            >
              <option value="">Selecione a turma</option>
              {turmas.map(t => <option key={t.id as string} value={t.id as string}>{t.nome as string}</option>)}
            </select>

            <select
              className="form-control form-select"
              style={{ minWidth: 180, maxWidth: 240, flex: 1 }}
              value={selDisc}
              onChange={e => setSelDisc(e.target.value)}
            >
              <option value="">Selecione a disciplina</option>
              {disciplinas.map(d => <option key={d.id as string} value={d.id as string}>{d.nome as string}</option>)}
            </select>

            {subTab === 'bimestral' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  <i className="fa-solid fa-lock" style={{ marginRight: 4 }} /> Bimestre Ativo:
                </span>
                <select
                  className="form-control form-select"
                  style={{ minWidth: 140, maxWidth: 160 }}
                  value={selBim}
                  disabled={true}
                  onChange={e => setSelBim(e.target.value)}
                >
                  {[1, 2, 3, 4].map(b => <option key={b} value={String(b)}>{b}º Bimestre</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {selTurma && selDisc ? (
        <div className="panel-card">
          <div className="panel-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div className="panel-card-title">
              <i className={subTab === 'bimestral' ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-graduation-cap'} /> {titleText}
            </div>
            <button
              className="btn btn-primary"
              onClick={handleSaveClick}
              disabled={saving || !hasEdits}
            >
              <i className={`fa-solid ${saving ? 'fa-spinner spin' : 'fa-floppy-disk'}`} style={{ marginRight: 6 }} /> {saveButtonText}
            </button>
          </div>

          <div className="table-scroll">
            {subTab === 'bimestral' ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nº</th>
                    <th>Aluno</th>
                    <th className="text-center" style={{ width: 100 }}>1º Bim</th>
                    <th className="text-center" style={{ width: 100 }}>2º Bim</th>
                    <th className="text-center" style={{ width: 100 }}>3º Bim</th>
                    <th className="text-center" style={{ width: 100 }}>4º Bim</th>
                    <th className="text-center" style={{ width: 120 }}>Média Anual</th>
                  </tr>
                </thead>
                <tbody>
                  {alunos.map((a, i) => {
                    const studentId = a.id as string;
                    const nota = allNotas.find(n => n.alunoId === studentId && n.disciplinaId === selDisc);
                    const vals = [1, 2, 3, 4].map(b => (nota?.[`b${b}`] as number) ?? null);

                    const activeBimNum = parseInt(selBim);
                    const p1 = editedParciais[studentId]?.n1 ?? (nota?.[`b${selBim}_n1`] !== undefined && nota?.[`b${selBim}_n1`] !== null ? String(nota?.[`b${selBim}_n1`]) : '');
                    const p2 = editedParciais[studentId]?.n2 ?? (nota?.[`b${selBim}_n2`] !== undefined && nota?.[`b${selBim}_n2`] !== null ? String(nota?.[`b${selBim}_n2`]) : '');
                    const p3 = editedParciais[studentId]?.n3 ?? (nota?.[`b${selBim}_n3`] !== undefined && nota?.[`b${selBim}_n3`] !== null ? String(nota?.[`b${selBim}_n3`]) : '');
                    const p4 = editedParciais[studentId]?.n4 ?? (nota?.[`b${selBim}_n4`] !== undefined && nota?.[`b${selBim}_n4`] !== null ? String(nota?.[`b${selBim}_n4`]) : '');

                    const n1Val = p1 !== '' ? parseFloat(p1) : null;
                    const n2Val = p2 !== '' ? parseFloat(p2) : null;
                    const n3Val = p3 !== '' ? parseFloat(p3) : null;
                    const n4Val = p4 !== '' ? parseFloat(p4) : null;

                    const hasValues = p1 !== '' || p2 !== '' || p3 !== '' || p4 !== '';
                    const currentAverage = hasValues ? +(((n1Val ?? 0) + (n2Val ?? 0) + (n3Val ?? 0) + (n4Val ?? 0)) / 4).toFixed(1) : null;
                    const isModified = editedParciais[studentId] !== undefined;
                    const displayAverage = isModified ? currentAverage : ((nota?.[`b${selBim}`] as number) ?? null);

                    // Compute simulated/current Média Anual incorporating recovery override if any
                    const recVal = (nota?.recuperacao as number) ?? null;
                    const annualVals = [1, 2, 3, 4].map(b => {
                      if (b === activeBimNum) return displayAverage;
                      return vals[b - 1];
                    });
                    const anual = getNotaAnual(annualVals[0], annualVals[1], annualVals[2], annualVals[3], recVal);

                    return (
                      <tr key={studentId}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{a.nome as string}</td>
                        {[1, 2, 3, 4].map(bNum => {
                          const isBimActive = bNum === activeBimNum;
                          const v = vals[bNum - 1];

                          return (
                            <td key={bNum} className="text-center">
                              {isBimActive ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    {[1, 2, 3, 4].map(nIdx => {
                                      const key = `n${nIdx}`;
                                      const dbVal = nota?.[`b${selBim}_n${nIdx}`];
                                      const val = editedParciais[studentId]?.[key as 'n1' | 'n2' | 'n3' | 'n4'] ?? (dbVal !== undefined && dbVal !== null ? String(dbVal) : '');
                                      return (
                                        <input
                                          key={nIdx}
                                          type="number"
                                          className="nota-input text-center"
                                          style={{ width: 44, padding: '4px 2px', fontSize: '0.75rem', borderRadius: 4 }}
                                          placeholder={`N${nIdx}`}
                                          min="0"
                                          max="10"
                                          step="0.1"
                                          value={val}
                                          onChange={e => {
                                            let inputVal = e.target.value;
                                            const numVal = parseFloat(inputVal);
                                            if (!isNaN(numVal)) {
                                              if (numVal > 10) inputVal = '10';
                                              else if (numVal < 0) inputVal = '0';
                                            }
                                            setEditedParciais(prev => {
                                              const studentPrev = prev[studentId] || {
                                                n1: nota?.[`b${selBim}_n1`] !== undefined && nota?.[`b${selBim}_n1`] !== null ? String(nota?.[`b${selBim}_n1`]) : '',
                                                n2: nota?.[`b${selBim}_n2`] !== undefined && nota?.[`b${selBim}_n2`] !== null ? String(nota?.[`b${selBim}_n2`]) : '',
                                                n3: nota?.[`b${selBim}_n3`] !== undefined && nota?.[`b${selBim}_n3`] !== null ? String(nota?.[`b${selBim}_n3`]) : '',
                                                n4: nota?.[`b${selBim}_n4`] !== undefined && nota?.[`b${selBim}_n4`] !== null ? String(nota?.[`b${selBim}_n4`]) : ''
                                              };
                                              return {
                                                ...prev,
                                                [studentId]: {
                                                  ...studentPrev,
                                                  [key]: inputVal
                                                }
                                              };
                                            });
                                          }}
                                        />
                                      );
                                    })}
                                  </div>
                                  {displayAverage !== null ? (
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--success)' }}>
                                      Média: {displayAverage.toFixed(1)}
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pendente</span>
                                  )}
                                </div>
                              ) : (
                                <span style={{ fontWeight: 700, color: v !== null ? (v >= cfg.notaMinima ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)' }}>
                                  {v !== null ? v.toFixed(1) : '—'}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="text-center">
                          {anual !== null ? (
                            <span className={`nota-anual-badge ${anual >= cfg.notaMinima ? 'aprovado' : 'reprovado'}`}>{anual.toFixed(1)}</span>
                          ) : <span className="nota-anual-badge pendente">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nº</th>
                    <th>Aluno</th>
                    <th className="text-center">1º Bim</th>
                    <th className="text-center">2º Bim</th>
                    <th className="text-center">3º Bim</th>
                    <th className="text-center">4º Bim</th>
                    <th className="text-center">Média Anual</th>
                    <th className="text-center" style={{ width: 140 }}>Recuperação</th>
                    <th className="text-center">Média Final</th>
                  </tr>
                </thead>
                <tbody>
                  {alunos.map((a, i) => {
                    const studentId = a.id as string;
                    const nota = allNotas.find(n => n.alunoId === studentId && n.disciplinaId === selDisc);
                    const b1 = (nota?.b1 as number) ?? null;
                    const b2 = (nota?.b2 as number) ?? null;
                    const b3 = (nota?.b3 as number) ?? null;
                    const b4 = (nota?.b4 as number) ?? null;

                    const mediaAnual = getNotaAnual(b1, b2, b3, b4);

                    const dbRec = (nota?.recuperacao as number) ?? null;
                    const recStr = editedRecs[studentId] ?? (dbRec !== null ? String(dbRec) : '');
                    const currentRec = recStr !== '' ? parseFloat(recStr) : null;

                    const mediaFinal = getNotaAnual(b1, b2, b3, b4, currentRec);

                    return (
                      <tr key={studentId}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{a.nome as string}</td>
                        {[b1, b2, b3, b4].map((v, bi) => (
                          <td key={bi} className="text-center">
                            <span style={{ fontWeight: 600, color: v !== null ? (v >= cfg.notaMinima ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)' }}>
                              {v !== null ? v.toFixed(1) : '—'}
                            </span>
                          </td>
                        ))}
                        <td className="text-center">
                          {mediaAnual !== null ? (
                            <span style={{ fontWeight: 700, color: mediaAnual >= cfg.notaMinima ? 'var(--success)' : 'var(--danger)' }}>
                              {mediaAnual.toFixed(1)}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td className="text-center">
                          <input
                            type="number"
                            className="nota-input text-center"
                            style={{ width: 85, margin: '0 auto', borderRadius: 4 }}
                            min="0"
                            max="10"
                            step="0.1"
                            disabled={mediaAnual === null}
                            placeholder={mediaAnual === null ? "Bloqueado" : "0.0"}
                            value={recStr}
                            onChange={e => {
                              let val = e.target.value;
                              const numVal = parseFloat(val);
                              if (!isNaN(numVal)) {
                                if (numVal > 10) val = '10';
                                else if (numVal < 0) val = '0';
                              }
                              setEditedRecs(prev => ({ ...prev, [studentId]: val }));
                            }}
                          />
                        </td>
                        <td className="text-center">
                          {mediaFinal !== null ? (
                            <span className={`nota-anual-badge ${mediaFinal >= cfg.notaMinima ? 'aprovado' : 'reprovado'}`}>
                              {mediaFinal.toFixed(1)}
                            </span>
                          ) : (
                            <span className="nota-anual-badge pendente">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <i className="fa-solid fa-hand-pointer" />
          </div>
          <div className="empty-state-title">Selecione uma turma e disciplina</div>
        </div>
      )}
    </PageTransition>
  );
}

