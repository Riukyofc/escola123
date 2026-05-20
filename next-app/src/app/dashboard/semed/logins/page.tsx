'use client';

import { useState } from 'react';
import { dbGetAll } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { PageTransition, EmptyState, Modal, showToast } from '@/components/ui/DashboardUI';
import { updateDocument } from '@/lib/actions';

export default function SemedLogins() {
  useDataRefresh();

  // Load Firestore data from cache
  const users = dbGetAll<any>('users');
  const professores = dbGetAll<any>('professores').sort((a: any, b: any) => a.nome.localeCompare(b.nome));
  const alunos = dbGetAll<any>('alunos').sort((a: any, b: any) => a.nome.localeCompare(b.nome));
  const escolas = dbGetAll<any>('escolas_rede').sort((a: any, b: any) => a.nome.localeCompare(b.nome));

  // State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [escolaFilter, setEscolaFilter] = useState('');

  // Editing Modal State
  const [editUser, setEditUser] = useState<any>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [linkedProfId, setLinkedProfId] = useState('');
  const [linkedAlunoId, setLinkedAlunoId] = useState('');
  const [selectedEscolas, setSelectedEscolas] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Helper resolvers
  const getLinkedProfileName = (user: any) => {
    if (user.roles?.includes('professor') && user.professorId) {
      const prof = professores.find(p => p.id === user.professorId);
      return prof ? `👨‍🏫 ${prof.nome} (Docente)` : '⚠️ Docente não encontrado';
    }
    if (user.roles?.includes('aluno') && user.alunoId) {
      const al = alunos.find(a => a.id === user.alunoId);
      return al ? `🎓 ${al.nome} (Aluno)` : '⚠️ Aluno não encontrado';
    }
    if (user.roles?.includes('secretaria')) {
      return '🏢 Gestor SEMED';
    }
    if (user.roles?.includes('diretor')) {
      return '👑 Diretor de Escola';
    }
    return 'Nenhum perfil associado';
  };

  const getEscolasNames = (user: any) => {
    if (user.roles?.includes('secretaria')) return 'Acesso Macro (Toda a Rede)';
    if (!user.escolaIds || user.escolaIds.length === 0) return 'Sem acesso atribuído';
    return user.escolaIds
      .map((eid: string) => {
        const esc = escolas.find(e => e.id === eid);
        return esc ? esc.nomeAbreviado || esc.nome : eid;
      })
      .join(', ');
  };

  // Open Edit Modal
  const handleOpenEdit = (user: any) => {
    setEditUser(user);
    setSelectedRoles(user.roles || []);
    setLinkedProfId(user.professorId || '');
    setLinkedAlunoId(user.alunoId || '');
    setSelectedEscolas(user.escolaIds || []);
  };

  // Save changes
  const handleSaveAccess = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const dataToUpdate: Record<string, any> = {
        roles: selectedRoles,
        escolaIds: selectedRoles.includes('secretaria') ? [] : selectedEscolas,
      };

      if (selectedRoles.includes('professor')) {
        dataToUpdate.professorId = linkedProfId || null;
      } else {
        dataToUpdate.professorId = null;
      }

      if (selectedRoles.includes('aluno')) {
        dataToUpdate.alunoId = linkedAlunoId || null;
      } else {
        dataToUpdate.alunoId = null;
      }

      await updateDocument('users', editUser.id, dataToUpdate);
      showToast(`Permissões de ${editUser.nome} atualizadas com sucesso!`, 'success');
      setEditUser(null);
    } catch (e) {
      console.error(e);
      showToast('Erro ao atualizar permissões do usuário', 'error');
    }
    setSaving(false);
  };

  // Filter list
  const filteredUsers = users.filter((u: any) => {
    const matchesSearch =
      (u.nome || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase());

    const matchesRole = !roleFilter || u.roles?.includes(roleFilter);

    const matchesSchool = !escolaFilter || u.escolaIds?.includes(escolaFilter);

    return matchesSearch && matchesRole && matchesSchool;
  });

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const toggleEscola = (escolaId: string) => {
    setSelectedEscolas(prev =>
      prev.includes(escolaId) ? prev.filter(id => id !== escolaId) : [...prev, escolaId]
    );
  };

  const selectAllSchools = () => {
    setSelectedEscolas(escolas.map((e: any) => e.id));
  };

  const clearAllSchools = () => {
    setSelectedEscolas([]);
  };

  const roleColors: Record<string, string> = {
    secretaria: 'red',
    diretor: 'yellow',
    professor: 'blue',
    aluno: 'green'
  };

  const roleLabels: Record<string, string> = {
    secretaria: 'SEMED',
    diretor: 'Direção',
    professor: 'Professor(a)',
    aluno: 'Aluno'
  };

  return (
    <PageTransition>
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
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
            <i className="fa-solid fa-user-shield" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Controle de Acesso de Logins</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '.85rem', margin: '4px 0 0 0' }}>
              Gerencie permissões, atribua cargos e defina restrições de escolas para os logins do sistema.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div className="stats-row stagger-container" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ padding: 16 }}>
          <div className="stat-card-header">
            <span className="stat-card-label">Logins Cadastrados</span>
            <div className="stat-icon purple"><i className="fa-solid fa-users" /></div>
          </div>
          <div className="stat-num">{users.length}</div>
        </div>
        <div className="stat-card" style={{ padding: 16 }}>
          <div className="stat-card-header">
            <span className="stat-card-label">Professores com Login</span>
            <div className="stat-icon blue"><i className="fa-solid fa-chalkboard-user" /></div>
          </div>
          <div className="stat-num">{users.filter((u: any) => u.roles?.includes('professor')).length}</div>
        </div>
        <div className="stat-card" style={{ padding: 16 }}>
          <div className="stat-card-header">
            <span className="stat-card-label">Diretores</span>
            <div className="stat-icon amber"><i className="fa-solid fa-crown" /></div>
          </div>
          <div className="stat-num">{users.filter((u: any) => u.roles?.includes('diretor')).length}</div>
        </div>
        <div className="stat-card" style={{ padding: 16 }}>
          <div className="stat-card-header">
            <span className="stat-card-label">Gestores SEMED</span>
            <div className="stat-icon red"><i className="fa-solid fa-building-columns" /></div>
          </div>
          <div className="stat-num">{users.filter((u: any) => u.roles?.includes('secretaria')).length}</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="panel-card" style={{ marginBottom: 20 }}>
        <div className="panel-card-body" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, flexGrow: 1, flexWrap: 'wrap' }}>
              <input
                className="form-control"
                style={{ minWidth: 200, flexGrow: 1, background: 'var(--panel-bg)', borderColor: 'var(--border)' }}
                placeholder="Pesquisar por nome ou e-mail..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select
                className="form-control form-select"
                style={{ width: 180, background: 'var(--panel-bg)', borderColor: 'var(--border)' }}
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
              >
                <option value="">Todos os Cargos</option>
                <option value="secretaria">SEMED (Secretaria)</option>
                <option value="diretor">Direção</option>
                <option value="professor">Professor(a)</option>
                <option value="aluno">Aluno</option>
              </select>
              <select
                className="form-control form-select"
                style={{ width: 220, background: 'var(--panel-bg)', borderColor: 'var(--border)' }}
                value={escolaFilter}
                onChange={e => setEscolaFilter(e.target.value)}
              >
                <option value="">Todas as Escolas</option>
                {escolas.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.nomeAbreviado || e.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Spreadsheet grid panel */}
      <div className="panel-card">
        <div className="panel-card-header">
          <div className="panel-card-title">
            <i className="fa-solid fa-list-check" /> Planilha de Contas de Usuário & Cargos
          </div>
          <span className="badge badge-purple">
            {filteredUsers.length} usuários
          </span>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome Completo</th>
                <th>E-mail</th>
                <th>Cargos Atribuídos</th>
                <th>Perfil Vinculado</th>
                <th>Escolas Autorizadas</th>
                <th className="text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      title="Nenhum login encontrado"
                      desc="Tente redefinir a busca ou filtros"
                      icon="fa-user-lock"
                    />
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u: any) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'var(--color-accent-light)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '.78rem'
                        }}>
                          {(u.nome || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{u.nome || 'Sem Nome'}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '.8rem', fontFamily: 'monospace' }}>{u.email}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {u.roles && u.roles.length > 0 ? (
                          u.roles.map((r: string) => (
                            <span key={r} className={`badge badge-${roleColors[r] || 'gray'}`}>
                              {roleLabels[r] || r}
                            </span>
                          ))
                        ) : (
                          <span className="badge badge-outline">Nenhum</span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>
                      {getLinkedProfileName(u)}
                    </td>
                    <td style={{ fontSize: '.78rem', color: 'var(--text-secondary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={getEscolasNames(u)}>
                      {getEscolasNames(u)}
                    </td>
                    <td className="text-right">
                      <button className="btn btn-xs btn-primary" onClick={() => handleOpenEdit(u)}>
                        <i className="fa-solid fa-key" style={{ marginRight: 4 }} /> Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Access Modal */}
      <Modal
        id="edit-access"
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title={editUser ? `Editar Acessos — ${editUser.nome}` : ''}
        icon="fa-users-gear"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setEditUser(null)} disabled={saving}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSaveAccess} disabled={saving}>
              <i className={`fa-solid ${saving ? 'fa-spinner spin' : 'fa-floppy-disk'}`} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </>
        }
      >
        {editUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* User basic info */}
            <div style={{ padding: 12, background: 'var(--body-bg)', borderRadius: 8, fontSize: '.8rem' }}>
              <div><strong>Nome:</strong> {editUser.nome}</div>
              <div style={{ marginTop: 4 }}><strong>E-mail:</strong> {editUser.email}</div>
            </div>

            {/* Roles Section */}
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>1. Atribuir Cargos (Roles)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                {['secretaria', 'diretor', 'professor', 'aluno'].map(r => (
                  <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--body-bg)', borderRadius: 8, cursor: 'pointer', fontSize: '.85rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(r)}
                      onChange={() => toggleRole(r)}
                    />
                    <div>
                      <strong style={{ textTransform: 'capitalize' }}>{roleLabels[r]}</strong>
                      <div style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>
                        {r === 'secretaria' && 'Acesso macro administrativo'}
                        {r === 'diretor' && 'Gestão da escola selecionada'}
                        {r === 'professor' && 'Lançar notas/aulas na turma'}
                        {r === 'aluno' && 'Visualizar boletim e boletim'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Profile Linking Section */}
            {selectedRoles.includes('professor') && (
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>2. Vincular a Perfil de Professor</label>
                <select
                  className="form-control form-select"
                  style={{ marginTop: 6 }}
                  value={linkedProfId}
                  onChange={e => setLinkedProfId(e.target.value)}
                >
                  <option value="">Selecione o perfil do professor correspondente...</option>
                  {professores.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.nome} ({p.email || 'Sem e-mail'})</option>
                  ))}
                </select>
                <p style={{ margin: '4px 0 0 0', fontSize: '.68rem', color: 'var(--text-muted)' }}>
                  Isso permite identificar o professor ao fazer lançamentos e associar suas respectivas turmas.
                </p>
              </div>
            )}

            {selectedRoles.includes('aluno') && (
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>2. Vincular a Perfil de Aluno</label>
                <select
                  className="form-control form-select"
                  style={{ marginTop: 6 }}
                  value={linkedAlunoId}
                  onChange={e => setLinkedAlunoId(e.target.value)}
                >
                  <option value="">Selecione o perfil do aluno correspondente...</option>
                  {alunos.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.nome} (Matrícula: {a.matricula || 'N/D'})</option>
                  ))}
                </select>
                <p style={{ margin: '4px 0 0 0', fontSize: '.68rem', color: 'var(--text-muted)' }}>
                  Isso vincula a conta de login ao boletim do aluno específico.
                </p>
              </div>
            )}

            {/* School Restrictions Section */}
            {!selectedRoles.includes('secretaria') && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>3. Escolas com Acesso Autorizado</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-xs btn-ghost" onClick={selectAllSchools}>Todas</button>
                    <button className="btn btn-xs btn-ghost" onClick={clearAllSchools}>Limpar</button>
                  </div>
                </div>
                <div style={{
                  maxHeight: 180,
                  overflowY: 'auto',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: 8,
                  marginTop: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  {escolas.map((e: any) => (
                    <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '.8rem', background: selectedEscolas.includes(e.id) ? 'var(--blue-light)' : 'transparent' }}>
                      <input
                        type="checkbox"
                        checked={selectedEscolas.includes(e.id)}
                        onChange={() => toggleEscola(e.id)}
                      />
                      <span>{e.nome} ({e.nomeAbreviado || 'Rede'})</span>
                    </label>
                  ))}
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '.68rem', color: 'var(--text-muted)' }}>
                  O usuário só poderá selecionar e visualizar dados das escolas marcadas aqui.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
