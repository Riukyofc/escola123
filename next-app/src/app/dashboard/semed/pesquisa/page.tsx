'use client';
import { useState, useMemo } from 'react';
import { WelcomeBanner, PageTransition } from '@/components/ui/DashboardUI';
import { dbGetAll, dbFind } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { motion, AnimatePresence } from 'framer-motion';

export default function PesquisaInteligente() {
  useDataRefresh();
  const [tab, setTab] = useState<'alunos' | 'professores' | 'turmas'>('alunos');
  
  // Search parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentProfession, setParentProfession] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos'); // 'todos', 'ativo', 'inativo'
  const [modalityFilter, setModalityFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  // Modals
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  // Database collections
  const schools = dbGetAll<Record<string, any>>('escolas_rede');
  const classes = dbGetAll<Record<string, any>>('turmas');
  const students = dbGetAll<Record<string, any>>('alunos');
  const staff = dbGetAll<Record<string, any>>('professores');

  // Helper helpers
  const getSchoolName = (schoolId: string) => {
    const s = schools.find(x => x.id === schoolId);
    return s ? (s.nomeAbreviado || s.nome) : 'SEMED';
  };

  const getClassName = (classId: string) => {
    const c = classes.find(x => x.id === classId);
    return c ? c.nome : 'Sem Turma';
  };

  // ─── FILTER LOGIC ───
  const filteredStudents = useMemo(() => {
    return students.filter(a => {
      const classObj = classes.find(c => c.id === a.turmaId);
      const schoolId = a.escolaId || classObj?.escolaId;

      const matchesSearch = !searchQuery || 
        a.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.cpf && a.cpf.includes(searchQuery)) ||
        (a.matricula && a.matricula.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesParent = !parentName ||
        (a.nomeMae && a.nomeMae.toLowerCase().includes(parentName.toLowerCase())) ||
        (a.nomePai && a.nomePai.toLowerCase().includes(parentName.toLowerCase()));

      const matchesProfession = !parentProfession ||
        (a.profissaoMae && a.profissaoMae.toLowerCase().includes(parentProfession.toLowerCase())) ||
        (a.profissaoPai && a.profissaoPai.toLowerCase().includes(parentProfession.toLowerCase()));

      const matchesSchool = !schoolFilter || schoolId === schoolFilter;

      const matchesStatus = statusFilter === 'todos' ||
        (statusFilter === 'ativo' && a.ativo) ||
        (statusFilter === 'inativo' && !a.ativo);

      const matchesModality = !modalityFilter || classObj?.modalidade === modalityFilter;

      const matchesGender = !genderFilter || a.sexo === genderFilter;

      return matchesSearch && matchesParent && matchesProfession && matchesSchool && matchesStatus && matchesModality && matchesGender;
    });
  }, [students, classes, searchQuery, parentName, parentProfession, schoolFilter, statusFilter, modalityFilter, genderFilter]);

  const filteredStaff = useMemo(() => {
    return staff.filter(p => {
      const matchesSearch = !searchQuery ||
        p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.cpf && p.cpf.includes(searchQuery)) ||
        (p.matricula && p.matricula.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSchool = !schoolFilter || 
        p.escolaId === schoolFilter ||
        (p.escolaIds && p.escolaIds.includes(schoolFilter));

      const matchesStatus = statusFilter === 'todos' ||
        (statusFilter === 'ativo' && p.ativo) ||
        (statusFilter === 'inativo' && !p.ativo);

      return matchesSearch && matchesSchool && matchesStatus;
    });
  }, [staff, searchQuery, schoolFilter, statusFilter]);

  const filteredClasses = useMemo(() => {
    return classes.filter(c => {
      const matchesSearch = !searchQuery ||
        c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.turno && c.turno.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSchool = !schoolFilter || c.escolaId === schoolFilter;

      const matchesModality = !modalityFilter || c.modalidade === modalityFilter;

      return matchesSearch && matchesSchool && matchesModality;
    });
  }, [classes, searchQuery, schoolFilter, modalityFilter]);

  // ─── EXPORT FUNCTION ───
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[] = [];
    let filename = '';

    if (tab === 'alunos') {
      headers = ['Matrícula', 'Nome', 'CPF', 'Sexo', 'Nascimento', 'Mãe', 'Profissão Mãe', 'Pai', 'Profissão Pai', 'Escola', 'Turma', 'Status'];
      rows = filteredStudents.map(a => {
        const classObj = classes.find(c => c.id === a.turmaId);
        return [
          a.matricula || '—',
          a.nome,
          a.cpf || '—',
          a.sexo || '—',
          a.nascimento || '—',
          a.nomeMae || '—',
          a.profissaoMae || '—',
          a.nomePai || '—',
          a.profissaoPai || '—',
          getSchoolName(a.escolaId || classObj?.escolaId),
          getClassName(a.turmaId),
          a.ativo ? 'Ativo' : 'Inativo'
        ];
      });
      filename = 'pesquisa_alunos.csv';
    } else if (tab === 'professores') {
      headers = ['Matrícula', 'Nome', 'CPF', 'E-mail', 'Telefone', 'Função', 'Formação', 'Status'];
      rows = filteredStaff.map(p => [
        p.matricula || '—',
        p.nome,
        p.cpf || '—',
        p.email || '—',
        p.telefone || '—',
        p.funcao || '—',
        p.formacao || '—',
        p.ativo ? 'Ativo' : 'Inativo'
      ]);
      filename = 'pesquisa_servidores.csv';
    } else {
      headers = ['Nome da Turma', 'Turno', 'Modalidade', 'Ano Letivo', 'Escola'];
      rows = filteredClasses.map(c => [
        c.nome,
        c.turno || '—',
        c.modalidade || '—',
        c.anoLetivo || '—',
        getSchoolName(c.escolaId)
      ]);
      filename = 'pesquisa_turmas.csv';
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageTransition>
      <WelcomeBanner
        tag="Macrogestão & IA" tagIcon="fa-magnifying-glass"
        name="Pesquisa Inteligente Geral"
        sub="Busca unificada e cruzamento de informações na Rede Municipal de Viana"
        avatar="P"
        gradient="linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)"
        stats={[
          { label: 'Total Alunos', value: students.length },
          { label: 'Total Servidores', value: staff.length },
          { label: 'Total Turmas', value: classes.length },
        ]}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => { setTab('alunos'); setSelectedEntity(null); }}
          className={`btn ${tab === 'alunos' ? 'btn-primary' : 'btn-ghost'}`}
        >
          🎓 Alunos
        </button>
        <button
          onClick={() => { setTab('professores'); setSelectedEntity(null); }}
          className={`btn ${tab === 'professores' ? 'btn-primary' : 'btn-ghost'}`}
        >
          👥 Servidores / Professores
        </button>
        <button
          onClick={() => { setTab('turmas'); setSelectedEntity(null); }}
          className={`btn ${tab === 'turmas' ? 'btn-primary' : 'btn-ghost'}`}
        >
          🏫 Turmas / Salas
        </button>
      </div>

      {/* Filters Sidebar/Grid */}
      <div className="panel-card" style={{ marginBottom: 20 }}>
        <div className="panel-card-header">
          <div className="panel-card-title">
            <i className="fa-solid fa-sliders" /> Painel de Filtros Inteligentes
          </div>
          <button 
            className="btn btn-xs btn-ghost"
            onClick={() => {
              setSearchQuery('');
              setParentName('');
              setParentProfession('');
              setSchoolFilter('');
              setStatusFilter('todos');
              setModalityFilter('');
              setGenderFilter('');
            }}
          >
            Limpar Filtros
          </button>
        </div>
        <div className="panel-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
            {/* Main Search Query */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nome, CPF ou Matrícula</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Pesquisar..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '32px' }}
                />
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }} />
              </div>
            </div>

            {/* School Filter */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Escola da Rede</label>
              <select className="form-control" value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)}>
                <option value="">Todas as Escolas</option>
                {schools.map(s => (
                  <option key={s.id} value={s.id}>{s.nomeAbreviado || s.nome}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status do Vínculo</label>
              <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="todos">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>

            {/* Tab-specific Filters */}
            {tab === 'alunos' && (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nome de Pai ou Mãe</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nome de responsável..."
                    value={parentName}
                    onChange={e => setParentName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Profissão de Pai ou Mã</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Lavrador, Professor..."
                    value={parentProfession}
                    onChange={e => setParentProfession(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Gênero</label>
                  <select className="form-control" value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
                    <option value="">Todos</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
              </>
            )}

            {(tab === 'alunos' || tab === 'turmas') && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Modalidade de Ensino</label>
                <select className="form-control" value={modalityFilter} onChange={e => setModalityFilter(e.target.value)}>
                  <option value="">Todas</option>
                  <option value="mod_infantil">Educação Infantil (Creche/Pré)</option>
                  <option value="mod_fundamental">Ensino Fundamental (1º ao 9º)</option>
                  <option value="mod_eja">EJA (Jovens e Adultos)</option>
                  <option value="mod_medio">Ensino Médio</option>
                  <option value="mod_aee">AEE (Especial)</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results panel */}
      <div className="panel-card">
        <div className="panel-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="panel-card-title">
            <i className="fa-solid fa-list-check" /> Resultados da Busca ({
              tab === 'alunos' ? filteredStudents.length : tab === 'professores' ? filteredStaff.length : filteredClasses.length
            })
          </div>
          <button className="btn btn-sm btn-ghost" onClick={handleExportCSV}>
            <i className="fa-solid fa-file-csv" /> Exportar Planilha (CSV)
          </button>
        </div>
        <div className="panel-card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="data-table">
              {tab === 'alunos' && (
                <>
                  <thead>
                    <tr>
                      <th>Nome Completo</th>
                      <th>Mãe / Responsável</th>
                      <th>Profissão (Mãe/Pai)</th>
                      <th>Escola Ativa</th>
                      <th>Turma</th>
                      <th>Status</th>
                      <th className="text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr><td colSpan={7} className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>Nenhum aluno atende aos filtros definidos.</td></tr>
                    ) : (
                      filteredStudents.map(a => {
                        const classObj = classes.find(c => c.id === a.turmaId);
                        return (
                          <tr key={a.id}>
                            <td>
                              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{a.nome}</span>
                              <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Matrícula: {a.matricula || '—'}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{a.nomeMae || '—'}</div>
                              {a.nomePai && <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Pai: {a.nomePai}</div>}
                            </td>
                            <td>
                              <div style={{ fontSize: '.8rem' }}>{a.profissaoMae || '—'}</div>
                              {a.profissaoPai && <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>Pai: {a.profissaoPai}</div>}
                            </td>
                            <td style={{ fontSize: '.8rem' }}>{getSchoolName(a.escolaId || classObj?.escolaId)}</td>
                            <td><span className="badge badge-outline">{getClassName(a.turmaId)}</span></td>
                            <td>
                              <span className={`badge badge-${a.ativo ? 'green' : 'gray'}`}>
                                {a.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="text-center">
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                <button className="btn btn-xs btn-ghost" onClick={() => setSelectedEntity({ type: 'aluno', data: a })}>
                                  <i className="fa-solid fa-eye" /> Ver
                                </button>
                                {a.whatsappResponsavel && (
                                  <a href={`https://wa.me/55${a.whatsappResponsavel.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="btn btn-xs btn-success" style={{ padding: '4px 8px', borderRadius: 6 }}>
                                    <i className="fa-brands fa-whatsapp" />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </>
              )}

              {tab === 'professores' && (
                <>
                  <thead>
                    <tr>
                      <th>Nome do Servidor</th>
                      <th>CPF / Matrícula</th>
                      <th>E-mail</th>
                      <th>Contato</th>
                      <th>Escola(s)</th>
                      <th>Status</th>
                      <th className="text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.length === 0 ? (
                      <tr><td colSpan={7} className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>Nenhum servidor atende aos filtros definidos.</td></tr>
                    ) : (
                      filteredStaff.map(p => {
                        const profSchools = p.escolaIds && p.escolaIds.length > 0
                          ? p.escolaIds.map((eid: string) => getSchoolName(eid)).join(', ')
                          : getSchoolName(p.escolaId);
                        return (
                          <tr key={p.id}>
                            <td>
                              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.nome}</span>
                              <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{p.funcao || 'Professor'}</div>
                            </td>
                            <td>
                              <div style={{ fontSize: '.8rem' }}>CPF: {p.cpf || '—'}</div>
                              <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Matrícula: {p.matricula || '—'}</div>
                            </td>
                            <td style={{ fontSize: '.8rem' }}>{p.email || '—'}</td>
                            <td style={{ fontSize: '.8rem' }}>{p.telefone || '—'}</td>
                            <td style={{ fontSize: '.78rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {profSchools}
                            </td>
                            <td>
                              <span className={`badge badge-${p.ativo ? 'green' : 'gray'}`}>
                                {p.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="text-center">
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                <button className="btn btn-xs btn-ghost" onClick={() => setSelectedEntity({ type: 'professor', data: p })}>
                                  <i className="fa-solid fa-eye" /> Ver
                                </button>
                                {p.telefone && (
                                  <a href={`https://wa.me/55${p.telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="btn btn-xs btn-success">
                                    <i className="fa-brands fa-whatsapp" />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </>
              )}

              {tab === 'turmas' && (
                <>
                  <thead>
                    <tr>
                      <th>Nome da Turma</th>
                      <th>Modalidade</th>
                      <th>Turno</th>
                      <th>Ano Letivo</th>
                      <th>Escola Vinculada</th>
                      <th>Alunos Matr.</th>
                      <th className="text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClasses.length === 0 ? (
                      <tr><td colSpan={7} className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>Nenhuma turma atende aos filtros.</td></tr>
                    ) : (
                      filteredClasses.map(c => {
                        const count = students.filter(a => a.turmaId === c.id).length;
                        return (
                          <tr key={c.id}>
                            <td style={{ fontWeight: 700 }}>{c.nome}</td>
                            <td>
                              <span className="badge badge-outline">
                                {c.modalidade === 'mod_infantil' ? 'Educação Infantil' : c.modalidade === 'mod_fundamental' ? 'Ensino Fundamental' : 'EJA'}
                              </span>
                            </td>
                            <td>{c.turno}</td>
                            <td>{c.anoLetivo}</td>
                            <td style={{ fontSize: '.8rem' }}>{getSchoolName(c.escolaId)}</td>
                            <td>
                              <strong>{count}</strong> alunos
                            </td>
                            <td className="text-center">
                              <button className="btn btn-xs btn-ghost" onClick={() => setSelectedEntity({ type: 'turma', data: c })}>
                                <i className="fa-solid fa-eye" /> Detalhes
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Expandable modal detail card */}
      <AnimatePresence>
        {selectedEntity && (
          <div className="modal-overlay open" onClick={() => setSelectedEntity(null)}>
            <motion.div 
              className="modal-box" 
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="modal-header">
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>
                  {selectedEntity.type === 'aluno' ? '📝 Ficha do Aluno' : selectedEntity.type === 'professor' ? '👤 Cadastro do Servidor' : '🏫 Detalhes da Turma'}
                </div>
                <button className="btn-close" onClick={() => setSelectedEntity(null)}><i className="fa-solid fa-xmark" /></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                
                {selectedEntity.type === 'aluno' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{selectedEntity.data.nome}</h4>
                      <p style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>Matrícula: {selectedEntity.data.matricula || 'N/A'}</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <strong>CPF:</strong> {selectedEntity.data.cpf || '—'}
                      </div>
                      <div>
                        <strong>Nascimento:</strong> {selectedEntity.data.nascimento || '—'}
                      </div>
                      <div>
                        <strong>Sexo:</strong> {selectedEntity.data.sexo || '—'}
                      </div>
                      <div>
                        <strong>Status:</strong> {selectedEntity.data.ativo ? 'Ativo' : 'Inativo'}
                      </div>
                    </div>

                    <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 'var(--r-md)' }}>
                      <h5 style={{ fontWeight: 800, marginBottom: 8 }}>Vínculos Escolares</h5>
                      <strong>Escola:</strong> {getSchoolName(selectedEntity.data.escolaId || classes.find(c => c.id === selectedEntity.data.turmaId)?.escolaId)}<br />
                      <strong>Turma:</strong> {getClassName(selectedEntity.data.turmaId)}
                    </div>

                    <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 'var(--r-md)' }}>
                      <h5 style={{ fontWeight: 800, marginBottom: 8 }}>Filiação & Responsáveis</h5>
                      <strong>Mãe:</strong> {selectedEntity.data.nomeMae || 'Não cadastrada'}<br />
                      <strong>Profissão Mãe:</strong> {selectedEntity.data.profissaoMae || '—'}<br />
                      {selectedEntity.data.nomePai && (
                        <>
                          <strong>Pai:</strong> {selectedEntity.data.nomePai}<br />
                          <strong>Profissão Pai:</strong> {selectedEntity.data.profissaoPai || '—'}<br />
                        </>
                      )}
                      <strong>WhatsApp Resp:</strong> {selectedEntity.data.whatsappResponsavel || '—'}<br />
                      <strong>Endereço:</strong> {selectedEntity.data.endereco || '—'}
                    </div>
                  </div>
                )}

                {selectedEntity.type === 'professor' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{selectedEntity.data.nome}</h4>
                      <p style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>Função: {selectedEntity.data.funcao || 'Professor(a)'}</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <strong>CPF:</strong> {selectedEntity.data.cpf || '—'}
                      </div>
                      <div>
                        <strong>Matrícula:</strong> {selectedEntity.data.matricula || '—'}
                      </div>
                      <div>
                        <strong>Telefone:</strong> {selectedEntity.data.telefone || '—'}
                      </div>
                      <div>
                        <strong>E-mail:</strong> {selectedEntity.data.email || '—'}
                      </div>
                    </div>

                    <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 'var(--r-md)' }}>
                      <h5 style={{ fontWeight: 800, marginBottom: 8 }}>Formação Acadêmica</h5>
                      {selectedEntity.data.formacao || '—'}
                    </div>

                    <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 'var(--r-md)' }}>
                      <h5 style={{ fontWeight: 800, marginBottom: 8 }}>Atribuição de Turmas</h5>
                      {selectedEntity.data.turmaIds && selectedEntity.data.turmaIds.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {selectedEntity.data.turmaIds.map((tid: string) => (
                            <span key={tid} className="badge badge-outline">{getClassName(tid)}</span>
                          ))}
                        </div>
                      ) : 'Sem turmas atribuídas'}
                    </div>
                  </div>
                )}

                {selectedEntity.type === 'turma' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{selectedEntity.data.nome}</h4>
                      <p style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>Modalidade: {selectedEntity.data.modalidade === 'mod_infantil' ? 'Educação Infantil' : 'Ensino Fundamental'}</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <strong>Turno:</strong> {selectedEntity.data.turno}
                      </div>
                      <div>
                        <strong>Ano Letivo:</strong> {selectedEntity.data.anoLetivo}
                      </div>
                      <div>
                        <strong>Escola:</strong> {getSchoolName(selectedEntity.data.escolaId)}
                      </div>
                    </div>

                    <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 'var(--r-md)' }}>
                      <h5 style={{ fontWeight: 800, marginBottom: 8 }}>Alunos Matriculados ({students.filter(a => a.turmaId === selectedEntity.data.id).length})</h5>
                      <div style={{ maxHeight: 150, overflowY: 'auto', fontSize: '.85rem' }}>
                        {students.filter(a => a.turmaId === selectedEntity.data.id).map(a => (
                          <div key={a.id} style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                            • {a.nome} ({a.ativo ? 'Ativo' : 'Inativo'})
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => setSelectedEntity(null)}>Fechar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
