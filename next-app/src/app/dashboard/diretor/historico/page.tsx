'use client';

import { useState } from 'react';
import { dbGetAll, dbFind } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { PageTransition, EmptyState } from '@/components/ui/DashboardUI';
import { formatDate } from '@/lib/utils';
import type { Aluno } from '@/lib/types';

export default function DiretorHistorico() {
  useDataRefresh();

  // Load audit logs and students (for matching IDs)
  const logs = dbGetAll<Record<string, any>>('audit_logs').sort((a, b) => String(b.dataHora || '').localeCompare(String(a.dataHora || '')));
  const alunos = dbGetAll<Aluno>('alunos');

  // Search/filter states
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  // Helper formatting for datetime
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  // Helper action styles
  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('salv') || act.includes('cri') || act.includes('adicion')) {
      return { class: 'badge-green', label: 'Criação / Salvamento' };
    }
    if (act.includes('edit') || act.includes('atualiz') || act.includes('modific')) {
      return { class: 'badge-blue', label: 'Edição' };
    }
    if (act.includes('excl') || act.includes('remov') || act.includes('delet')) {
      return { class: 'badge-red', label: 'Exclusão' };
    }
    return { class: 'badge-gray', label: action };
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const targetStudent = log.alunoId ? alunos.find(a => a.id === log.alunoId)?.nome || '' : '';
    
    const matchesSearch = 
      !search ||
      (log.usuarioId && log.usuarioId.toLowerCase().includes(search.toLowerCase())) ||
      (log.acao && log.acao.toLowerCase().includes(search.toLowerCase())) ||
      (log.detalhe && log.detalhe.toLowerCase().includes(search.toLowerCase())) ||
      targetStudent.toLowerCase().includes(search.toLowerCase());

    const matchesAction = !actionFilter || log.acao.toLowerCase().includes(actionFilter.toLowerCase());

    return matchesSearch && matchesAction;
  });

  return (
    <PageTransition>
      {/* Page Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--blue) 0%, #1e3a8a 100%)',
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
          <i className="fa-solid fa-clock-rotate-left" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Histórico & Auditoria de Registros</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '.85rem', margin: '4px 0 0 0' }}>
            Trilha de auditoria em tempo real detalhando criação, modificações e exclusões efetuadas por usuários da escola.
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="panel-card" style={{ marginBottom: 20 }}>
        <div className="panel-card-body" style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
            
            <div style={{ display: 'flex', gap: 8, flexGrow: 1, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', minWidth: 260 }}>
                <input 
                  className="form-control" 
                  style={{ paddingLeft: 32 }}
                  placeholder="Pesquisar por usuário, ação ou detalhe..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-secondary)' }} />
              </div>

              <select 
                className="form-control form-select"
                style={{ width: 200, background: 'var(--panel-bg)', borderColor: 'var(--border)' }}
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
              >
                <option value="">Todas as Ações</option>
                <option value="salv">Salvar / Criar</option>
                <option value="excl">Excluir / Remover</option>
                <option value="frequencia">Lançar Frequência</option>
                <option value="nota">Lançar Notas</option>
              </select>
            </div>

            <span className="badge badge-outline" style={{ fontWeight: 700 }}>
              {filteredLogs.length} logs registrados
            </span>
          </div>
        </div>
      </div>

      {/* Timeline List of Logs */}
      <div className="panel-card">
        <div className="panel-card-header">
          <div className="panel-card-title"><i className="fa-solid fa-list-ol" /> Histórico Sequencial</div>
        </div>
        
        <div className="panel-card-body" style={{ padding: 20 }}>
          {filteredLogs.length === 0 ? (
            <EmptyState title="Nenhum log encontrado" desc="Não foram registrados eventos que correspondam aos filtros selecionados." icon="fa-timeline" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
              
              {/* Timeline Connector Line */}
              <div style={{
                position: 'absolute',
                left: 20,
                top: 8,
                bottom: 8,
                width: 2,
                background: 'var(--border)',
                zIndex: 0
              }} />

              {filteredLogs.map(log => {
                const badgeInfo = getActionBadge(log.acao);
                const targetStudent = log.alunoId ? alunos.find(a => a.id === log.alunoId) : null;

                return (
                  <div key={log.id} style={{ display: 'flex', gap: 16, position: 'relative', zIndex: 1 }}>
                    
                    {/* Bullet dot */}
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: log.acao.toLowerCase().includes('excl') ? 'rgba(220,38,38,0.1)' : 'var(--body-bg)',
                      border: `2px solid ${log.acao.toLowerCase().includes('excl') ? 'var(--danger)' : 'var(--border)'}`,
                      color: log.acao.toLowerCase().includes('excl') ? 'var(--danger)' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <i className={log.acao.toLowerCase().includes('excl') ? 'fa-solid fa-trash-can' : 'fa-regular fa-clock'} style={{ fontSize: '.9rem' }} />
                    </div>

                    {/* Content Card */}
                    <div style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: 14,
                      flexGrow: 1,
                      boxShadow: 'var(--shadow-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}>
                      
                      {/* Header details */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '.88rem' }}>
                            {log.usuarioId || 'Sistema'}
                          </span>
                          <span className={`badge ${badgeInfo.class}`} style={{ fontSize: '.68rem', fontWeight: 800 }}>
                            {badgeInfo.label}
                          </span>
                        </div>
                        <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {formatDateTime(log.dataHora)}
                        </div>
                      </div>

                      {/* Detail Message */}
                      <p style={{ margin: 0, fontSize: '.82rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                        {log.detalhe}
                      </p>

                      {/* Target student if applicable */}
                      {targetStudent && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: 'var(--body-bg)',
                          padding: '4px 10px',
                          borderRadius: 99,
                          fontSize: '.72rem',
                          alignSelf: 'flex-start',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border)'
                        }}>
                          <i className="fa-solid fa-user-graduate" style={{ color: 'var(--blue)' }} />
                          Ref: <strong style={{ color: 'var(--text-main)' }}>{targetStudent.nome}</strong> (Turma: {targetStudent.turmaId ? targetStudent.turmaId : '—'})
                        </div>
                      )}

                    </div>

                  </div>
                );
              })}

            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
