'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dbGetAll, getConfig } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { getNotaAnual } from '@/lib/utils';
import { showToast, PageTransition } from '@/components/ui/DashboardUI';
import { saveNota } from '@/lib/actions';

export default function ProfNotas() {
  useDataRefresh();
  const { session } = useAuth();
  const cfg = getConfig();
  const turmas = dbGetAll<Record<string, unknown>>('turmas').filter(t => t.ativo);
  const disciplinas = dbGetAll<Record<string, unknown>>('disciplinas').filter(d => d.ativo);
  const allAlunos = dbGetAll<Record<string, unknown>>('alunos').filter(a => a.ativo);
  const allNotas = dbGetAll<Record<string, unknown>>('notas');

  const [selTurma, setSelTurma] = useState('');
  const [selDisc, setSelDisc] = useState('');
  const [selBim, setSelBim] = useState(String(cfg.bimestreAtual || 1));
  const [editedNotas, setEditedNotas] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const alunos = allAlunos.filter(a => a.turmaId === selTurma).sort((a, b) => String(a.nome).localeCompare(String(b.nome)));

  const handleSave = async () => {
    if (!selDisc || !selTurma) return;
    setSaving(true);
    try {
      for (const [alunoId, valor] of Object.entries(editedNotas)) {
        const v = parseFloat(valor);
        if (!isNaN(v) && v >= 0 && v <= 10) {
          await saveNota(alunoId, selDisc, parseInt(selBim), v);
        }
      }
      showToast('Notas salvas com sucesso!', 'success');
      setEditedNotas({});
    } catch { showToast('Erro ao salvar notas', 'error'); }
    setSaving(false);
  };

  return (
    <PageTransition>
      <div className="panel-card" style={{ marginBottom: 20 }}>
        <div className="panel-card-body" style={{ padding: '14px 22px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="form-control form-select" style={{ minWidth: 160, maxWidth: 220, flex: 1 }} value={selTurma} onChange={e => setSelTurma(e.target.value)}>
              <option value="">Selecione a turma</option>
              {turmas.map(t => <option key={t.id as string} value={t.id as string}>{t.nome as string}</option>)}
            </select>
            <select className="form-control form-select" style={{ minWidth: 160, maxWidth: 220, flex: 1 }} value={selDisc} onChange={e => setSelDisc(e.target.value)}>
              <option value="">Selecione a disciplina</option>
              {disciplinas.map(d => <option key={d.id as string} value={d.id as string}>{d.nome as string}</option>)}
            </select>
            <select className="form-control form-select" style={{ minWidth: 140, maxWidth: 160 }} value={selBim} onChange={e => setSelBim(e.target.value)}>
              {[1,2,3,4].map(b => <option key={b} value={String(b)}>{b}º Bimestre</option>)}
            </select>
          </div>
        </div>
      </div>

      {selTurma && selDisc ? (
        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-card-title"><i className="fa-solid fa-pen-to-square" /> Lançar Notas — {selBim}º Bimestre</div>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || Object.keys(editedNotas).length === 0}>
              <i className={`fa-solid ${saving ? 'fa-spinner spin' : 'fa-floppy-disk'}`} /> {saving ? 'Salvando...' : 'Salvar Notas'}
            </button>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>Nº</th><th>Aluno</th><th className="text-center">1º Bim</th><th className="text-center">2º Bim</th><th className="text-center">3º Bim</th><th className="text-center">4º Bim</th><th className="text-center">Nota Anual</th></tr>
              </thead>
              <tbody>
                {alunos.map((a, i) => {
                  const nota = allNotas.find(n => n.alunoId === a.id && n.disciplinaId === selDisc);
                  const vals = [1,2,3,4].map(b => (nota?.[`b${b}`] as number) ?? null);
                  const anual = getNotaAnual(vals[0], vals[1], vals[2], vals[3]);
                  const bimIdx = parseInt(selBim) - 1;
                  return (
                    <tr key={a.id as string}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{a.nome as string}</td>
                      {vals.map((v, bi) => (
                        <td key={bi} className="text-center">
                          {bi === bimIdx ? (
                            <input type="number" className={`nota-input ${v !== null ? (v >= cfg.notaMinima ? 'aprovado' : 'reprovado') : ''}`}
                              min="0" max="10" step="0.5"
                              value={editedNotas[a.id as string] ?? (v !== null ? String(v) : '')}
                              onChange={e => setEditedNotas(p => ({ ...p, [a.id as string]: e.target.value }))}
                            />
                          ) : (
                            <span style={{ fontWeight: 700, color: v !== null ? (v >= cfg.notaMinima ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)' }}>
                              {v !== null ? v.toFixed(1) : '—'}
                            </span>
                          )}
                        </td>
                      ))}
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
          </div>
        </div>
      ) : (
        <div className="empty-state"><div className="empty-state-icon"><i className="fa-solid fa-hand-pointer" /></div><div className="empty-state-title">Selecione uma turma e disciplina</div></div>
      )}
    </PageTransition>
  );
}
