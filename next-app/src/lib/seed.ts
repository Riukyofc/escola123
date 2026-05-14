// =============================================================
// SEED.TS — Dados padrão (fallback quando Firestore está vazio)
// =============================================================

import type { Config } from './types';

export const SEED: Record<string, unknown> = {
  escola: {
    nome: 'Unidade Escolar Professora Edith Nair Furtado da Silva',
    cidade: 'Viana · Maranhão',
    anoLetivo: 2026,
    logomarca: '',
    whatsapp: '(98) 99999-9999',
    email: 'secretaria@edith.edu.ma.gov.br',
  },

  config: {
    sistemaFechado: false,
    dataFechamento: null,
    notaMinima: 5.0,
    bimestreAtual: 1,
  } satisfies Config,

  turmas: [
    { id: 't01', nome: '1º Ano A', turno: 'manhã', professorId: 'p01', disciplinaId: 'd01', ativo: true },
    { id: 't02', nome: '2º Ano A', turno: 'manhã', professorId: 'p02', disciplinaId: 'd02', ativo: true },
    { id: 't03', nome: '3º Ano A', turno: 'tarde', professorId: 'p03', disciplinaId: 'd03', ativo: true },
    { id: 't04', nome: '4º Ano B', turno: 'tarde', professorId: 'p01', disciplinaId: 'd01', ativo: true },
    { id: 't05', nome: '5º Ano A', turno: 'noite', professorId: 'p02', disciplinaId: 'd01', ativo: true },
  ],

  professores: [
    { id: 'p01', nome: 'Maria das Graças Santos', email: 'maria@escola.edu', disciplinas: ['d01', 'd02'], turmaIds: ['t01', 't04'], ativo: true },
    { id: 'p02', nome: 'José Carlos Ferreira', email: 'jose@escola.edu', disciplinas: ['d02', 'd03'], turmaIds: ['t02', 't05'], ativo: true },
    { id: 'p03', nome: 'Ana Beatriz Oliveira', email: 'ana@escola.edu', disciplinas: ['d03', 'd04'], turmaIds: ['t03'], ativo: true },
  ],

  disciplinas: [
    { id: 'd01', nome: 'Língua Portuguesa', icone: 'fa-book-open', cor: '#ef4444', ativo: true },
    { id: 'd02', nome: 'Matemática', icone: 'fa-calculator', cor: '#3b82f6', ativo: true },
    { id: 'd03', nome: 'Ciências', icone: 'fa-flask', cor: '#10b981', ativo: true },
    { id: 'd04', nome: 'História', icone: 'fa-landmark', cor: '#f59e0b', ativo: true },
    { id: 'd05', nome: 'Geografia', icone: 'fa-earth-americas', cor: '#8b5cf6', ativo: true },
    { id: 'd06', nome: 'Arte', icone: 'fa-palette', cor: '#ec4899', ativo: true },
    { id: 'd07', nome: 'Educação Física', icone: 'fa-futbol', cor: '#f97316', ativo: true },
    { id: 'd08', nome: 'Ensino Religioso', icone: 'fa-star', cor: '#6366f1', ativo: true },
  ],

  alunos: [
    { id: 'a01', nome: 'Ana Carolina Souza', matricula: '2026001', cpf: '111.111.111-11', turmaId: 't01', ativo: true },
    { id: 'a02', nome: 'Bruno Henrique Lima', matricula: '2026002', cpf: '222.222.222-22', turmaId: 't01', ativo: true },
    { id: 'a03', nome: 'Carla Fernanda Costa', matricula: '2026003', cpf: '333.333.333-33', turmaId: 't01', ativo: true },
  ],

  avisos: [
    { id: 'av001', titulo: 'Início do 2º Bimestre', corpo: 'O 2º bimestre começa em 14 de abril. Professores devem entregar planejamentos até 10/04.', tipo: 'info', autoria: 'diretor', dataCriacao: '2026-04-01', turmaId: null, ativo: true },
    { id: 'av002', titulo: 'Reunião de Pais e Mestres', corpo: 'Será realizada no dia 22 de abril às 19h no auditório da escola. A presença é obrigatória.', tipo: 'urgente', autoria: 'diretor', dataCriacao: '2026-04-03', turmaId: null, ativo: true },
    { id: 'av003', titulo: 'Semana Cultural 2026', corpo: 'De 28/04 a 02/05, a escola realizará a Semana Cultural. Professores, preparem suas turmas!', tipo: 'sucesso', autoria: 'diretor', dataCriacao: '2026-04-05', turmaId: null, ativo: true },
  ],

  equipe: [
    { id: 'eq01', nome: 'Mariana Costa', cargo: 'Diretora', descricao: 'Gestão escolar há 12 anos, especialista em administração educacional.', icone: 'fa-crown', cor1: '#d97706', cor2: '#f59e0b', ativo: true, ordem: 1 },
    { id: 'eq02', nome: 'Maria das Graças', cargo: 'Coordenadora Pedagógica', descricao: 'Responsável pelo planejamento pedagógico e formação continuada.', icone: 'fa-chalkboard-user', cor1: '#2563eb', cor2: '#3b82f6', ativo: true, ordem: 2 },
    { id: 'eq03', nome: 'José Carlos', cargo: 'Professor de Matemática', descricao: 'Licenciado em Matemática com pós-graduação em ensino lúdico.', icone: 'fa-book-open', cor1: '#059669', cor2: '#10b981', ativo: true, ordem: 3 },
  ],

  galeria: [
    { id: 'gal01', titulo: 'Sala de Aula', icone: 'fa-chalkboard-user', corFundo1: '#dbeafe', corFundo2: '#bfdbfe', corIcone: '#2563eb', ativo: true, ordem: 1 },
    { id: 'gal02', titulo: 'Educação Física', icone: 'fa-futbol', corFundo1: '#d1fae5', corFundo2: '#a7f3d0', corIcone: '#059669', ativo: true, ordem: 2 },
    { id: 'gal03', titulo: 'Semana Cultural', icone: 'fa-masks-theater', corFundo1: '#fef3c7', corFundo2: '#fde68a', corIcone: '#d97706', ativo: true, ordem: 3 },
  ],

  depoimentos: [
    { id: 'dep01', texto: 'O portal facilitou muito o acompanhamento das notas do meu filho. Agora consigo ver tudo em tempo real!', nome: 'Maria Silva', cargo: 'Mãe de Aluno · 2º Ano A', cor1: '#059669', cor2: '#10b981', ativo: true, ordem: 1 },
    { id: 'dep02', texto: 'O diário digital e o sistema de frequência tornaram minha rotina muito mais organizada como professora.', nome: 'Ana Oliveira', cargo: 'Professora · 3º Ano A', cor1: '#2563eb', cor2: '#3b82f6', ativo: true, ordem: 2 },
    { id: 'dep03', texto: 'Ter acesso às minhas notas e avisos pelo celular é muito prático. A escola está no futuro!', nome: 'Pedro Santos', cargo: 'Aluno · 5º Ano A', cor1: '#d97706', cor2: '#f59e0b', ativo: true, ordem: 3 },
  ],
};
