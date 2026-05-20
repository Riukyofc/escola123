'use client';

import { useAuth } from '@/contexts/AuthContext';
import { dbGetAll, dbFind, getConfig, dbGetAllEscola } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { getNotaAnual, getGreeting, turnoIcon } from '@/lib/utils';
import { WelcomeBanner, StatCard, PageTransition } from '@/components/ui/DashboardUI';

export default function AlunoInicio() {
  useDataRefresh();
  const { session } = useAuth();
  if (!session || session.role !== 'aluno' || !session.user) return null;

  const aluno = session.user as Record<string, unknown>;
  const turma = dbFind<Record<string, unknown>>('turmas', aluno.turmaId as string);
  const cfg = getConfig();
  const disciplinas = dbGetAll<Record<string, unknown>>('disciplinas').filter(d => d.ativo);
  const notas = dbGetAllEscola<Record<string, unknown>>('notas').filter(n => n.alunoId === aluno.id);

  let totalAprov = 0, totalRep = 0;
  notas.forEach(n => {
    const anual = getNotaAnual(n.b1 as number | null, n.b2 as number | null, n.b3 as number | null, n.b4 as number | null);
    if (anual !== null) { if (anual >= cfg.notaMinima) totalAprov++; else totalRep++; }
  });

  const freqAll = dbGetAllEscola<Record<string, unknown>>('frequencia').filter(f => f.turmaId === aluno.turmaId);
  let totalAulas = 0, presencas = 0;
  freqAll.forEach(f => {
    const aulas = (f.aulas as { alunoId: string; status: string }[]) || [];
    const aula = aulas.find(a => a.alunoId === aluno.id);
    if (aula) { totalAulas++; if (aula.status === 'presente') presencas++; }
  });
  const freqPct = totalAulas > 0 ? ((presencas / totalAulas) * 100).toFixed(0) : '—';

  return (
    <PageTransition>
      <WelcomeBanner
        tag={`Ano Letivo ${cfg.bimestreAtual ? '2026' : '2026'}`}
        tagIcon="fa-star"
        name={`${getGreeting()}, ${(aluno.nome as string).split(' ')[0]}!`}
        sub={turma ? `${turma.nome} · ${turnoIcon(turma.turno as string)} Turno ${turma.turno}` : '—'}
        avatar={(aluno.nome as string).charAt(0).toUpperCase()}
        stats={[
          { label: 'Disciplinas', value: disciplinas.length },
          { label: 'Aprovações', value: totalAprov },
          { label: 'Freq. %', value: freqPct },
        ]}
      />

      <div className="stats-row stagger-container">
        <StatCard label="Minha Turma" value={turma ? turma.nome as string : '—'} desc={turma ? `${turnoIcon(turma.turno as string)} Turno ${turma.turno}` : ''} icon="fa-users" color="blue" />
        <StatCard label="Disciplinas" value={disciplinas.length} desc="no currículo" icon="fa-layer-group" color="purple" />
        <StatCard label="Aprovações" value={totalAprov} desc="após 4º bimestre" icon="fa-circle-check" color="green" />
        <StatCard label="Em Recuperação" value={totalRep} desc="após 4º bimestre" icon="fa-circle-xmark" color="red" />
      </div>

      <div className="panel-card" style={{ marginTop: 20 }}>
        <div className="panel-card-header">
          <div className="panel-card-title"><i className="fa-solid fa-chart-line" /> Desempenho por Disciplina</div>
          <span className="badge badge-blue">{cfg.bimestreAtual}º Bimestre</span>
        </div>
        <div className="panel-card-body">
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Disciplina</th>
                  <th className="text-center">1º Bim</th>
                  <th className="text-center">2º Bim</th>
                  <th className="text-center">3º Bim</th>
                  <th className="text-center">4º Bim</th>
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
                  const cell = (v: number | null) => {
                    if (v === null) return <td className="text-center" style={{ color: 'var(--text-muted)' }}>—</td>;
                    return <td className="text-center" style={{ fontWeight: 700, color: v >= cfg.notaMinima ? 'var(--success)' : 'var(--danger)' }}>{v.toFixed(1)}</td>;
                  };
                  return (
                    <tr key={d.id as string}>
                      <td style={{ fontWeight: 600 }}>{d.nome as string}</td>
                      {cell(b1)}{cell(b2)}{cell(b3)}{cell(b4)}
                      <td className="text-center">
                        {anual !== null ? (
                          <span className={`nota-anual-badge ${anual >= cfg.notaMinima ? 'aprovado' : 'reprovado'}`}>
                            <i className={`fa-solid ${anual >= cfg.notaMinima ? 'fa-circle-check' : 'fa-circle-xmark'}`} /> {anual.toFixed(1)}
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
      </div>
    </PageTransition>
  );
}
