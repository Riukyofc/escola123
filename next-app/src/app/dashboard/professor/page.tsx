'use client';
import { useAuth } from '@/contexts/AuthContext';
import { WelcomeBanner, StatCard, PageTransition } from '@/components/ui/DashboardUI';
import { dbGetAll, getConfig } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { getGreeting } from '@/lib/utils';

export default function ProfessorInicio() {
  useDataRefresh();
  const { session } = useAuth();
  if (!session) return null;
  const cfg = getConfig();
  const turmas = dbGetAll<Record<string, unknown>>('turmas').filter(t => t.ativo);
  const alunos = dbGetAll<Record<string, unknown>>('alunos').filter(a => a.ativo);
  const aee = dbGetAll<Record<string, unknown>>('aee');

  return (
    <PageTransition>
      <WelcomeBanner
        tag="Professor(a)" tagIcon="fa-chalkboard-user"
        name={`${getGreeting()}, ${session.name.split(' ')[0]}!`}
        sub={`${turmas.length} turma(s) · ${cfg.bimestreAtual}º Bimestre`}
        avatar={session.name.charAt(0).toUpperCase()}
        gradient="linear-gradient(135deg,#1e3d7a 0%,#0f2347 45%,#162e5c 100%)"
        stats={[
          { label: 'Turmas', value: turmas.length },
          { label: 'Alunos', value: alunos.length },
          { label: 'Fichas AEE', value: aee.length },
        ]}
      />
      <div className="stats-row stagger-container">
        <StatCard label="Turmas Ativas" value={turmas.length} icon="fa-chalkboard" color="blue" />
        <StatCard label="Alunos" value={alunos.length} icon="fa-user-graduate" color="green" />
        <StatCard label="Bimestre Atual" value={`${cfg.bimestreAtual}º`} icon="fa-calendar" color="amber" />
        <StatCard label="AEE" value={aee.length} icon="fa-heart-pulse" color="purple" />
      </div>
    </PageTransition>
  );
}
