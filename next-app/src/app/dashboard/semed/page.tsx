'use client';
import { useAuth } from '@/contexts/AuthContext';
import { WelcomeBanner, StatCard, PageTransition } from '@/components/ui/DashboardUI';
import { dbGetAll, getConfig } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { getNotaAnual, formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

const chartCard = {
  padding: '24px',
  background: 'var(--surface)',
  borderRadius: 'var(--r-xl)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-card)',
};

export default function SemedInicio() {
  useDataRefresh();
  const { session } = useAuth();
  if (!session) return null;
  
  const cfg = getConfig();
  const alunos = dbGetAll<Record<string, unknown>>('alunos').filter(a => a.ativo);
  const profs = dbGetAll<Record<string, unknown>>('professores').filter(p => p.ativo);
  const turmas = dbGetAll<Record<string, unknown>>('turmas').filter(t => t.ativo);
  const discs = dbGetAll<Record<string, unknown>>('disciplinas').filter(d => d.ativo);
  const notas = dbGetAll<Record<string, unknown>>('notas');
  const freq = dbGetAll<Record<string, unknown>>('frequencia');
  const repasses = dbGetAll<Record<string, unknown>>('repasses_financeiros');
  const escolas = dbGetAll<Record<string, unknown>>('escolas_rede');

  // ─── Approval rate ───
  let totalAprov = 0, totalRep = 0, totalPend = 0;
  alunos.forEach(a => {
    let ok = true, has = false;
    discs.forEach(d => {
      const nota = notas.find(n => n.alunoId === a.id && n.disciplinaId === d.id);
      if (nota) {
        const anual = getNotaAnual(nota.b1 as number | null, nota.b2 as number | null, nota.b3 as number | null, nota.b4 as number | null);
        if (anual !== null) { has = true; if (anual < cfg.notaMinima) ok = false; }
      }
    });
    if (has) { if (ok) totalAprov++; else totalRep++; } else totalPend++;
  });
  const taxa = totalAprov + totalRep > 0 ? ((totalAprov / (totalAprov + totalRep)) * 100).toFixed(0) : '—';

  // ─── Frequency per turma ───
  const freqPorTurma = turmas.map(t => {
    const turmaFreq = freq.filter(f => f.turmaId === t.id);
    let total = 0, pres = 0;
    turmaFreq.forEach(f => {
      const aulas = (f.aulas as { alunoId: string; status: string }[]) || [];
      aulas.forEach(a => { total++; if (a.status === 'presente') pres++; });
    });
    return total > 0 ? Math.round((pres / total) * 100) : 0;
  });
  const avgFreq = freqPorTurma.length > 0 ? Math.round(freqPorTurma.reduce((a, b) => a + b, 0) / freqPorTurma.length) : 0;

  // ─── Financial total ───
  const totalRepasses = repasses.reduce((s, r) => s + (Number(r.valor) || 0), 0);

  // ─── Alerts ───
  const alerts: { msg: string; type: 'warning' | 'danger' }[] = [];
  turmas.forEach((t, i) => {
    if (freqPorTurma[i] > 0 && freqPorTurma[i] < 75) {
      alerts.push({ msg: `⚠️ ${t.nome}: Frequência abaixo de 75% (${freqPorTurma[i]}%)`, type: 'warning' });
    }
  });
  if (Number(taxa) < 60 && taxa !== '—') {
    alerts.push({ msg: `🚨 Taxa de aprovação abaixo de 60% (${taxa}%)`, type: 'danger' });
  }

  // ─── Charts ───
  const barData = {
    labels: turmas.map(t => t.nome as string),
    datasets: [{
      label: 'Frequência (%)',
      data: freqPorTurma,
      backgroundColor: freqPorTurma.map(v => v < 75 ? 'rgba(220,38,38,0.8)' : 'rgba(5,150,105,0.8)'),
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const doughnutData = {
    labels: ['Aprovados', 'Reprovados', 'Pendentes'],
    datasets: [{
      data: [totalAprov, totalRep, totalPend],
      backgroundColor: ['rgba(5,150,105,0.85)', 'rgba(220,38,38,0.85)', 'rgba(148,163,184,0.5)'],
      borderWidth: 0, spacing: 3,
    }],
  };

  const alunosPorTurma = turmas.map(t => alunos.filter(a => a.turmaId === t.id).length);
  const lineData = {
    labels: turmas.map(t => t.nome as string),
    datasets: [{
      label: 'Alunos por Turma',
      data: alunosPorTurma,
      borderColor: 'rgb(124,58,237)',
      backgroundColor: 'rgba(124,58,237,0.1)',
      borderWidth: 3, fill: true, tension: 0.4,
      pointBackgroundColor: 'rgb(124,58,237)',
      pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 5,
    }],
  };

  return (
    <PageTransition>
      <WelcomeBanner
        tag="Secretaria Municipal de Educação" tagIcon="fa-building-columns"
        name="Painel da SEMED"
        sub="Macrogestão e Indicadores Educacionais · Viana — MA"
        avatar="S"
        gradient="linear-gradient(135deg,#991b1b 0%,#7f1d1d 100%)"
        stats={[
          { label: 'Alunos', value: alunos.length },
          { label: 'Professores', value: profs.length },
          { label: 'Turmas', value: turmas.length },
          { label: 'Aprovação', value: `${taxa}%` },
        ]}
      />

      <div className="stats-row stagger-container" style={{ marginBottom: 20 }}>
        <StatCard label="Alunos na Rede" value={alunos.length} icon="fa-user-graduate" color="blue" />
        <StatCard label="Professores" value={profs.length} icon="fa-chalkboard-user" color="green" />
        <StatCard label="Turmas Ativas" value={turmas.length} icon="fa-chalkboard" color="purple" />
        <StatCard label="Freq. Média" value={`${avgFreq}%`} icon="fa-calendar-check" color="amber" />
        <StatCard label="Escolas" value={escolas.length || 1} icon="fa-school" color="red" />
        <StatCard label="Total Repassado" value={formatCurrency(totalRepasses)} icon="fa-money-bill-wave" color="green" />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <motion.div style={{ marginBottom: 20 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="panel-card">
            <div className="panel-card-header">
              <div className="panel-card-title"><i className="fa-solid fa-triangle-exclamation" /> Alertas Automáticos</div>
              <span className="badge badge-red">{alerts.length}</span>
            </div>
            <div className="panel-card-body">
              {alerts.map((a, i) => (
                <div key={i} style={{
                  padding: '10px 14px', marginBottom: 6,
                  borderRadius: 'var(--r-md)',
                  background: a.type === 'danger' ? 'var(--danger-light)' : 'var(--warning-light)',
                  color: a.type === 'danger' ? 'var(--danger)' : 'var(--warning)',
                  fontWeight: 700, fontSize: '.82rem',
                }}>
                  {a.msg}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: 20 }}>
        <motion.div style={chartCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 style={{ fontSize: '.95rem', fontWeight: 800, marginBottom: 20, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-chart-bar" style={{ color: 'var(--success)' }} />
            Frequência por Turma
          </h3>
          <div style={{ height: '280px' }}>
            <Bar data={barData} options={{
              maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f2347', padding: 12, cornerRadius: 8 } },
              scales: {
                y: { min: 0, max: 100, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { callback: v => `${v}%`, font: { size: 11, weight: 'bold' as const } } },
                x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' as const } } },
              },
            }} />
          </div>
        </motion.div>

        <motion.div style={chartCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 style={{ fontSize: '.95rem', fontWeight: 800, marginBottom: 20, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-chart-pie" style={{ color: 'var(--purple)' }} />
            Situação dos Alunos
          </h3>
          <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <Doughnut data={doughnutData} options={{
              maintainAspectRatio: false, cutout: '72%',
              plugins: {
                legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 12, weight: 'bold' as const } } },
                tooltip: { backgroundColor: '#0f2347', padding: 12, cornerRadius: 8 },
              },
            }} />
            <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text)' }}>{taxa}%</div>
              <div style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Aprovação</div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div style={chartCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h3 style={{ fontSize: '.95rem', fontWeight: 800, marginBottom: 20, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa-solid fa-chart-line" style={{ color: 'var(--purple)' }} />
          Distribuição de Alunos por Turma
        </h3>
        <div style={{ height: '260px' }}>
          <Line data={lineData} options={{
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f2347', padding: 12, cornerRadius: 8 } },
            scales: {
              y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11, weight: 'bold' as const } } },
              x: { grid: { display: false }, ticks: { font: { size: 11, weight: 'bold' as const } } },
            },
          }} />
        </div>
      </motion.div>
    </PageTransition>
  );
}
