'use client';

import { useAuth } from '@/contexts/AuthContext';
import { dbGetAll } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { formatDate } from '@/lib/utils';
import { EmptyState, PageTransition } from '@/components/ui/DashboardUI';

export default function AlunoFrequencia() {
  useDataRefresh();
  const { session } = useAuth();
  if (!session || !session.user) return null;

  const aluno = session.user;
  const freqAll = dbGetAll<Record<string, unknown>>('frequencia').filter(f => f.turmaId === aluno.turmaId);

  let total = 0, presencas = 0, faltas = 0;
  const registros: { data: string; status: string }[] = [];

  freqAll.forEach(f => {
    const aulas = (f.aulas as { alunoId: string; status: string }[]) || [];
    const aula = aulas.find(a => a.alunoId === aluno.id);
    if (aula) {
      total++;
      if (aula.status === 'presente') presencas++;
      else faltas++;
      registros.push({ data: f.data as string, status: aula.status });
    }
  });

  const pct = total > 0 ? ((presencas / total) * 100).toFixed(1) : '0';

  return (
    <PageTransition>
    <div className="panel-card">
      <div className="panel-card-header">
        <div className="panel-card-title"><i className="fa-solid fa-calendar-check" /> Minha Frequência — {aluno.nome as string}</div>
      </div>
      <div className="panel-card-body">
        {/* Summary */}
        <div className="stats-row" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-num" style={{ color: 'var(--secondary)' }}>{total}</div>
            <div className="stat-desc">Total de Aulas</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: 'var(--success)' }}>{presencas}</div>
            <div className="stat-desc">Presenças</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: 'var(--danger)' }}>{faltas}</div>
            <div className="stat-desc">Faltas</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: parseFloat(pct) >= 75 ? 'var(--success)' : 'var(--danger)' }}>{pct}%</div>
            <div className="stat-desc">Frequência</div>
          </div>
        </div>

        {registros.length === 0 ? (
          <EmptyState icon="fa-calendar-days" title="Nenhuma frequência registrada" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Data</th><th className="text-center">Status</th></tr></thead>
              <tbody>
                {registros.sort((a, b) => b.data.localeCompare(a.data)).map((r, i) => (
                  <tr key={i}>
                    <td>{formatDate(r.data)}</td>
                    <td className="text-center">
                      {r.status === 'presente'
                        ? <span className="badge badge-green"><i className="fa-solid fa-check" /> Presente</span>
                        : <span className="badge badge-red"><i className="fa-solid fa-xmark" /> Falta</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
