'use client';

import { useState } from 'react';
import { dbGetAll, dbFind } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { PageTransition, EmptyState, Modal, showToast } from '@/components/ui/DashboardUI';
import type { Aluno, Professor, EscolaRede, Turma } from '@/lib/types';

export default function SemedCadastros() {
  useDataRefresh();

  // Load all global data
  const alunos = dbGetAll<Aluno>('alunos');
  const professores = dbGetAll<Professor>('professores');
  const escolas = dbGetAll<EscolaRede>('escolas_rede');
  const turmas = dbGetAll<Turma>('turmas');

  // Filter & Search states
  const [tab, setTab] = useState<'alunos' | 'funcionarios' | 'filiacoes'>('alunos');
  const [search, setSearch] = useState('');
  const [escolaFilter, setEscolaFilter] = useState('');
  
  // Profile Detail Modals
  const [detailModal, setDetailModal] = useState<any>(null);
  const [detailType, setDetailType] = useState<'aluno' | 'funcionario' | null>(null);

  // Helper resolvers
  const getSchoolName = (escolaId?: string) => {
    if (!escolaId) return 'Global / Não Atribuído';
    const esc = escolas.find(e => e.id === escolaId);
    return esc ? esc.nome : 'Escola Externa';
  };

  const getClassName = (turmaId?: string) => {
    if (!turmaId) return 'Nenhuma';
    const t = turmas.find(x => x.id === turmaId);
    return t ? t.nome : 'Turma Externa';
  };

  // Mock export action
  const handleExport = (format: string) => {
    showToast(`Relatório exportado com sucesso em formato ${format.toUpperCase()}!`, 'success');
  };

  // 1. FILTER ALUNOS
  const filteredAlunos = alunos.filter(a => {
    const classObj = a.turmaId ? turmas.find(t => t.id === a.turmaId) : null;
    const resolvedSchoolId = a.escolaId || classObj?.escolaId;

    const matchesSearch = 
      a.nome.toLowerCase().includes(search.toLowerCase()) ||
      (a.cpf && a.cpf.includes(search)) ||
      (a.matricula && a.matricula.toLowerCase().includes(search.toLowerCase())) ||
      ((a as any).nomeMae && (a as any).nomeMae.toLowerCase().includes(search.toLowerCase())) ||
      ((a as any).nomePai && (a as any).nomePai.toLowerCase().includes(search.toLowerCase()));

    const matchesSchool = !escolaFilter || resolvedSchoolId === escolaFilter;

    return matchesSearch && matchesSchool;
  });

  // 2. FILTER STAFF / TEACHERS
  const filteredStaff = professores.filter(p => {
    const matchesSearch = 
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(search.toLowerCase())) ||
      (p.disciplinas && p.disciplinas.join(', ').toLowerCase().includes(search.toLowerCase()));

    const matchesSchool = !escolaFilter || p.turmaIds?.some(tid => {
      const t = turmas.find(x => x.id === tid);
      return t?.escolaId === escolaFilter;
    }) || (p as any).escolaIds?.includes(escolaFilter);

    return matchesSearch && matchesSchool;
  });

  return (
    <PageTransition>
      {/* Banner / Title Section */}
      <div style={{
        background: 'linear-gradient(135deg, var(--red) 0%, #7f1d1d 100%)',
        borderRadius: 20,
        padding: '24px 30px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        color: '#fff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
            <i className="fa-solid fa-table" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Cadastro Global Unificado</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '.85rem', margin: '4px 0 0 0' }}>
              Base unificada de Alunos, Funcionários e Filiações de todas as Escolas da Rede.
            </p>
          </div>
        </div>
        
        {/* Export options */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => handleExport('excel')}>
            <i className="fa-solid fa-file-excel" /> Excel
          </button>
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => handleExport('csv')}>
            <i className="fa-solid fa-file-csv" /> CSV
          </button>
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => handleExport('pdf')}>
            <i className="fa-solid fa-file-pdf" /> PDF
          </button>
        </div>
      </div>

      {/* Navigation Tabs and Filters */}
      <div className="panel-card" style={{ marginBottom: 20 }}>
        <div className="panel-card-body" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--body-bg)', padding: 4, borderRadius: 'var(--r-md)' }}>
              <button 
                className={`btn btn-sm ${tab === 'alunos' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 'var(--r-sm)' }}
                onClick={() => { setTab('alunos'); setSearch(''); }}
              >
                <i className="fa-solid fa-user-graduate" style={{ marginRight: 6 }} /> Alunos
              </button>
              <button 
                className={`btn btn-sm ${tab === 'funcionarios' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 'var(--r-sm)' }}
                onClick={() => { setTab('funcionarios'); setSearch(''); }}
              >
                <i className="fa-solid fa-chalkboard-user" style={{ marginRight: 6 }} /> Servidores / Professores
              </button>
              <button 
                className={`btn btn-sm ${tab === 'filiacoes' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 'var(--r-sm)' }}
                onClick={() => { setTab('filiacoes'); setSearch(''); }}
              >
                <i className="fa-solid fa-people-roof" style={{ marginRight: 6 }} /> Filiações & Responsáveis
              </button>
            </div>

            {/* Inputs filters */}
            <div style={{ display: 'flex', gap: 8, flexGrow: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <select 
                className="form-control form-select" 
                style={{ minWidth: 200, maxWidth: 300, background: 'var(--panel-bg)', borderColor: 'var(--border)' }}
                value={escolaFilter} 
                onChange={e => setEscolaFilter(e.target.value)}
              >
                <option value="">Todas as Escolas da Rede</option>
                {escolas.map(e => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>

              <div style={{ position: 'relative', width: 250 }}>
                <input
                  className="form-control"
                  style={{ paddingLeft: 34, background: 'var(--panel-bg)', borderColor: 'var(--border)' }}
                  placeholder="Pesquisar registro..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-secondary)', fontSize: '.9rem' }} />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Spreadsheet grid panel */}
      <div className="panel-card">
        <div className="panel-card-header">
          <div className="panel-card-title">
            <i className="fa-solid fa-sheet-plastic" /> Planilha de Registros Educacionais
          </div>
          <span className="badge badge-blue">
            {tab === 'alunos' ? filteredAlunos.length : tab === 'funcionarios' ? filteredStaff.length : filteredAlunos.length} registros
          </span>
        </div>

        <div className="table-scroll">
          {tab === 'alunos' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>INEP / Matrícula</th>
                  <th>CPF</th>
                  <th>Escola de Origem</th>
                  <th>Turma</th>
                  <th>Nome da Mãe</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Ficha</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlunos.length === 0 ? (
                  <tr><td colSpan={8}><EmptyState title="Nenhum aluno encontrado" desc="Tente redefinir a busca ou filtro de escola" icon="fa-user-graduate" /></td></tr>
                ) : (
                  filteredAlunos.map(a => {
                    const classObj = a.turmaId ? turmas.find(t => t.id === a.turmaId) : null;
                    return (
                      <tr key={a.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'var(--blue-light)',
                              color: 'var(--blue)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '.78rem'
                            }}>
                              {a.nome.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{a.nome}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '.8rem', fontFamily: 'monospace' }}>{a.matricula || 'N/D'}</td>
                        <td style={{ fontSize: '.8rem' }}>{a.cpf || '—'}</td>
                        <td style={{ fontSize: '.78rem', color: 'var(--text-secondary)' }}>
                          {getSchoolName(a.escolaId || classObj?.escolaId)}
                        </td>
                        <td>
                          <span className="badge badge-outline">{getClassName(a.turmaId)}</span>
                        </td>
                        <td style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>{(a as any).nomeMae || '—'}</td>
                        <td className="text-center">
                          <span className={`badge badge-${a.ativo ? 'green' : 'gray'}`}>
                            {a.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="text-right">
                          <button className="btn btn-xs btn-ghost" onClick={() => { setDetailModal(a); setDetailType('aluno'); }}>
                            <i className="fa-solid fa-eye" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {tab === 'funcionarios' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Servidor / Docente</th>
                  <th>E-mail</th>
                  <th>Função / Cargo</th>
                  <th>Turmas Atuantes</th>
                  <th>Escolas Vinculadas</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Ficha</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length === 0 ? (
                  <tr><td colSpan={7}><EmptyState title="Nenhum servidor encontrado" desc="Tente redefinir a busca ou filtro de escola" icon="fa-chalkboard-user" /></td></tr>
                ) : (
                  filteredStaff.map(p => {
                    const profClassNames = p.turmaIds && p.turmaIds.length > 0
                      ? p.turmaIds.map(tid => turmas.find(t => t.id === tid)?.nome).filter(Boolean)
                      : [];

                    const profSchools = (p as any).escolaIds && (p as any).escolaIds.length > 0
                      ? (p as any).escolaIds.map((eid: string) => escolas.find(e => e.id === eid)?.nomeAbreviado).filter(Boolean)
                      : [];

                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'var(--purple-light)',
                              color: 'var(--purple)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '.78rem'
                            }}>
                              {p.nome.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.nome}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '.8rem' }}>{p.email || '—'}</td>
                        <td>
                          <span className="badge badge-blue">Docente Regente</span>
                        </td>
                        <td style={{ fontSize: '.78rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {profClassNames.length > 0 ? profClassNames.join(', ') : 'Nenhuma'}
                        </td>
                        <td style={{ fontSize: '.78rem', color: 'var(--text-secondary)' }}>
                          {profSchools.length > 0 ? profSchools.join(', ') : 'Sem vínculo direto'}
                        </td>
                        <td className="text-center">
                          <span className="badge badge-green">Ativo</span>
                        </td>
                        <td className="text-right">
                          <button className="btn btn-xs btn-ghost" onClick={() => { setDetailModal(p); setDetailType('funcionario'); }}>
                            <i className="fa-solid fa-eye" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {tab === 'filiacoes' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Mãe</th>
                  <th>Pai</th>
                  <th>CPF Responsável</th>
                  <th>Telefone / WhatsApp</th>
                  <th>Endereço do Aluno</th>
                  <th>Escola</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlunos.length === 0 ? (
                  <tr><td colSpan={7}><EmptyState title="Nenhuma filiação encontrada" desc="Sem alunos registrados" icon="fa-people-roof" /></td></tr>
                ) : (
                  filteredAlunos.map(a => {
                    const classObj = a.turmaId ? turmas.find(t => t.id === a.turmaId) : null;
                    return (
                      <tr key={a.id}>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{a.nome}</span>
                        </td>
                        <td style={{ fontSize: '.8rem', color: 'var(--text-main)' }}>{(a as any).nomeMae || <span style={{ color: 'var(--text-secondary)' }}>Não informado</span>}</td>
                        <td style={{ fontSize: '.8rem', color: 'var(--text-main)' }}>{(a as any).nomePai || <span style={{ color: 'var(--text-secondary)' }}>Não informado</span>}</td>
                        <td style={{ fontSize: '.8rem' }}>{(a as any).cpfMae || (a as any).cpfPai || '—'}</td>
                        <td style={{ fontSize: '.8rem' }}>
                          <a href={`https://wa.me/55${((a as any).whatsappResponsavel || '9899999999').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--secondary)', textDecoration: 'underline' }}>
                            <i className="fa-brands fa-whatsapp" /> {((a as any).whatsappResponsavel || '(98) 99191-0010')}
                          </a>
                        </td>
                        <td style={{ fontSize: '.78rem', color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {(a as any).endereco || 'Viana - Maranhão'}
                        </td>
                        <td style={{ fontSize: '.78rem', color: 'var(--text-secondary)' }}>
                          {getSchoolName(a.escolaId || classObj?.escolaId)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Global details modal popup */}
      <Modal
        id="detail-view"
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
        title={detailType === 'aluno' ? `Ficha Cadastral do Aluno` : `Ficha Funcional do Servidor`}
        icon={detailType === 'aluno' ? 'fa-user-graduate' : 'fa-chalkboard-user'}
        footer={<button className="btn btn-primary" onClick={() => setDetailModal(null)}>Fechar Ficha</button>}
      >
        {detailModal && detailType === 'aluno' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ textAlign: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--blue-light)',
                color: 'var(--blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.6rem',
                margin: '0 auto 10px auto'
              }}>
                {detailModal.nome.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ margin: 0, fontWeight: 800 }}>{detailModal.nome}</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '.8rem', color: 'var(--text-secondary)' }}>INEP / Matrícula: {detailModal.matricula || 'N/D'}</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '.85rem' }}>
              <div><strong>CPF:</strong> {detailModal.cpf || '—'}</div>
              <div><strong>Nascimento:</strong> {detailModal.dataNascimento || '—'}</div>
              <div><strong>Turma:</strong> {getClassName(detailModal.turmaId)}</div>
              <div><strong>Escola:</strong> {getSchoolName(detailModal.escolaId)}</div>
              
              <div style={{ gridColumn: 'span 2', fontWeight: 700, color: 'var(--secondary)', marginTop: 10, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
                <i className="fa-solid fa-people-roof" /> Informações de Filiação
              </div>
              
              <div style={{ gridColumn: 'span 2' }}><strong>Nome da Mãe:</strong> {detailModal.nomeMae || '—'}</div>
              <div style={{ gridColumn: 'span 2' }}><strong>Nome do Pai:</strong> {detailModal.nomePai || '—'}</div>
              <div><strong>WhatsApp Resp.:</strong> {detailModal.whatsappResponsavel || '—'}</div>
              <div><strong>CPF Resp.:</strong> {detailModal.cpfMae || detailModal.cpfPai || '—'}</div>
              
              <div style={{ gridColumn: 'span 2', fontWeight: 700, color: 'var(--secondary)', marginTop: 10, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
                <i className="fa-solid fa-location-dot" /> Endereço Residencial
              </div>
              <div style={{ gridColumn: 'span 2' }}>{detailModal.endereco || 'Viana, Maranhão'}</div>
            </div>
          </div>
        )}

        {detailModal && detailType === 'funcionario' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ textAlign: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--purple-light)',
                color: 'var(--purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.6rem',
                margin: '0 auto 10px auto'
              }}>
                {detailModal.nome.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ margin: 0, fontWeight: 800 }}>{detailModal.nome}</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '.8rem', color: 'var(--text-secondary)' }}>E-mail: {detailModal.email}</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '.85rem' }}>
              <div><strong>Cargo / Função:</strong> Docente Regente</div>
              <div><strong>Vínculo:</strong> Estatutário (SEMED)</div>
              
              <div style={{ gridColumn: 'span 2', fontWeight: 700, color: 'var(--secondary)', marginTop: 10, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
                <i className="fa-solid fa-book" /> Disciplinas Habilitadas
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                {detailModal.disciplinas && detailModal.disciplinas.length > 0 ? (
                  detailModal.disciplinas.map((dId: string) => {
                    const disc = dbFind<any>('disciplinas', dId);
                    return <span key={dId} className="badge badge-outline" style={{ marginRight: 6 }}>{disc?.nome || dId}</span>;
                  })
                ) : 'Nenhuma habilitada'}
              </div>
              
              <div style={{ gridColumn: 'span 2', fontWeight: 700, color: 'var(--secondary)', marginTop: 10, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
                <i className="fa-solid fa-chalkboard" /> Turmas Vinculadas na Rede
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                {detailModal.turmaIds && detailModal.turmaIds.length > 0 ? (
                  detailModal.turmaIds.map((tid: string) => {
                    const t = dbFind<any>('turmas', tid);
                    const esc = escolas.find(e => e.id === t?.escolaId);
                    return (
                      <div key={tid} style={{ padding: '4px 8px', background: 'var(--body-bg)', borderRadius: 4, marginBottom: 4, fontSize: '.78rem' }}>
                        <strong>{t?.nome || tid}</strong> - {esc?.nome || 'Escola da Rede'} ({t?.turno})
                      </div>
                    );
                  })
                ) : 'Sem turmas vinculadas'}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
