'use client';
import { dbGetAll, getConfig } from '@/lib/data';
import { getNotaAnual } from '@/lib/utils';
import { StatCard } from '@/components/ui/DashboardUI';
export default function SemedIndicadores() {
  const cfg = getConfig();
  const alunos = dbGetAll<Record<string, unknown>>('alunos').filter(a => a.ativo);
  const notas = dbGetAll<Record<string, unknown>>('notas');
  const disciplinas = dbGetAll<Record<string, unknown>>('disciplinas').filter(d => d.ativo);
  const ideb = dbGetAll<Record<string, unknown>>('ideb_historico').sort((a, b) => (a.ano as number) - (b.ano as number));

  let aprovados = 0, reprovados = 0;
  alunos.forEach(a => {
    let ok = true, has = false;
    disciplinas.forEach(d => {
      const n = notas.find(x => x.alunoId === a.id && x.disciplinaId === d.id);
      if (n) { const an = getNotaAnual(n.b1 as number | null, n.b2 as number | null, n.b3 as number | null, n.b4 as number | null); if (an !== null) { has = true; if (an < cfg.notaMinima) ok = false; } }
    });
    if (has) { if (ok) aprovados++; else reprovados++; }
  });
  const taxa = aprovados + reprovados > 0 ? ((aprovados / (aprovados + reprovados)) * 100).toFixed(1) : '—';

  return (
    <>
      <div className="stats-row" style={{ marginBottom: 20 }}>
        <StatCard label="Total Alunos" value={alunos.length} icon="fa-user-graduate" color="blue" />
        <StatCard label="Aprovados" value={aprovados} icon="fa-circle-check" color="green" />
        <StatCard label="Reprovados" value={reprovados} icon="fa-circle-xmark" color="red" />
        <StatCard label="Taxa Aprovação" value={`${taxa}%`} icon="fa-chart-line" color="purple" />
      </div>
      {ideb.length > 0 && (
        <div className="panel-card"><div className="panel-card-header"><div className="panel-card-title"><i className="fa-solid fa-chart-line" /> Histórico IDEB</div></div>
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Ano</th><th className="text-center">Nota IDEB</th><th className="text-center">Meta</th></tr></thead>
            <tbody>{ideb.map(i => (<tr key={i.id as string}><td style={{ fontWeight: 700 }}>{i.ano as number}</td>
              <td className="text-center"><span className="badge badge-blue" style={{ fontSize: '0.85rem', fontWeight: 800 }}>{i.nota as number}</span></td>
              <td className="text-center">{i.meta as number || '—'}</td></tr>))}</tbody></table></div></div>
      )}
    </>
  );
}
