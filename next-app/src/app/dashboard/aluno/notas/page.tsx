'use client';

import { useAuth } from '@/contexts/AuthContext';
import { dbGetAll, dbFind, getConfig } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { getNotaAnual } from '@/lib/utils';
import { PageTransition } from '@/components/ui/DashboardUI';

export default function AlunoNotas() {
  useDataRefresh();
  const { session } = useAuth();
  if (!session || !session.user) return null;

  const aluno = session.user;
  const turma = dbFind<Record<string, unknown>>('turmas', aluno.turmaId as string);
  const cfg = getConfig();
  const disciplinas = dbGetAll<Record<string, unknown>>('disciplinas').filter(d => d.ativo);
  const notas = dbGetAll<Record<string, unknown>>('notas').filter(n => n.alunoId === aluno.id);

  const cell = (v: number | null) => {
    if (v === null) return <td className="text-center" style={{ color: 'var(--text-muted)' }}>—</td>;
    return <td className="text-center" style={{ fontWeight: 700, color: v >= cfg.notaMinima ? 'var(--success)' : 'var(--danger)' }}>{v.toFixed(1)}</td>;
  };

  return (
    <PageTransition>
    <div className="panel-card">
      <div className="panel-card-header">
        <div className="panel-card-title"><i className="fa-solid fa-graduation-cap" /> Minhas Notas — {aluno.nome as string}</div>
        {turma && <span className="badge badge-outline">{turma.nome as string} · {turma.turno as string}</span>}
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Disciplina</th>
              <th className="text-center">1º Bimestre</th>
              <th className="text-center">2º Bimestre</th>
              <th className="text-center">3º Bimestre</th>
              <th className="text-center">4º Bimestre</th>
              <th className="text-center">Nota Anual</th>
              <th className="text-center">Situação</th>
            </tr>
          </thead>
          <tbody>
            {disciplinas.map(d => {
              const nota = notas.find(n => n.disciplinaId === d.id);
              const b1 = (nota?.b1 as number) ?? null, b2 = (nota?.b2 as number) ?? null;
              const b3 = (nota?.b3 as number) ?? null, b4 = (nota?.b4 as number) ?? null;
              const anual = getNotaAnual(b1, b2, b3, b4);
              return (
                <tr key={d.id as string}>
                  <td style={{ fontWeight: 600 }}>{d.nome as string}</td>
                  {cell(b1)}{cell(b2)}{cell(b3)}{cell(b4)}
                  <td className="text-center">
                    {anual !== null ? (
                      <span className={`nota-anual-badge ${anual >= cfg.notaMinima ? 'aprovado' : 'reprovado'}`}>
                        {anual.toFixed(1)}
                      </span>
                    ) : <span className="nota-anual-badge pendente">—</span>}
                  </td>
                  <td className="text-center">
                    {anual === null ? <span className="badge badge-gray">Em andamento</span>
                      : anual >= cfg.notaMinima ? <span className="badge badge-green"><i className="fa-solid fa-check" /> Aprovado</span>
                      : <span className="badge badge-red"><i className="fa-solid fa-xmark" /> Reprovado</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    </PageTransition>
  );
}
