'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dbGetAll, getEscolaAtiva } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { PageTransition, EmptyState, Modal, showToast } from '@/components/ui/DashboardUI';
import { updateDocument } from '@/lib/actions';

export default function DiretorLogins() {
  useDataRefresh();
  const { session } = useAuth();

  // Load Firestore data from cache
  const users = dbGetAll<any>('users');
  const activeSchool = getEscolaAtiva();

  // Filter school-specific profiles for linking
  const professores = dbGetAll<any>('professores')
    .filter((p: any) => p.escolaId === activeSchool || p.escolaIds?.includes(activeSchool))
    .sort((a: any, b: any) => a.nome.localeCompare(b.nome));

  const alunos = dbGetAll<any>('alunos')
    .filter((a: any) => a.escolaId === activeSchool)
    .sort((a: any, b: any) => a.nome.localeCompare(b.nome));

  const escolas = dbGetAll<any>('escolas_rede');
  const activeSchoolObj = escolas.find((e: any) => e.id === activeSchool);
  const activeSchoolName = activeSchoolObj ? activeSchoolObj.nomeAbreviado || activeSchoolObj.nome : 'Minha Escola';

  // State for filtering
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Editing Modal State
  const [editUser, setEditUser] = useState<any>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [linkedProfId, setLinkedProfId] = useState('');
  const [linkedAlunoId, setLinkedAlunoId] = useState('');
  const [saving, setSaving] = useState(false);

  // Filter users to display: those who belong to activeSchool, or have no school assigned (so they can be claimed)
  const filteredUsers = users.filter((u: any) => {
    const isSchoolMatch = u.escolaIds?.includes(activeSchool);
    const hasNoSchool = !u.escolaIds || u.escolaIds.length === 0;
    if (!isSchoolMatch && !hasNoSchool) return false;

    const matchesSearch =
      (u.nome || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase());

    const matchesRole = !roleFilter || u.roles?.includes(roleFilter);

    return matchesSearch && matchesRole;
  });

  // Helpers
  const getLinkedProfileName = (user: any) => {
    if (user.roles?.includes('professor') && user.professorId) {
      const prof = professores.find(p => p.id === user.professorId);
      return prof ? `👨‍🏫 ${prof.nome} (Docente)` : '⚠️ Docente não encontrado / Outra Escola';
    }
    if (user.roles?.includes('aluno') && user.alunoId) {
      const al = alunos.find(a => a.id === user.alunoId);
      return al ? `🎓 ${al.nome} (Aluno)` : '⚠️ Aluno não encontrado / Outra Escola';
    }
    if (user.roles?.includes('secretaria')) {
      return '🏢 Gestor SEMED';
    }
    if (user.roles?.includes('diretor')) {
      return '👑 Diretor de Escola';
    }
    if (user.roles?.includes('coordenador')) {
      return '📝 Coordenação Pedagógica';
    }
    if (user.roles?.includes('vice_diretor')) {
      return '🤝 Vice-Direção';
    }
    return 'Nenhum perfil associado';
  };

  const getEscolaLabel = (user: any) => {
    if (!user.escolaIds || user.escolaIds.length === 0) return 'Sem escola associada';
    if (user.escolaIds.includes(activeSchool)) return activeSchoolName;
    return 'Outra Escola';
  };

  // Open Edit Modal
  const handleOpenEdit = (user: any) => {
    setEditUser(user);
    setSelectedRoles(user.roles || []);
    setLinkedProfId(user.professorId || '');
    setLinkedAlunoId(user.alunoId || '');
  };

  // Toggle roles - Direct role restriction applies (Director cannot change/grant 'diretor' or 'secretaria')
  const handleToggleRole = (role: string) => {
    // Prevent Director from removing or adding higher-level structural roles
    if (role === 'diretor' || role === 'secretaria') {
      showToast('Cargos diretivos e administrativos macro só podem ser alterados pela SEMED.', 'info');
      return;
    }
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  // Save changes
  const handleSaveAccess = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      // Retain structural roles if they already existed
      const isDiretor = editUser.roles?.includes('diretor');
      const isSecretaria = editUser.roles?.includes('secretaria');
      
      const finalRoles = [...selectedRoles];
      if (isDiretor && !finalRoles.includes('diretor')) finalRoles.push('diretor');
      if (isSecretaria && !finalRoles.includes('secretaria')) finalRoles.push('secretaria');

      // Ensure active school is linked to this user
      const schoolIds = [...(editUser.escolaIds || [])];
      if (!schoolIds.includes(activeSchool)) {
        schoolIds.push(activeSchool);
      }

      const dataToUpdate: Record<string, any> = {
        roles: finalRoles,
        escolaIds: schoolIds,
      };

      if (finalRoles.includes('professor')) {
        dataToUpdate.professorId = linkedProfId || null;
      } else {
        dataToUpdate.professorId = null;
      }

      if (finalRoles.includes('aluno')) {
        dataToUpdate.alunoId = linkedAlunoId || null;
      } else {
        dataToUpdate.alunoId = null;
      }

      await updateDocument('users', editUser.id, dataToUpdate);
      showToast(`Acesso de ${editUser.nome} atualizado com sucesso!`, 'success');
      setEditUser(null);
    } catch (e) {
      console.error(e);
      showToast('Erro ao atualizar permissões do usuário.', 'error');
    }
    setSaving(false);
  };

  const handleClaimUser = async (user: any) => {
    try {
      const currentEscolas = [...(user.escolaIds || [])];
      if (!currentEscolas.includes(activeSchool)) {
        currentEscolas.push(activeSchool);
      }
      await updateDocument('users', user.id, { escolaIds: currentEscolas });
      showToast(`Login de ${user.nome} vinculado à sua escola!`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Erro ao vincular login à escola.', 'error');
    }
  };

  const roleColors: Record<string, string> = {
    secretaria: 'red',
    diretor: 'yellow',
    professor: 'blue',
    aluno: 'green',
    coordenador: 'purple',
    vice_diretor: 'amber'
  };

  const roleLabels: Record<string, string> = {
    secretaria: 'SEMED',
    diretor: 'Direção',
    professor: 'Professor(a)',
    aluno: 'Aluno',
    coordenador: 'Coordenador(a)',
    vice_diretor: 'Vice-Diretor(a)'
  };

  if (!session) return null;

  return (
    <PageTransition>
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3d7a 0%, #0f2347 100%)',
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
              Gerencie cargos de professores/alunos da escola <strong>{activeSchoolName}</strong> e vincule seus perfis correspondentes.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div className="stats-row stagger-container" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ padding: 16 }}>
          <div className="stat-card-header">
            <span className="stat-card-label">Total nesta Escola</span>
            <div className="stat-icon blue"><i className="fa-solid fa-users" /></div>
          </div>
          <div className="stat-num">{users.filter((u: any) => u.escolaIds?.includes(activeSchool)).length}</div>
        </div>
        <div className="stat-card" style={{ padding: 16 }}>
          <div className="stat-card-header">
            <span className="stat-card-label">Professores Cadastrados</span>
            <div className="stat-icon purple"><i className="fa-solid fa-chalkboard-user" /></div>
          </div>
          <div className="stat-num">{professores.length}</div>
        </div>
        <div className="stat-card" style={{ padding: 16 }}>
          <div className="stat-card-header">
            <span className="stat-card-label">Professores com Login</span>
            <div className="stat-icon green"><i className="fa-solid fa-link" /></div>
          </div>
          <div className="stat-num">{users.filter((u: any) => u.escolaIds?.includes(activeSchool) && u.roles?.includes('professor')).length}</div>
        </div>
        <div className="stat-card" style={{ padding: 16 }}>
          <div className="stat-card-header">
            <span className="stat-card-label">Alunos com Login</span>
            <div className="stat-icon amber"><i className="fa-solid fa-graduation-cap" /></div>
          </div>
          <div className="stat-num">{users.filter((u: any) => u.escolaIds?.includes(activeSchool) && u.roles?.includes('aluno')).length}</div>
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
                <option value="diretor">Direção</option>
                <option value="vice_diretor">Vice-Direção</option>
                <option value="coordenador">Coordenador(a)</option>
                <option value="professor">Professor(a)</option>
                <option value="aluno">Aluno</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Logins Table */}
      {filteredUsers.length > 0 ? (
        <div className="panel-card">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome / Email</th>
                  <th>Cargos</th>
                  <th>Vínculo no Banco</th>
                  <th>Escola</th>
                  <th style={{ width: 140, textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u: any) => {
                  const hasSchool = u.escolaIds?.includes(activeSchool);
                  return (
                    <tr key={u.id} style={{ opacity: hasSchool ? 1 : 0.75 }}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{u.nome || 'Sem nome'}</div>
                        <div style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {u.roles?.map((r: string) => (
                            <span key={r} className={`badge badge-${roleColors[r] || 'blue'}`}>
                              {roleLabels[r] || r}
                            </span>
                          )) || <span className="badge badge-gray">Nenhum</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '.85rem', fontWeight: 550, color: 'var(--text)' }}>
                          {getLinkedProfileName(u)}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${hasSchool ? 'badge-blue' : 'badge-gray'}`}>
                          {getEscolaLabel(u)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {hasSchool ? (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleOpenEdit(u)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                          >
                            <i className="fa-solid fa-pen-to-square" /> Configurar
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleClaimUser(u)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                          >
                            <i className="fa-solid fa-link" /> Vincular Escola
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState icon="fa-user-slash" title="Nenhum login encontrado" desc="Nenhum login corresponde aos filtros aplicados." />
      )}

      {/* Editing Modal */}
      {editUser && (
        <Modal
          id="login-config-modal"
          title={`Configurar Acesso: ${editUser.nome}`}
          open={true}
          onClose={() => setEditUser(null)}
          footer={
            <div style={{ display: 'flex', gap: 10, justifyContent: 'end', width: '100%' }}>
              <button className="btn btn-outline" onClick={() => setEditUser(null)} disabled={saving}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSaveAccess} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Roles Selection */}
            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>Selecione os Cargos Autorisados</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {['professor', 'aluno', 'vice_diretor', 'coordenador'].map(role => {
                  const checked = selectedRoles.includes(role);
                  return (
                    <label
                      key={role}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        background: checked ? 'rgba(37, 99, 235, 0.08)' : 'var(--panel-bg)',
                        border: '1px solid',
                        borderColor: checked ? 'var(--primary)' : 'var(--border)',
                        borderRadius: 10,
                        cursor: 'pointer',
                        fontWeight: checked ? 600 : 400,
                        transition: 'all 0.2s'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleRole(role)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>{roleLabels[role] || role}</span>
                    </label>
                  );
                })}
              </div>
              {(editUser.roles?.includes('diretor') || editUser.roles?.includes('secretaria')) && (
                <div className="alert alert-info" style={{ marginTop: 10, fontSize: '.78rem' }}>
                  💡 Este usuário possui cargos administrativos globais ({editUser.roles.filter((r: string) => r === 'diretor' || r === 'secretaria').map((r: string) => roleLabels[r]).join(', ')}). Apenas a SEMED pode removê-los.
                </div>
              )}
            </div>

            {/* Profile Link for Teacher */}
            {selectedRoles.includes('professor') && (
              <div>
                <label className="form-label">Associar ao Cadastro de Professor da Escola</label>
                <select
                  className="form-control form-select"
                  value={linkedProfId}
                  onChange={e => setLinkedProfId(e.target.value)}
                  style={{ background: 'var(--panel-bg)', borderColor: 'var(--border)' }}
                >
                  <option value="">Selecione o cadastro...</option>
                  {professores.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} {p.cpf ? `(CPF: ${p.cpf})` : ''}
                    </option>
                  ))}
                </select>
                {professores.length === 0 && (
                  <p style={{ color: 'var(--danger)', fontSize: '.78rem', marginTop: 4 }}>
                    ⚠️ Nenhum professor cadastrado nesta escola. Cadastre o professor na aba de professores antes.
                  </p>
                )}
              </div>
            )}

            {/* Profile Link for Student */}
            {selectedRoles.includes('aluno') && (
              <div>
                <label className="form-label">Associar ao Cadastro de Aluno da Escola</label>
                <select
                  className="form-control form-select"
                  value={linkedAlunoId}
                  onChange={e => setLinkedAlunoId(e.target.value)}
                  style={{ background: 'var(--panel-bg)', borderColor: 'var(--border)' }}
                >
                  <option value="">Selecione o cadastro...</option>
                  {alunos.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.nome} {a.cpf ? `(CPF: ${a.cpf})` : ''}
                    </option>
                  ))}
                </select>
                {alunos.length === 0 && (
                  <p style={{ color: 'var(--danger)', fontSize: '.78rem', marginTop: 4 }}>
                    ⚠️ Nenhum aluno cadastrado nesta escola.
                  </p>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </PageTransition>
  );
}
