'use client';
import { useAuth } from '@/contexts/AuthContext';
import { WelcomeBanner, StatCard, PageTransition } from '@/components/ui/DashboardUI';
import { dbGetAll, dbGetAllEscola, getConfig } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { getNotaAnual } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  Title, Tooltip, Legend, ArcElement, Filler
);

const chartCard = {
  padding: '24px',
  background: 'var(--surface)',
  borderRadius: 'var(--r-xl)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-card)',
};

export default function DiretorInicio() {
  useDataRefresh();
  const { session } = useAuth();
  if (!session) return null;
  const cfg = getConfig();
  const turmas = dbGetAllEscola<Record<string, unknown>>('turmas').filter(t => t.ativo);
  const alunos = dbGetAllEscola<Record<string, unknown>>('alunos').filter(a => a.ativo);
  const profs = dbGetAllEscola<Record<string, unknown>>('professores').filter(p => p.ativo);
  const discs = dbGetAll<Record<string, unknown>>('disciplinas').filter(d => d.ativo);
  const notas = dbGetAllEscola<Record<string, unknown>>('notas');
  const freq = dbGetAllEscola<Record<string, unknown>>('frequencia');

  // ─── Alunos por turma ───
  const alunosPorTurma = turmas.map(t => alunos.filter(a => a.turmaId === t.id).length);

  // ─── Aprovados vs Reprovados ───
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

  // ─── Frequência por turma ───
  const freqPorTurma = turmas.map(t => {
    const turmaFreq = freq.filter(f => f.turmaId === t.id);
    let totalAulas = 0, presencas = 0;
    turmaFreq.forEach(f => {
      const aulas = (f.aulas as { alunoId: string; status: string }[]) || [];
      aulas.forEach(a => { totalAulas++; if (a.status === 'presente') presencas++; });
    });
    return totalAulas > 0 ? Math.round((presencas / totalAulas) * 100) : 0;
  });

  const barData = {
    labels: turmas.map(t => t.nome as string || 'Sem Nome'),
    datasets: [
      {
        label: 'Alunos Matriculados',
        data: alunosPorTurma,
        backgroundColor: turmas.map((_, i) => {
          const colors = ['rgba(37,99,235,0.8)', 'rgba(5,150,105,0.8)', 'rgba(124,58,237,0.8)', 'rgba(245,158,11,0.8)', 'rgba(220,38,38,0.8)'];
          return colors[i % colors.length];
        }),
        borderColor: 'transparent',
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const doughnutData = {
    labels: ['Aprovados', 'Reprovados', 'Pendentes'],
    datasets: [{
      data: [totalAprov, totalRep, totalPend],
      backgroundColor: [
        'rgba(5, 150, 105, 0.85)',
        'rgba(220, 38, 38, 0.85)',
        'rgba(148, 163, 184, 0.5)',
      ],
      borderWidth: 0,
      spacing: 3,
    }],
  };

  const lineData = {
    labels: turmas.map(t => t.nome as string || ''),
    datasets: [{
      label: 'Frequência (%)',
      data: freqPorTurma,
      borderColor: 'rgb(37, 99, 235)',
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: 'rgb(37, 99, 235)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
    }],
  };

  const taxa = totalAprov + totalRep > 0 ? ((totalAprov / (totalAprov + totalRep)) * 100).toFixed(0) : '—';

  return (
    <PageTransition>
      <WelcomeBanner
        tag="Direção" tagIcon="fa-crown"
        name="Painel da Direção"
        sub="Gestão completa da escola"
        avatar={session.name.charAt(0).toUpperCase()}
        gradient="linear-gradient(135deg,#0f2347 0%,#1e3d78 100%)"
        stats={[
          { label: 'Alunos', value: alunos.length },
          { label: 'Turmas', value: turmas.length },
          { label: 'Professores', value: profs.length },
          { label: 'Taxa Aprov.', value: `${taxa}%` },
        ]}
      />

      <div className="stats-row stagger-container" style={{ marginBottom: 28 }}>
        <StatCard label="Alunos Matriculados" value={alunos.length} icon="fa-user-graduate" color="blue" />
        <StatCard label="Turmas Ativas" value={turmas.length} icon="fa-chalkboard" color="green" />
        <StatCard label="Professores" value={profs.length} icon="fa-chalkboard-user" color="purple" />
        <StatCard label="Disciplinas" value={discs.length} icon="fa-layer-group" color="amber" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: 20 }}>
        <motion.div style={chartCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 style={{ fontSize: '.95rem', fontWeight: 800, marginBottom: 20, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-chart-bar" style={{ color: 'var(--secondary)' }} />
            Distribuição por Turma
          </h3>
          <div style={{ height: '280px' }}>
            <Bar data={barData} options={{
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: '#0f2347',
                  padding: 12,
                  cornerRadius: 8,
                  titleFont: { weight: 'bold' },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: 'rgba(0,0,0,0.05)' },
                  ticks: { font: { size: 11, weight: 'bold' as const }, color: 'var(--text-muted)' },
                },
                x: {
                  grid: { display: false },
                  ticks: { font: { size: 11, weight: 'bold' as const }, color: 'var(--text-secondary)' },
                },
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
              maintainAspectRatio: false,
              cutout: '72%',
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 12, weight: 'bold' as const } },
                },
                tooltip: {
                  backgroundColor: '#0f2347', padding: 12, cornerRadius: 8,
                },
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
          <i className="fa-solid fa-chart-line" style={{ color: 'var(--success)' }} />
          Frequência por Turma
        </h3>
        <div style={{ height: '260px' }}>
          <Line data={lineData} options={{
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#0f2347', padding: 12, cornerRadius: 8,
                callbacks: { label: (ctx) => `Frequência: ${ctx.parsed.y}%` },
              },
            },
            scales: {
              y: {
                min: 0, max: 100,
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: { callback: (v) => `${v}%`, font: { size: 11, weight: 'bold' as const }, color: 'var(--text-muted)' },
              },
              x: {
                grid: { display: false },
                ticks: { font: { size: 11, weight: 'bold' as const }, color: 'var(--text-secondary)' },
              },
            },
          }} />
        </div>
      </motion.div>
    </PageTransition>
  );
}
