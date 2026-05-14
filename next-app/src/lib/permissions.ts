// =============================================================
// PERMISSIONS.TS — RBAC (Role-Based Access Control)
// =============================================================

export type Permission =
  | 'view_dashboard'
  | 'edit_notas'
  | 'view_notas'
  | 'edit_frequencia'
  | 'view_frequencia'
  | 'edit_alunos'
  | 'view_alunos'
  | 'edit_professores'
  | 'view_professores'
  | 'edit_turmas'
  | 'view_turmas'
  | 'edit_config'
  | 'view_config'
  | 'edit_avisos'
  | 'view_avisos'
  | 'edit_calendario'
  | 'view_calendario'
  | 'edit_diario'
  | 'view_diario'
  | 'approve_diario'
  | 'edit_conteudo'
  | 'view_relatorios'
  | 'export_relatorios'
  | 'edit_financeiro'
  | 'view_financeiro'
  | 'edit_escolas'
  | 'view_escolas'
  | 'edit_indicadores'
  | 'view_indicadores'
  | 'edit_circulares'
  | 'view_circulares'
  | 'send_mensagens'
  | 'view_mensagens'
  | 'manage_users'
  | 'view_audit_log';

export type Role =
  | 'aluno'
  | 'professor'
  | 'coordenador'
  | 'vice_diretor'
  | 'diretor'
  | 'secretario_escolar'
  | 'secretaria';

// ─── PERMISSION MAP ──────────────────────────────────
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  aluno: [
    'view_dashboard',
    'view_notas',
    'view_frequencia',
    'view_avisos',
    'view_calendario',
  ],

  professor: [
    'view_dashboard',
    'edit_notas',
    'view_notas',
    'edit_frequencia',
    'view_frequencia',
    'view_alunos',
    'view_avisos',
    'edit_avisos',
    'view_calendario',
    'edit_diario',
    'view_diario',
    'send_mensagens',
    'view_mensagens',
  ],

  coordenador: [
    'view_dashboard',
    'view_notas',
    'view_frequencia',
    'view_alunos',
    'view_professores',
    'view_turmas',
    'view_avisos',
    'edit_avisos',
    'view_calendario',
    'edit_calendario',
    'view_diario',
    'approve_diario',
    'view_relatorios',
    'send_mensagens',
    'view_mensagens',
  ],

  vice_diretor: [
    'view_dashboard',
    'edit_notas',
    'view_notas',
    'edit_frequencia',
    'view_frequencia',
    'edit_alunos',
    'view_alunos',
    'edit_professores',
    'view_professores',
    'edit_turmas',
    'view_turmas',
    'edit_avisos',
    'view_avisos',
    'edit_calendario',
    'view_calendario',
    'view_diario',
    'approve_diario',
    'view_relatorios',
    'export_relatorios',
    'send_mensagens',
    'view_mensagens',
  ],

  diretor: [
    'view_dashboard',
    'edit_notas',
    'view_notas',
    'edit_frequencia',
    'view_frequencia',
    'edit_alunos',
    'view_alunos',
    'edit_professores',
    'view_professores',
    'edit_turmas',
    'view_turmas',
    'edit_config',
    'view_config',
    'edit_avisos',
    'view_avisos',
    'edit_calendario',
    'view_calendario',
    'edit_diario',
    'view_diario',
    'approve_diario',
    'edit_conteudo',
    'view_relatorios',
    'export_relatorios',
    'view_circulares',
    'send_mensagens',
    'view_mensagens',
    'manage_users',
    'view_audit_log',
  ],

  secretario_escolar: [
    'view_dashboard',
    'view_notas',
    'view_frequencia',
    'edit_alunos',
    'view_alunos',
    'view_professores',
    'view_turmas',
    'view_avisos',
    'view_calendario',
    'view_relatorios',
    'export_relatorios',
  ],

  secretaria: [
    'view_dashboard',
    'view_notas',
    'view_frequencia',
    'view_alunos',
    'view_professores',
    'view_turmas',
    'view_config',
    'view_avisos',
    'view_calendario',
    'view_relatorios',
    'export_relatorios',
    'edit_financeiro',
    'view_financeiro',
    'edit_escolas',
    'view_escolas',
    'edit_indicadores',
    'view_indicadores',
    'edit_circulares',
    'view_circulares',
    'manage_users',
    'view_audit_log',
  ],
};

// ─── PERMISSION CHECK ────────────────────────────────
export function hasPermission(role: string, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role as Role];
  if (!perms) return false;
  return perms.includes(permission);
}

export function getPermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role as Role] || [];
}

export function getAllRoles(): { value: Role; label: string }[] {
  return [
    { value: 'aluno', label: 'Aluno' },
    { value: 'professor', label: 'Professor(a)' },
    { value: 'coordenador', label: 'Coordenador(a) Pedagógico(a)' },
    { value: 'vice_diretor', label: 'Vice-Diretor(a)' },
    { value: 'diretor', label: 'Diretor(a)' },
    { value: 'secretario_escolar', label: 'Secretário(a) Escolar' },
    { value: 'secretaria', label: 'SEMED' },
  ];
}

// ─── AUDIT LOG ───────────────────────────────────────
export interface AuditEntry {
  userId: string;
  userName: string;
  action: string;
  target: string;
  timestamp: string;
  details?: string;
}

export function createAuditEntry(userId: string, userName: string, action: string, target: string, details?: string): AuditEntry {
  return {
    userId,
    userName,
    action,
    target,
    timestamp: new Date().toISOString(),
    details,
  };
}
