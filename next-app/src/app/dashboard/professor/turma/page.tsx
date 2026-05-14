'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dbGetAll } from '@/lib/data';
import { EmptyState } from '@/components/ui/DashboardUI';

export default function ProfTurma() {
  const turmas = dbGetAll<Record<string, unknown>>('turmas').filter(t => t.ativo);
  const allAlunos = dbGetAll<Record<string, unknown>>('alunos').filter(a => a.ativo);
  const [selTurma, setSelTurma] = useState('');
  const [busca, setBusca] = useState('');

  const alunos = allAlunos.filter(a => a.turmaId === selTurma && (!busca || String(a.nome).toLowerCase().includes(busca.toLowerCase())))
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome)));

  return (
    <>
      <div className="panel-card" style={{ marginBottom: 20 }}>
        <div className="panel-card-body" style={{ padding: '14px 22px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="form-control form-select" style={{ minWidth: 160, flex: 1 }} value={selTurma} onChange={e => setSelTurma(e.target.value)}>
              <option value="">Selecione a turma</option>
              {turmas.map(t => <option key={t.id as string} value={t.id as string}>{t.nome as string} ({allAlunos.filter(a => a.turmaId === t.id).length} alunos)</option>)}
            </select>
            <input type="text" className="form-control" style={{ minWidth: 200, flex: 1 }} placeholder="🔍 Buscar aluno..." value={busca} onChange={e => setBusca(e.target.value)} />
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
                    <td style={{ fontWeight: 600 }}>{a.nome as string}</td>
                    <td>{a.matricula as string || '—'}</td>
                    <td>{a.cpf as string || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : <EmptyState icon="fa-hand-pointer" title={selTurma ? 'Nenhum aluno encontrado' : 'Selecione uma turma'} />}
    </>
  );
}
