// =============================================================
// TYPES.TS — Interfaces TypeScript para todas as coleções
// =============================================================

export interface Escola {
  nome: string;
  nomeAbreviado?: string;
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

export interface EscolaRede {
  id: string;
  slug: string;
  nome: string;
  nomeAbreviado: string;
  codigoINEP: string;
  endereco: string;
  cidade: string;
  estado: string;
  telefone: string;
  email: string;
  diretorNome: string;
  whatsapp: string;
  logomarca: string;
  tipo: 'urbana' | 'rural';
  modalidades: string[];
  turnosFuncionamento: string[];
  capacidade: number;
  anoLetivo: number;
  dependenciaAdm: string;
  localizacaoDiferenciada: string;
  infraestrutura: {
    agua: string;
    esgoto: string;
    energia: string;
    internet: boolean;
    bandaLarga: boolean;
    acessibilidade: boolean;
    quadraEsportiva: boolean;
    biblioteca: boolean;
    laboratorioInformatica: boolean;
    laboratorioCiencias: boolean;
    cozinha: boolean;
    refeitorio: boolean;
    banheiroPNE: boolean;
    salaRecursos: boolean;
  };
  sistemaFechado: boolean;
  dataFechamento: string | null;
  notaMinima: number;
  bimestreAtual: number;
  ativa: boolean;
  criadoEm: string;
}

export interface ModalidadeEnsino {
  id: string;
  codigo: string;
  nome: string;
  registroCargaHoraria: 'manual_diario' | 'grade_fixa';
  cargaHorariaAnualMinima: number;
  diasLetivosMinimos: number;
  usaNotasBimestrais: boolean;
  usaCamposExperiencia: boolean;
  permiteMultisseriada: boolean;
  ativo: boolean;
}

export interface NivelEnsino {
  id: string;
  modalidadeId: string;
  nome: string;
  sigla: string;
  subniveis: string[];
  idadeMinimaMeses: number | null;
  idadeMaximaMeses: number | null;
  dataCorte: string | null;
  ordemExibicao: number;
  ativo: boolean;
}

export interface BlocoTempo {
  inicio: string;
  fim: string;
  atividade: string;
  minutos: number;
}

export interface RegistroCargaHoraria {
  id: string;
  escolaId: string;
  turmaId: string;
  data: string;
  blocos: BlocoTempo[];
  totalMinutos: number;
  professorId: string;
  observacao: string;
  criadoEm: string;
}

export interface DicionarioInep {
  id: string;
  tabela: string;
  codigo: number;
  descricao: string;
  chave: string;
}

export interface Turma {
  id: string;
  nome: string;
  turno: 'manhã' | 'tarde' | 'noite';
  professorId: string;
  disciplinaId: string;
  ativo: boolean;
  // Multi-tenant & INEP additions:
  escolaId?: string;
  modalidadeId?: string;
  nivelEnsinoId?: string;
  serie?: string;
  isMultisseriada?: boolean;
  seriesAgrupadas?: string[];
  isMultietapa?: boolean;
  etapasAgrupadas?: string[];
  isAEE?: boolean;
  tagsAEE?: string[];
  tagsMaterias?: string[];
  codigoCenso?: string;
  capacidadeAlunos?: number;
  ambienteFisico?: string;
  professorIds?: string[];
  cargaHorariaSemanal?: number;
  duracaoAulaMinutos?: number;
}

export interface Professor {
  id: string;
  nome: string;
  email: string;
  disciplinas: string[];
  turmaIds: string[];
  ativo: boolean;
  // Multi-tenant additions:
  escolaId?: string;
}

export interface Disciplina {
  id: string;
  nome: string;
  icone: string;
  cor: string;
  ativo: boolean;
  escolaId?: string;
}

export interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  cpf: string;
  turmaId: string;
  ativo: boolean;
  uid?: string;
  // Multi-tenant & INEP additions:
  escolaId?: string;
  dataNascimento?: string;
  sexo?: 'M' | 'F';
  corRaca?: string;
  codigoINEP?: string | null;
  certidaoNascimento?: string | null;
  necessidadesEspeciais?: string[];
  deficiencia?: string | null;
  transporte?: string;
  zona?: 'urbana' | 'rural';
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
  escolas_rede?: EscolaRede[];
  modalidades_ensino?: ModalidadeEnsino[];
  niveis_ensino?: NivelEnsino[];
  registro_carga_horaria?: RegistroCargaHoraria[];
  dicionario_inep?: DicionarioInep[];
  [key: string]: unknown;
}
