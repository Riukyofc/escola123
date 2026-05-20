'use client';

import { useAuth } from '@/contexts/AuthContext';
import { WelcomeBanner, StatCard, PageTransition } from '@/components/ui/DashboardUI';
import { dbGetAllEscola, getConfig } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { getGreeting } from '@/lib/utils';

export default function ProfessorInicio() {
  useDataRefresh();
  const { session } = useAuth();
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
            Seu login (<strong>{session.userData?.email}</strong>) ainda não está associado a um perfil de Professor no banco de dados.
          </p>
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            padding: 16,
            borderRadius: 14,
            fontSize: '.85rem',
            textAlign: 'left',
            border: '1px solid rgba(255,255,255,0.05)',
            marginBottom: 20
          }}>
            <strong style={{ color: '#fbbf24', display: 'block', marginBottom: 6 }}>Como resolver:</strong>
            1. Entre em contato com a <strong>Direção da Escola</strong>.<br />
            2. Solicite que eles entrem no menu <strong>Controle de Acesso</strong>.<br />
            3. Peçam para vincular o seu e-mail ao seu cadastro de professor correspondente.
          </div>
          <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,0.5)' }}>
            ID do Usuário: {session.userData?.uid}
          </div>
        </div>
      </PageTransition>
    );
  }

  const cfg = getConfig();
  const professorDoc = session.user;
  const myTurmaIds = (professorDoc?.turmaIds as string[]) || [];

  // Filter classes & students belonging exclusively to the current teacher
  const turmas = dbGetAllEscola<Record<string, unknown>>('turmas').filter(t => 
    t.ativo && (t.professorId === professorId || (Array.isArray(t.professorIds) && t.professorIds.includes(professorId)) || myTurmaIds.includes(t.id as string))
  );

  const myTurmaIdsSet = new Set(turmas.map(t => t.id as string));

  const alunos = dbGetAllEscola<Record<string, unknown>>('alunos').filter(a => 
    a.ativo && myTurmaIdsSet.has(a.turmaId as string)
  );

  const aee = dbGetAllEscola<Record<string, unknown>>('aee').filter(x =>
    myTurmaIdsSet.has(x.turmaId as string) || x.professorId === professorId
  );

  return (
    <PageTransition>
      <WelcomeBanner
        tag="Professor(a)" tagIcon="fa-chalkboard-user"
        name={`${getGreeting()}, ${session.name.split(' ')[0]}!`}
        sub={`${turmas.length} turma(s) sob sua responsabilidade · ${cfg.bimestreAtual}º Bimestre`}
        avatar={session.name.charAt(0).toUpperCase()}
        gradient="linear-gradient(135deg,#1e3d7a 0%,#0f2347 45%,#162e5c 100%)"
        stats={[
          { label: 'Minhas Turmas', value: turmas.length },
          { label: 'Meus Alunos', value: alunos.length },
          { label: 'Fichas AEE', value: aee.length },
        ]}
      />
      <div className="stats-row stagger-container">
        <StatCard label="Turmas Ativas" value={turmas.length} icon="fa-chalkboard" color="blue" />
        <StatCard label="Meus Alunos" value={alunos.length} icon="fa-user-graduate" color="green" />
        <StatCard label="Bimestre Atual" value={`${cfg.bimestreAtual}º`} icon="fa-calendar" color="amber" />
        <StatCard label="AEE Atendidos" value={aee.length} icon="fa-heart-pulse" color="purple" />
      </div>
    </PageTransition>
  );
}
