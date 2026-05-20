'use client';

import { useState } from 'react';
import { dbGetAll, dbFind } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { saveDocument } from '@/lib/actions';
import { PageTransition, EmptyState, showToast, confirm } from '@/components/ui/DashboardUI';
import { formatDate } from '@/lib/utils';
import type { EscolaRede, Professor, Turma, Disciplina } from '@/lib/types';

export default function SemedPlanejamentos() {
  useDataRefresh();

  // Load datasets
  const diario = dbGetAll<Record<string, any>>('diario').sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')));
  const escolas = dbGetAll<EscolaRede>('escolas_rede');
  const professores = dbGetAll<Professor>('professores');
  const turmas = dbGetAll<Turma>('turmas');
  const disciplinas = dbGetAll<Disciplina>('disciplinas');

  // Filters State
  const [escolaFilter, setEscolaFilter] = useState('');
  const [professorFilter, setProfessorFilter] = useState('');
  const [turmaFilter, setTurmaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Status mappings
  const statusLabels: Record<string, { label: string; badge: string }> = {
    pendente: { label: 'Pendente', badge: 'badge-yellow' },
    aprovado: { label: 'Aprovado', badge: 'badge-green' },
    rejeitado: { label: 'Rejeitado', badge: 'badge-red' },
  };

  // Actions
  const handleUpdateStatus = async (id: string, newStatus: 'aprovado' | 'rejeitado') => {
    const confirmation = await confirm(`Deseja alterar o status deste planejamento para "${newStatus.toUpperCase()}"?`);
    if (!confirmation) return;

    try {
      const record = diario.find(d => d.id === id);
      if (record) {
        await saveDocument('diario', id, { ...record, status: newStatus });
        showToast(`Planejamento ${newStatus === 'aprovado' ? 'aprovado' : 'rejeitado'} com sucesso!`, 'success');
      }
    } catch (err) {
      showToast('Erro ao atualizar planejamento.', 'error');
    }
  };

  // Filter logic
  const filteredDiario = diario.filter(d => {
    const turmaObj = turmas.find(t => t.id === d.turmaId);
    const resolvedSchoolId = turmaObj?.escolaId;

    const matchesSchool = !escolaFilter || resolvedSchoolId === escolaFilter;
    const matchesProfessor = !professorFilter || d.professorId === professorFilter;
    const matchesTurma = !turmaFilter || d.turmaId === turmaFilter;
    const matchesStatus = !statusFilter || d.status === statusFilter;
    
    const matchesSearch = 
      !search || 
      (d.conteudo && d.conteudo.toLowerCase().includes(search.toLowerCase())) ||
      (d.metodologia && d.metodologia.toLowerCase().includes(search.toLowerCase()));

    return matchesSchool && matchesProfessor && matchesTurma && matchesStatus && matchesSearch;
  });

  return (
    <PageTransition>
      {/* Page header banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--purple) 0%, #4c1d95 100%)',
        borderRadius: 20,
        padding: '24px 30px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        color: '#fff'
      }}>
        <div style={{
          width: 52,
          height: 52,
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.4rem'
        }}>
          <i className="fa-solid fa-book-open" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Auditoria Global de Planejamentos</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '.85rem', margin: '4px 0 0 0' }}>
            Acompanhe, revise e aprove os planejamentos de aula e diários de classe preenchidos pelos professores.
          </p>
        </div>
      </div>

      {/* Control panel and filters */}
      <div className="panel-card" style={{ marginBottom: 20 }}>
        <div className="panel-card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            
            {/* Filter School */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '.78rem' }}>Escola</label>
              <select className="form-control form-select animate-fade" value={escolaFilter} onChange={e => { setEscolaFilter(e.target.value); setTurmaFilter(''); }}>
                <option value="">Todas as Escolas</option>
                {escolas.map(esc => (
                  <option key={esc.id} value={esc.id}>{esc.nomeAbreviado || esc.nome}</option>
                ))}
              </select>
            </div>

            {/* Filter Class */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '.78rem' }}>Turma</label>
              <select className="form-control form-select" value={turmaFilter} onChange={e => setTurmaFilter(e.target.value)} disabled={escolaFilter === '' && false}>
                <option value="">Todas as Turmas</option>
                {turmas.filter(t => !escolaFilter || t.escolaId === escolaFilter).map(t => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>

            {/* Filter Teacher */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '.78rem' }}>Professor</label>
              <select className="form-control form-select" value={professorFilter} onChange={e => setProfessorFilter(e.target.value)}>
                <option value="">Todos os Professores</option>
                {professores.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '.78rem' }}>Status</label>
              <select className="form-control form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">Todos os Status</option>
                <option value="pendente">🟡 Pendentes</option>
                <option value="aprovado">🟢 Aprovados</option>
                <option value="rejeitado">🔴 Rejeitados</option>
              </select>
            </div>

            {/* Search content */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '.78rem' }}>Palavra-chave</label>
              <div style={{ position: 'relative' }}>
                <input 
                  className="form-control" 
                  style={{ paddingLeft: 30 }}
                  placeholder="Buscar no conteúdo..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                />
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 10, top: 12, fontSize: '.8rem', color: 'var(--text-secondary)' }} />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Planejamento Log Timeline / Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredDiario.length === 0 ? (
          <div className="panel-card">
            <div className="panel-card-body" style={{ padding: '60px 0' }}>
              <EmptyState title="Nenhum planejamento encontrado" desc="Tente ajustar os filtros ou buscar por outras palavras-chave." icon="fa-book-open" />
            </div>
          </div>
        ) : (
          filteredDiario.map(item => {
            const prof = professores.find(p => p.id === item.professorId);
            const turmaObj = turmas.find(t => t.id === item.turmaId);
            const disc = disciplinas.find(d => d.id === item.disciplinaId);
            const escolaObj = escolas.find(e => e.id === turmaObj?.escolaId);

            const statusInfo = statusLabels[item.status || 'pendente'];

            return (
              <div key={item.id} className="panel-card" style={{ borderLeft: `5px solid ${item.status === 'aprovado' ? 'var(--success)' : item.status === 'rejeitado' ? 'var(--danger)' : 'var(--warning)'}` }}>
                <div className="panel-card-body" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                    
                    {/* Teacher & Metadata header */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        background: 'var(--body-bg)',
                        border: '2px solid var(--border)',
                        color: 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '.9rem'
                      }}>
                        {prof?.nome.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '.92rem' }}>
                          {prof?.nome || 'Docente Externo'}
                        </div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text-secondary)', display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                          <span><i className="fa-solid fa-school" style={{ marginRight: 3 }} /> {escolaObj?.nomeAbreviado || 'Escola da Rede'}</span>
                          <span>·</span>
                          <span><i className="fa-solid fa-chalkboard" style={{ marginRight: 3 }} /> {turmaObj?.nome || 'Turma'}</span>
                          <span>·</span>
                          <span><i className="fa-solid fa-book" style={{ marginRight: 3 }} /> {disc?.nome || 'Componente'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Date and Status actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        <i className="fa-regular fa-calendar" style={{ marginRight: 4 }} />
                        {formatDate(item.data)}
                      </div>
                      <span className={`badge ${statusInfo?.badge || 'badge-gray'}`} style={{ fontWeight: 800 }}>
                        {statusInfo?.label || 'Desconhecido'}
                      </span>
                    </div>

                  </div>

                  {/* Planning Content Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: 'var(--body-bg)', padding: 14, borderRadius: 10, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: '.75rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        Conteúdo Programático / Objeto de Conhecimento
                      </div>
                      <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                        {item.conteudo || 'Nenhum conteúdo programático registrado.'}
                      </p>
                    </div>
                    <div>
                      <div style={{ fontSize: '.75rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        Metodologia & Estratégias Pedagógicas
                      </div>
                      <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                        {item.metodologia || 'Nenhuma metodologia registrada.'}
                      </p>
                    </div>
                  </div>

                  {/* Actions for SEMED Secretary (Approve / Reject) */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    {item.status !== 'rejeitado' && (
                      <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={() => handleUpdateStatus(item.id, 'rejeitado')}>
                        <i className="fa-solid fa-circle-xmark" style={{ marginRight: 6 }} /> Rejeitar Plano
                      </button>
                    )}
                    {item.status !== 'aprovado' && (
                      <button className="btn btn-sm btn-success" onClick={() => handleUpdateStatus(item.id, 'aprovado')}>
                        <i className="fa-solid fa-circle-check" style={{ marginRight: 6 }} /> Aprovar Planejamento
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </PageTransition>
  );
}
