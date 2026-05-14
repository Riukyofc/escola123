'use client';
import { dbGetAll, getConfig } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { getNotaAnual } from '@/lib/utils';
import { StatCard, PageTransition } from '@/components/ui/DashboardUI';
import { generateRelatorioTurma, generateRelatorioFrequencia } from '@/lib/reports';

export default function DirRelatorios() {
  useDataRefresh();
  const cfg = getConfig();
  const turmas = dbGetAll<Record<string, unknown>>('turmas').filter(t => t.ativo);
  const alunos = dbGetAll<Record<string, unknown>>('alunos').filter(a => a.ativo);
  const notas = dbGetAll<Record<string, unknown>>('notas');
  const disciplinas = dbGetAll<Record<string, unknown>>('disciplinas').filter(d => d.ativo);

  // Calculate stats
  let totalAprov = 0, totalRep = 0, totalPend = 0;
  alunos.forEach(a => {
    let aprovado = true, temNota = false;
    disciplinas.forEach(d => {
      const nota = notas.find(n => n.alunoId === a.id && n.disciplinaId === d.id);
      if (nota) {
        const anual = getNotaAnual(nota.b1 as number | null, nota.b2 as number | null, nota.b3 as number | null, nota.b4 as number | null);
        if (anual !== null) { temNota = true; if (anual < cfg.notaMinima) aprovado = false; }
      }
    });
    if (temNota) { if (aprovado) totalAprov++; else totalRep++; } else totalPend++;
  });

  return (
    <PageTransition>
      <div className="stats-row stagger-container" style={{ marginBottom: 20 }}>
        <StatCard label="Aprovados" value={totalAprov} icon="fa-circle-check" color="green" />
        <StatCard label="Reprovados" value={totalRep} icon="fa-circle-xmark" color="red" />
        <StatCard label="Pendentes" value={totalPend} icon="fa-clock" color="amber" />
        <StatCard label="Taxa Aprovação" value={alunos.length > 0 ? `${((totalAprov / Math.max(totalAprov + totalRep, 1)) * 100).toFixed(0)}%` : '—'} icon="fa-chart-pie" color="blue" />
      </div>

      {turmas.map(t => {
        const turmaAlunos = alunos.filter(a => a.turmaId === t.id);
        return (
          <div key={t.id as string} className="panel-card" style={{ marginBottom: 16 }}>
            <div className="panel-card-header">
              <div className="panel-card-title"><i className="fa-solid fa-users" /> {t.nome as string}</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button className="btn btn-xs btn-ghost" onClick={() => generateRelatorioTurma(t.id as string)} data-tooltip="PDF Consolidado"><i className="fa-solid fa-file-pdf" style={{ color: 'var(--danger)' }} /></button>
                <button className="btn btn-xs btn-ghost" onClick={() => generateRelatorioFrequencia(t.id as string)} data-tooltip="PDF Frequência"><i className="fa-solid fa-calendar-check" style={{ color: 'var(--success)' }} /></button>
                <span className="badge badge-blue">{turmaAlunos.length} alunos</span>
              </div>
            </div>
            <div className="table-scroll"><table className="data-table"><thead><tr><th>Aluno</th>
              {disciplinas.map(d => <th key={d.id as string} className="text-center" style={{ fontSize: '.65rem' }}>{(d.nome as string).slice(0, 4)}</th>)}
              <th className="text-center">Situação</th></tr></thead>
              <tbody>{turmaAlunos.sort((a, b) => String(a.nome).localeCompare(String(b.nome))).map(a => {
                let allAprov = true, hasNota = false;
                return (<tr key={a.id as string}><td style={{ fontWeight: 600, fontSize: '.82rem' }}>{a.nome as string}</td>
                  {disciplinas.map(d => {
                    const nota = notas.find(n => n.alunoId === a.id && n.disciplinaId === d.id);
                    const anual = nota ? getNotaAnual(nota.b1 as number | null, nota.b2 as number | null, nota.b3 as number | null, nota.b4 as number | null) : null;
                    if (anual !== null) { hasNota = true; if (anual < cfg.notaMinima) allAprov = false; }
                    return <td key={d.id as string} className="text-center" style={{ fontSize: '.78rem', fontWeight: 700, color: anual !== null ? (anual >= cfg.notaMinima ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)' }}>{anual !== null ? anual.toFixed(1) : '—'}</td>;
                  })}
                  <td className="text-center">{hasNota ? (allAprov ? <span className="badge badge-green">Aprovado</span> : <span className="badge badge-red">Reprovado</span>) : <span className="badge badge-gray">Pendente</span>}</td>
                </tr>);
              })}</tbody></table></div>
          </div>
        );
      })}
    </PageTransition>
  );
}
