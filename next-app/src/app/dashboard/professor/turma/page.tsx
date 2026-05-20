'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dbGetAllEscola } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { EmptyState, PageTransition } from '@/components/ui/DashboardUI';

export default function ProfTurma() {
  useDataRefresh();
  const { session } = useAuth();
  const [selTurma, setSelTurma] = useState('');
  const [busca, setBusca] = useState('');

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
            Vincule seu login a um cadastro de Professor na Direção para visualizar suas turmas e alunos.
          </p>
        </div>
      </PageTransition>
    );
  }

  const professorDoc = session.user;
  const myTurmaIds = (professorDoc?.turmaIds as string[]) || [];

  // Filter classes & students belonging exclusively to the current teacher
  const turmas = dbGetAllEscola<Record<string, unknown>>('turmas').filter(t => 
    t.ativo && (t.professorId === professorId || (Array.isArray(t.professorIds) && t.professorIds.includes(professorId)) || myTurmaIds.includes(t.id as string))
  );

  const myTurmaIdsSet = new Set(turmas.map(t => t.id as string));

  const allAlunos = dbGetAllEscola<Record<string, unknown>>('alunos').filter(a => 
    a.ativo && myTurmaIdsSet.has(a.turmaId as string)
  );

  const alunos = allAlunos.filter(a => a.turmaId === selTurma && (!busca || String(a.nome).toLowerCase().includes(busca.toLowerCase())))
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome)));

  return (
    <PageTransition>
      <div className="panel-card" style={{ marginBottom: 20 }}>
        <div className="panel-card-body" style={{ padding: '14px 22px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="form-control form-select" style={{ minWidth: 160, flex: 1, background: 'var(--panel-bg)', borderColor: 'var(--border)' }} value={selTurma} onChange={e => setSelTurma(e.target.value)}>
              <option value="">Selecione a turma</option>
              {turmas.map(t => <option key={t.id as string} value={t.id as string}>{t.nome as string} ({allAlunos.filter(a => a.turmaId === t.id).length} alunos)</option>)}
            </select>
            <input type="text" className="form-control" style={{ minWidth: 200, flex: 1, background: 'var(--panel-bg)', borderColor: 'var(--border)' }} placeholder="🔍 Buscar aluno..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>
      </div>

      {selTurma && alunos.length > 0 ? (
        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-card-title"><i className="fa-solid fa-users" /> Lista de Alunos</div>
            <span className="badge badge-blue">{alunos.length} alunos</span>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Nº</th><th>Nome</th><th>Matrícula</th><th>CPF</th></tr></thead>
              <tbody>
                {alunos.map((a, i) => (
                  <tr key={a.id as string}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{a.nome as string}</td>
                    <td>{a.matricula as string || '—'}</td>
                    <td>{a.cpf as string || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : <EmptyState icon="fa-hand-pointer" title={selTurma ? 'Nenhum aluno encontrado' : 'Selecione uma turma'} />}
    </PageTransition>
  );
}
