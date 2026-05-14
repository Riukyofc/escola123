// =============================================================
// TYPES.TS — Interfaces TypeScript para todas as coleções
// =============================================================

export interface Escola {
  nome: string;
  cidade: string;
  anoLetivo: number;
  logomarca: string;
  whatsapp: string;
  email: string;
}

export interface Config {
  sistemaFechado: boolean;
  dataFechamento: string | null;
  notaMinima: number;
  bimestreAtual: number;
  senhaProf?: string;
  senhaDir?: string;
}

export interface Turma {
  id: string;
  nome: string;
  turno: 'manhã' | 'tarde' | 'noite';
  professorId: string;
  disciplinaId: string;
  ativo: boolean;
}

export interface Professor {
  id: string;
  nome: string;
  email: string;
  disciplinas: string[];
  turmaIds: string[];
  ativo: boolean;
}

export interface Disciplina {
  id: string;
  nome: string;
  icone: string;
  cor: string;
  ativo: boolean;
}

export interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  cpf: string;
  turmaId: string;
  ativo: boolean;
  uid?: string;
}

export interface Nota {
  id: string;
  alunoId: string;
  disciplinaId: string;
  b1: number | null;
  b2: number | null;
  b3: number | null;
  b4: number | null;
}

export interface Aviso {
  id: string;
  titulo: string;
  corpo: string;
  tipo: 'info' | 'urgente' | 'sucesso' | 'geral';
  autoria: string;
  dataCriacao: string;
  turmaId: string | null;
  ativo: boolean;
}

export interface EquipeMembro {
  id: string;
  nome: string;
  cargo: string;
  descricao: string;
  icone: string;
  cor1: string;
  cor2: string;
  ativo: boolean;
  ordem: number;
}

export interface GaleriaItem {
  id: string;
  titulo: string;
  icone: string;
  corFundo1: string;
  corFundo2: string;
  corIcone: string;
  ativo: boolean;
  ordem: number;
}

export interface Depoimento {
  id: string;
  texto: string;
  nome: string;
  cargo: string;
  cor1: string;
  cor2: string;
  ativo: boolean;
  ordem: number;
}

export interface FrequenciaAula {
  alunoId: string;
  status: 'presente' | 'falta';
}

export interface Frequencia {
  id: string;
  turmaId: string;
  professorId: string;
  data: string;
  aulas: FrequenciaAula[];
}

export interface EventoCalendario {
  id: string;
  titulo: string;
  data: string;
  tipo: string;
  cor: string;
  descricao: string;
}

// Cache type for all collections
export interface DataCache {
  escola: Escola | null;
  config: Config | null;
  turmas: Turma[];
  professores: Professor[];
  disciplinas: Disciplina[];
  alunos: Aluno[];
  notas: Nota[];
  frequencia: Frequencia[];
  avisos: Aviso[];
  equipe: EquipeMembro[];
  galeria: GaleriaItem[];
  depoimentos: Depoimento[];
  eventos_calendario: EventoCalendario[];
  [key: string]: unknown;
}
