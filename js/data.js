// =============================================================
// DATA.JS — Plataforma Institucional Escolar
// Firestore + Cache em Memória
// =============================================================

// ─── IN-MEMORY CACHE ──────────────────────────────────────────
// Carregamos tudo do Firestore para a memória no login.
// Leituras são síncronas (do cache). Escritas vão pro Firestore + cache.
const CACHE = {};

// ─── MULTI-TENANT: ESCOLA ATIVA ──────────────────────────────
let ESCOLA_ATIVA = null;

function setEscolaAtiva(escolaId) {
  ESCOLA_ATIVA = escolaId;
  if (typeof FIREBASE_USER !== 'undefined' && FIREBASE_USER) {
    db.collection('users').doc(FIREBASE_USER.uid).set({ escolaAtiva: escolaId }, { merge: true }).catch(e => console.warn('setEscolaAtiva:', e));
  }
  console.log('🏫 Escola ativa:', escolaId);
}

function getEscolaAtiva() { return ESCOLA_ATIVA; }

// Filtra coleção pela escola ativa
function dbGetAllEscola(key) {
  if (!ESCOLA_ATIVA || ESCOLA_ATIVA === 'semed') return dbGetAll(key);
  return dbGetAll(key).filter(item => item.escolaId === ESCOLA_ATIVA || !item.escolaId);
}

// ─── SEED DATA ────────────────────────────────────────────────
const SEED = {

  turmas: [
    { id: 't01', escolaId: 'esc01', nome: '6º Ano A',  turno: 'manhã',  professorId: 'p01', disciplinaId: 'd01',
      modalidadeId: 'mod_fund2', nivelEnsinoId: 'niv_fund2', serie: '6º',
      isMultisseriada: false, seriesAgrupadas: [], isMultietapa: false, etapasAgrupadas: [],
      isAEE: false, tagsAEE: [], professorIds: ['p01'],
      cargaHorariaSemanal: 25, duracaoAulaMinutos: 50, ativo: true },
    { id: 't02', escolaId: 'esc01', nome: '7º Ano A',  turno: 'manhã',  professorId: 'p02', disciplinaId: 'd02',
      modalidadeId: 'mod_fund2', nivelEnsinoId: 'niv_fund2', serie: '7º',
      isMultisseriada: false, seriesAgrupadas: [], isMultietapa: false, etapasAgrupadas: [],
      isAEE: false, tagsAEE: [], professorIds: ['p02'],
      cargaHorariaSemanal: 25, duracaoAulaMinutos: 50, ativo: true },
    { id: 't03', escolaId: 'esc01', nome: '8º Ano A',  turno: 'tarde',  professorId: 'p03', disciplinaId: 'd03',
      modalidadeId: 'mod_fund2', nivelEnsinoId: 'niv_fund2', serie: '8º',
      isMultisseriada: false, seriesAgrupadas: [], isMultietapa: false, etapasAgrupadas: [],
      isAEE: false, tagsAEE: [], professorIds: ['p03'],
      cargaHorariaSemanal: 25, duracaoAulaMinutos: 50, ativo: true },
    { id: 't04', escolaId: 'esc01', nome: '8º Ano B',  turno: 'tarde',  professorId: 'p01', disciplinaId: 'd01',
      modalidadeId: 'mod_fund2', nivelEnsinoId: 'niv_fund2', serie: '8º',
      isMultisseriada: false, seriesAgrupadas: [], isMultietapa: false, etapasAgrupadas: [],
      isAEE: false, tagsAEE: [], professorIds: ['p01'],
      cargaHorariaSemanal: 25, duracaoAulaMinutos: 50, ativo: true },
    { id: 't05', escolaId: 'esc01', nome: '9º Ano A',  turno: 'noite',  professorId: 'p02', disciplinaId: 'd01',
      modalidadeId: 'mod_fund2', nivelEnsinoId: 'niv_fund2', serie: '9º',
      isMultisseriada: false, seriesAgrupadas: [], isMultietapa: false, etapasAgrupadas: [],
      isAEE: false, tagsAEE: [], professorIds: ['p02'],
      cargaHorariaSemanal: 25, duracaoAulaMinutos: 50, ativo: true },
  ],

  professores: [
    { id: 'p01', escolaId: 'esc01', nome: 'Maria das Graças Santos', email: 'maria@escola.edu', disciplinas: ['d01','d02'], turmaIds: ['t01','t04'], ativo: true },
    { id: 'p02', escolaId: 'esc01', nome: 'José Carlos Ferreira',    email: 'jose@escola.edu',  disciplinas: ['d02','d03'], turmaIds: ['t02','t05'], ativo: true },
    { id: 'p03', escolaId: 'esc01', nome: 'Ana Beatriz Oliveira',    email: 'ana@escola.edu',   disciplinas: ['d03','d04'], turmaIds: ['t03'],       ativo: true },
  ],

  disciplinas: [
    { id: 'd01', escolaId: 'esc01', nome: 'Língua Portuguesa', icone: 'fa-book-open',      cor: '#ef4444', ativo: true },
    { id: 'd02', escolaId: 'esc01', nome: 'Matemática',         icone: 'fa-calculator',     cor: '#3b82f6', ativo: true },
    { id: 'd03', escolaId: 'esc01', nome: 'Ciências',           icone: 'fa-flask',          cor: '#10b981', ativo: true },
    { id: 'd04', escolaId: 'esc01', nome: 'História',           icone: 'fa-landmark',       cor: '#f59e0b', ativo: true },
    { id: 'd05', escolaId: 'esc01', nome: 'Geografia',          icone: 'fa-earth-americas', cor: '#8b5cf6', ativo: true },
    { id: 'd06', escolaId: 'esc01', nome: 'Arte',               icone: 'fa-palette',        cor: '#ec4899', ativo: true },
    { id: 'd07', escolaId: 'esc01', nome: 'Educação Física',    icone: 'fa-futbol',         cor: '#f97316', ativo: true },
    { id: 'd08', escolaId: 'esc01', nome: 'Língua Inglesa',     icone: 'fa-language',       cor: '#6366f1', ativo: true },
    { id: 'd09', escolaId: 'esc01', nome: 'Ensino Religioso',   icone: 'fa-star',           cor: '#a855f7', ativo: true },
  ],

  alunos: [
    { id: 'a01', nome: 'Ana Carolina Souza',      matricula: '2026001', cpf: '111.111.111-11', turmaId: 't01', escolaId: 'esc01', ativo: true,
      dataNascimento: '2015-03-22', sexo: 'F', corRaca: 'parda', codigoINEP: null, certidaoNascimento: '123456',
      necessidadesEspeciais: [], deficiencia: null, transporte: 'nenhum', zona: 'urbana' },
    { id: 'a02', nome: 'Bruno Henrique Lima',     matricula: '2026002', cpf: '222.222.222-22', turmaId: 't01', escolaId: 'esc01', ativo: true,
      dataNascimento: '2015-07-15', sexo: 'M', corRaca: 'branca', codigoINEP: null, certidaoNascimento: '234567',
      necessidadesEspeciais: [], deficiencia: null, transporte: 'nenhum', zona: 'urbana' },
    { id: 'a03', nome: 'Carla Fernanda Costa',    matricula: '2026003', cpf: '333.333.333-33', turmaId: 't01', escolaId: 'esc01', ativo: true,
      dataNascimento: '2015-01-10', sexo: 'F', corRaca: 'preta', codigoINEP: null, certidaoNascimento: '345678',
      necessidadesEspeciais: ['baixa_visao'], deficiencia: 'visual', transporte: 'escolar_publico', zona: 'rural' },
    { id: 'a04', nome: 'Diego Martins Pereira',   matricula: '2026004', cpf: '444.444.444-44', turmaId: 't02', escolaId: 'esc01', ativo: true,
      dataNascimento: '2014-11-05', sexo: 'M', corRaca: 'parda', codigoINEP: null, certidaoNascimento: '456789',
      necessidadesEspeciais: [], deficiencia: null, transporte: 'nenhum', zona: 'urbana' },
    { id: 'a05', nome: 'Eduarda Silva Rocha',     matricula: '2026005', cpf: '555.555.555-55', turmaId: 't02', escolaId: 'esc01', ativo: true,
      dataNascimento: '2014-06-20', sexo: 'F', corRaca: 'indigena', codigoINEP: null, certidaoNascimento: '567890',
      necessidadesEspeciais: [], deficiencia: null, transporte: 'nenhum', zona: 'urbana' },
    { id: 'a06', nome: 'Felipe Augusto Nunes',    matricula: '2026006', cpf: '666.666.666-66', turmaId: 't02', escolaId: 'esc01', ativo: true,
      dataNascimento: '2014-09-12', sexo: 'M', corRaca: 'branca', codigoINEP: null, certidaoNascimento: null,
      necessidadesEspeciais: ['autismo'], deficiencia: 'tea', transporte: 'nenhum', zona: 'urbana' },
    { id: 'a07', nome: 'Gabriela Moura Santos',   matricula: '2026007', cpf: '777.777.777-77', turmaId: 't03', escolaId: 'esc01', ativo: true,
      dataNascimento: '2013-04-18', sexo: 'F', corRaca: 'parda', codigoINEP: null, certidaoNascimento: '678901',
      necessidadesEspeciais: [], deficiencia: null, transporte: 'nenhum', zona: 'urbana' },
    { id: 'a08', nome: 'Henrique Barbosa Dias',   matricula: '2026008', cpf: '888.888.888-88', turmaId: 't03', escolaId: 'esc01', ativo: true,
      dataNascimento: '2013-08-25', sexo: 'M', corRaca: 'preta', codigoINEP: null, certidaoNascimento: '789012',
      necessidadesEspeciais: [], deficiencia: null, transporte: 'escolar_publico', zona: 'rural' },
    { id: 'a09', nome: 'Isabela Teixeira Ferraz', matricula: '2026009', cpf: '999.999.999-99', turmaId: 't03', escolaId: 'esc01', ativo: true,
      dataNascimento: '2013-12-02', sexo: 'F', corRaca: 'amarela', codigoINEP: null, certidaoNascimento: '890123',
      necessidadesEspeciais: [], deficiencia: null, transporte: 'nenhum', zona: 'urbana' },
    { id: 'a10', nome: 'João Victor Cruz',         matricula: '2026010', cpf: '100.100.100-10', turmaId: 't04', escolaId: 'esc01', ativo: true,
      dataNascimento: '2012-05-30', sexo: 'M', corRaca: 'parda', codigoINEP: null, certidaoNascimento: '901234',
      necessidadesEspeciais: [], deficiencia: null, transporte: 'nenhum', zona: 'urbana' },
    { id: 'a11', nome: 'Larissa Vieira Alves',    matricula: '2026011', cpf: '110.110.110-11', turmaId: 't04', escolaId: 'esc01', ativo: true,
      dataNascimento: '2012-10-14', sexo: 'F', corRaca: 'branca', codigoINEP: null, certidaoNascimento: null,
      necessidadesEspeciais: [], deficiencia: null, transporte: 'nenhum', zona: 'urbana' },
    { id: 'a12', nome: 'Marcos Paulo Ribeiro',    matricula: '2026012', cpf: '120.120.120-12', turmaId: 't05', escolaId: 'esc01', ativo: true,
      dataNascimento: '2011-02-08', sexo: 'M', corRaca: 'parda', codigoINEP: null, certidaoNascimento: '012345',
      necessidadesEspeciais: ['tdah'], deficiencia: null, transporte: 'nenhum', zona: 'urbana' },
  ],

  notas: [
    { id: 'n001', alunoId: 'a01', disciplinaId: 'd01', b1: 8.5, b2: 7.0, b3: null, b4: null },
    { id: 'n002', alunoId: 'a01', disciplinaId: 'd02', b1: 6.0, b2: 5.5, b3: null, b4: null },
    { id: 'n003', alunoId: 'a02', disciplinaId: 'd01', b1: 9.0, b2: 8.5, b3: null, b4: null },
    { id: 'n004', alunoId: 'a02', disciplinaId: 'd02', b1: 4.0, b2: 5.0, b3: null, b4: null },
    { id: 'n005', alunoId: 'a03', disciplinaId: 'd01', b1: 7.5, b2: 8.0, b3: null, b4: null },
    { id: 'n006', alunoId: 'a03', disciplinaId: 'd02', b1: 6.5, b2: 7.0, b3: null, b4: null },
    { id: 'n007', alunoId: 'a04', disciplinaId: 'd02', b1: 5.0, b2: 6.5, b3: null, b4: null },
    { id: 'n008', alunoId: 'a05', disciplinaId: 'd02', b1: 8.0, b2: 7.5, b3: null, b4: null },
    { id: 'n009', alunoId: 'a06', disciplinaId: 'd02', b1: 3.5, b2: 4.0, b3: null, b4: null },
  ],

  frequencia: [],

  diario: [
    { id: 'di001', turmaId: 't01', professorId: 'p01', data: '2026-03-15', conteudo: 'Aula sobre interpretação de texto — Gêneros textuais', anotacao: 'Turma participativa, boa interação.' },
    { id: 'di002', turmaId: 't01', professorId: 'p01', data: '2026-03-20', conteudo: 'Revisão de ortografia e acentuação', anotacao: 'Dificuldade com paroxítonas.' },
  ],

  atividades: [
    { id: 'at001', turmaId: 't01', professorId: 'p01', titulo: 'Interpretação de Texto — Conto Moderno', descricao: 'Ler o conto e responder às questões de interpretação.', dataPrazo: '2026-04-20', pontos: 10, tipo: 'escrita', dataCriacao: '2026-04-01', ativo: true },
    { id: 'at002', turmaId: 't01', professorId: 'p01', titulo: 'Produção Textual — Diário de Bordo',     descricao: 'Escrever uma página de diário sobre seu cotidiano.', dataPrazo: '2026-04-28', pontos: 10, tipo: 'escrita', dataCriacao: '2026-04-05', ativo: true },
  ],

  aee: [
    { id: 'aee01', alunoId: 'a02', professorId: 'p01', necessidade: 'Dislexia — dificuldade em discriminação de letras similares (b/d, p/q)', planoAtendimento: 'Atividades com fonemas, uso de régua de leitura, mais tempo nas avaliações.', observacoes: 'Evolução positiva no 1º bimestre.', dataCriacao: '2026-02-10' },
    { id: 'aee02', alunoId: 'a06', professorId: 'p02', necessidade: 'TDAH — dificuldade de concentração e hiperatividade', planoAtendimento: 'Atividades curtas e dinâmicas, sentar na frente, reforço positivo.', observacoes: 'Precisa de acompanhamento especializado externo.', dataCriacao: '2026-02-15' },
  ],

  avisos: [
    { id: 'av001', titulo: 'Início do 2º Bimestre', corpo: 'O 2º bimestre começa em 14 de abril. Professores devem entregar planejamentos até 10/04.', tipo: 'info', autoria: 'diretor', dataCriacao: '2026-04-01', turmaId: null, ativo: true },
    { id: 'av002', titulo: 'Reunião de Pais e Mestres', corpo: 'Será realizada no dia 22 de abril às 19h no auditório da escola. A presença é obrigatória.', tipo: 'urgente', autoria: 'diretor', dataCriacao: '2026-04-03', turmaId: null, ativo: true },
    { id: 'av003', titulo: 'Semana Cultural 2026', corpo: 'De 28/04 a 02/05, a escola realizará a Semana Cultural. Professores, preparem suas turmas!', tipo: 'sucesso', autoria: 'diretor', dataCriacao: '2026-04-05', turmaId: null, ativo: true },
  ],

  horarios_aula: [
    { id: 'h001', professorId: 'p01', disciplinaId: 'd01', turmaId: 't01', data: '2026-04-14', quantidadeAulas: 2 },
    { id: 'h002', professorId: 'p02', disciplinaId: 'd02', turmaId: 't02', data: '2026-04-14', quantidadeAulas: 1 },
    { id: 'h003', professorId: 'p03', disciplinaId: 'd03', turmaId: 't03', data: '2026-04-15', quantidadeAulas: 2 },
  ],

  // ─── Grade Horária Semanal (fixa por turma) ──────────────────
  // diaSemana: 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex
  // Distribuição Fund.II: Port 5, Mat 5, Ciênc 3, Hist 3, Geo 3, Arte 1, EdFís 2, Inglês 2, EnsRelig 1 = 25/sem
  grade_horaria: [
    // ── 6º Ano A (t01) ──
    { id:'gh01', turmaId:'t01', diaSemana:1, disciplinaId:'d01', professorId:'p01', qtdAulas:2, ordem:1 },
    { id:'gh02', turmaId:'t01', diaSemana:1, disciplinaId:'d02', professorId:'p02', qtdAulas:2, ordem:2 },
    { id:'gh03', turmaId:'t01', diaSemana:1, disciplinaId:'d07', professorId:'p03', qtdAulas:1, ordem:3 },
    { id:'gh04', turmaId:'t01', diaSemana:2, disciplinaId:'d03', professorId:'p03', qtdAulas:2, ordem:1 },
    { id:'gh05', turmaId:'t01', diaSemana:2, disciplinaId:'d04', professorId:'p01', qtdAulas:2, ordem:2 },
    { id:'gh06', turmaId:'t01', diaSemana:2, disciplinaId:'d09', professorId:'p01', qtdAulas:1, ordem:3 },
    { id:'gh07', turmaId:'t01', diaSemana:3, disciplinaId:'d02', professorId:'p02', qtdAulas:2, ordem:1 },
    { id:'gh08', turmaId:'t01', diaSemana:3, disciplinaId:'d01', professorId:'p01', qtdAulas:2, ordem:2 },
    { id:'gh09', turmaId:'t01', diaSemana:3, disciplinaId:'d06', professorId:'p03', qtdAulas:1, ordem:3 },
    { id:'gh10', turmaId:'t01', diaSemana:4, disciplinaId:'d05', professorId:'p02', qtdAulas:2, ordem:1 },
    { id:'gh11', turmaId:'t01', diaSemana:4, disciplinaId:'d08', professorId:'p02', qtdAulas:2, ordem:2 },
    { id:'gh12', turmaId:'t01', diaSemana:4, disciplinaId:'d04', professorId:'p01', qtdAulas:1, ordem:3 },
    { id:'gh13', turmaId:'t01', diaSemana:5, disciplinaId:'d01', professorId:'p01', qtdAulas:1, ordem:1 },
    { id:'gh14', turmaId:'t01', diaSemana:5, disciplinaId:'d02', professorId:'p02', qtdAulas:1, ordem:2 },
    { id:'gh15', turmaId:'t01', diaSemana:5, disciplinaId:'d03', professorId:'p03', qtdAulas:1, ordem:3 },
    { id:'gh16', turmaId:'t01', diaSemana:5, disciplinaId:'d05', professorId:'p02', qtdAulas:1, ordem:4 },
    { id:'gh17', turmaId:'t01', diaSemana:5, disciplinaId:'d07', professorId:'p03', qtdAulas:1, ordem:5 },
    // ── 7º Ano A (t02) ──
    { id:'gh18', turmaId:'t02', diaSemana:1, disciplinaId:'d02', professorId:'p02', qtdAulas:2, ordem:1 },
    { id:'gh19', turmaId:'t02', diaSemana:1, disciplinaId:'d03', professorId:'p03', qtdAulas:2, ordem:2 },
    { id:'gh20', turmaId:'t02', diaSemana:1, disciplinaId:'d06', professorId:'p03', qtdAulas:1, ordem:3 },
    { id:'gh21', turmaId:'t02', diaSemana:2, disciplinaId:'d01', professorId:'p01', qtdAulas:2, ordem:1 },
    { id:'gh22', turmaId:'t02', diaSemana:2, disciplinaId:'d04', professorId:'p01', qtdAulas:2, ordem:2 },
    { id:'gh23', turmaId:'t02', diaSemana:2, disciplinaId:'d07', professorId:'p03', qtdAulas:1, ordem:3 },
    { id:'gh24', turmaId:'t02', diaSemana:3, disciplinaId:'d05', professorId:'p02', qtdAulas:2, ordem:1 },
    { id:'gh25', turmaId:'t02', diaSemana:3, disciplinaId:'d08', professorId:'p02', qtdAulas:2, ordem:2 },
    { id:'gh26', turmaId:'t02', diaSemana:3, disciplinaId:'d09', professorId:'p01', qtdAulas:1, ordem:3 },
    { id:'gh27', turmaId:'t02', diaSemana:4, disciplinaId:'d01', professorId:'p01', qtdAulas:2, ordem:1 },
    { id:'gh28', turmaId:'t02', diaSemana:4, disciplinaId:'d02', professorId:'p02', qtdAulas:2, ordem:2 },
    { id:'gh29', turmaId:'t02', diaSemana:4, disciplinaId:'d07', professorId:'p03', qtdAulas:1, ordem:3 },
    { id:'gh30', turmaId:'t02', diaSemana:5, disciplinaId:'d01', professorId:'p01', qtdAulas:1, ordem:1 },
    { id:'gh31', turmaId:'t02', diaSemana:5, disciplinaId:'d02', professorId:'p02', qtdAulas:1, ordem:2 },
    { id:'gh32', turmaId:'t02', diaSemana:5, disciplinaId:'d03', professorId:'p03', qtdAulas:1, ordem:3 },
    { id:'gh33', turmaId:'t02', diaSemana:5, disciplinaId:'d04', professorId:'p01', qtdAulas:1, ordem:4 },
    { id:'gh34', turmaId:'t02', diaSemana:5, disciplinaId:'d05', professorId:'p02', qtdAulas:1, ordem:5 },
    // ── 8º Ano A (t03) ──
    { id:'gh35', turmaId:'t03', diaSemana:1, disciplinaId:'d01', professorId:'p01', qtdAulas:2, ordem:1 },
    { id:'gh36', turmaId:'t03', diaSemana:1, disciplinaId:'d05', professorId:'p02', qtdAulas:2, ordem:2 },
    { id:'gh37', turmaId:'t03', diaSemana:1, disciplinaId:'d09', professorId:'p01', qtdAulas:1, ordem:3 },
    { id:'gh38', turmaId:'t03', diaSemana:2, disciplinaId:'d02', professorId:'p02', qtdAulas:2, ordem:1 },
    { id:'gh39', turmaId:'t03', diaSemana:2, disciplinaId:'d03', professorId:'p03', qtdAulas:2, ordem:2 },
    { id:'gh40', turmaId:'t03', diaSemana:2, disciplinaId:'d06', professorId:'p03', qtdAulas:1, ordem:3 },
    { id:'gh41', turmaId:'t03', diaSemana:3, disciplinaId:'d04', professorId:'p01', qtdAulas:2, ordem:1 },
    { id:'gh42', turmaId:'t03', diaSemana:3, disciplinaId:'d08', professorId:'p02', qtdAulas:2, ordem:2 },
    { id:'gh43', turmaId:'t03', diaSemana:3, disciplinaId:'d07', professorId:'p03', qtdAulas:1, ordem:3 },
    { id:'gh44', turmaId:'t03', diaSemana:4, disciplinaId:'d01', professorId:'p01', qtdAulas:2, ordem:1 },
    { id:'gh45', turmaId:'t03', diaSemana:4, disciplinaId:'d02', professorId:'p02', qtdAulas:2, ordem:2 },
    { id:'gh46', turmaId:'t03', diaSemana:4, disciplinaId:'d03', professorId:'p03', qtdAulas:1, ordem:3 },
    { id:'gh47', turmaId:'t03', diaSemana:5, disciplinaId:'d01', professorId:'p01', qtdAulas:1, ordem:1 },
    { id:'gh48', turmaId:'t03', diaSemana:5, disciplinaId:'d02', professorId:'p02', qtdAulas:1, ordem:2 },
    { id:'gh49', turmaId:'t03', diaSemana:5, disciplinaId:'d04', professorId:'p01', qtdAulas:1, ordem:3 },
    { id:'gh50', turmaId:'t03', diaSemana:5, disciplinaId:'d05', professorId:'p02', qtdAulas:1, ordem:4 },
    { id:'gh51', turmaId:'t03', diaSemana:5, disciplinaId:'d07', professorId:'p03', qtdAulas:1, ordem:5 },
    // ── 8º Ano B (t04) ──
    { id:'gh52', turmaId:'t04', diaSemana:1, disciplinaId:'d03', professorId:'p03', qtdAulas:2, ordem:1 },
    { id:'gh53', turmaId:'t04', diaSemana:1, disciplinaId:'d04', professorId:'p01', qtdAulas:2, ordem:2 },
    { id:'gh54', turmaId:'t04', diaSemana:1, disciplinaId:'d08', professorId:'p02', qtdAulas:1, ordem:3 },
    { id:'gh55', turmaId:'t04', diaSemana:2, disciplinaId:'d01', professorId:'p01', qtdAulas:2, ordem:1 },
    { id:'gh56', turmaId:'t04', diaSemana:2, disciplinaId:'d02', professorId:'p02', qtdAulas:2, ordem:2 },
    { id:'gh57', turmaId:'t04', diaSemana:2, disciplinaId:'d09', professorId:'p01', qtdAulas:1, ordem:3 },
    { id:'gh58', turmaId:'t04', diaSemana:3, disciplinaId:'d01', professorId:'p01', qtdAulas:2, ordem:1 },
    { id:'gh59', turmaId:'t04', diaSemana:3, disciplinaId:'d05', professorId:'p02', qtdAulas:2, ordem:2 },
    { id:'gh60', turmaId:'t04', diaSemana:3, disciplinaId:'d07', professorId:'p03', qtdAulas:1, ordem:3 },
    { id:'gh61', turmaId:'t04', diaSemana:4, disciplinaId:'d02', professorId:'p02', qtdAulas:2, ordem:1 },
    { id:'gh62', turmaId:'t04', diaSemana:4, disciplinaId:'d06', professorId:'p03', qtdAulas:1, ordem:2 },
    { id:'gh63', turmaId:'t04', diaSemana:4, disciplinaId:'d04', professorId:'p01', qtdAulas:1, ordem:3 },
    { id:'gh64', turmaId:'t04', diaSemana:4, disciplinaId:'d08', professorId:'p02', qtdAulas:1, ordem:4 },
    { id:'gh65', turmaId:'t04', diaSemana:5, disciplinaId:'d01', professorId:'p01', qtdAulas:1, ordem:1 },
    { id:'gh66', turmaId:'t04', diaSemana:5, disciplinaId:'d02', professorId:'p02', qtdAulas:1, ordem:2 },
    { id:'gh67', turmaId:'t04', diaSemana:5, disciplinaId:'d03', professorId:'p03', qtdAulas:1, ordem:3 },
    { id:'gh68', turmaId:'t04', diaSemana:5, disciplinaId:'d05', professorId:'p02', qtdAulas:1, ordem:4 },
    { id:'gh69', turmaId:'t04', diaSemana:5, disciplinaId:'d07', professorId:'p03', qtdAulas:1, ordem:5 },
    // ── 9º Ano A (t05) ──
    { id:'gh70', turmaId:'t05', diaSemana:1, disciplinaId:'d02', professorId:'p02', qtdAulas:2, ordem:1 },
    { id:'gh71', turmaId:'t05', diaSemana:1, disciplinaId:'d04', professorId:'p01', qtdAulas:2, ordem:2 },
    { id:'gh72', turmaId:'t05', diaSemana:1, disciplinaId:'d06', professorId:'p03', qtdAulas:1, ordem:3 },
    { id:'gh73', turmaId:'t05', diaSemana:2, disciplinaId:'d01', professorId:'p01', qtdAulas:2, ordem:1 },
    { id:'gh74', turmaId:'t05', diaSemana:2, disciplinaId:'d05', professorId:'p02', qtdAulas:2, ordem:2 },
    { id:'gh75', turmaId:'t05', diaSemana:2, disciplinaId:'d07', professorId:'p03', qtdAulas:1, ordem:3 },
    { id:'gh76', turmaId:'t05', diaSemana:3, disciplinaId:'d02', professorId:'p02', qtdAulas:2, ordem:1 },
    { id:'gh77', turmaId:'t05', diaSemana:3, disciplinaId:'d03', professorId:'p03', qtdAulas:2, ordem:2 },
    { id:'gh78', turmaId:'t05', diaSemana:3, disciplinaId:'d09', professorId:'p01', qtdAulas:1, ordem:3 },
    { id:'gh79', turmaId:'t05', diaSemana:4, disciplinaId:'d01', professorId:'p01', qtdAulas:2, ordem:1 },
    { id:'gh80', turmaId:'t05', diaSemana:4, disciplinaId:'d08', professorId:'p02', qtdAulas:2, ordem:2 },
    { id:'gh81', turmaId:'t05', diaSemana:4, disciplinaId:'d04', professorId:'p01', qtdAulas:1, ordem:3 },
    { id:'gh82', turmaId:'t05', diaSemana:5, disciplinaId:'d01', professorId:'p01', qtdAulas:1, ordem:1 },
    { id:'gh83', turmaId:'t05', diaSemana:5, disciplinaId:'d02', professorId:'p02', qtdAulas:1, ordem:2 },
    { id:'gh84', turmaId:'t05', diaSemana:5, disciplinaId:'d03', professorId:'p03', qtdAulas:1, ordem:3 },
    { id:'gh85', turmaId:'t05', diaSemana:5, disciplinaId:'d05', professorId:'p02', qtdAulas:1, ordem:4 },
    { id:'gh86', turmaId:'t05', diaSemana:5, disciplinaId:'d07', professorId:'p03', qtdAulas:1, ordem:5 },
  ],


  eventos_calendario: [
    { id: 'ev01', titulo: 'Início do 2º Bimestre', data: '2026-04-14', tipo: 'academico', cor: '#2563eb', descricao: 'Início das aulas do 2º bimestre letivo.' },
    { id: 'ev02', titulo: 'Reunião de Pais', data: '2026-04-22', tipo: 'reuniao', cor: '#d97706', descricao: 'Reunião de pais e mestres no auditório às 19h.' },
    { id: 'ev03', titulo: 'Semana Cultural', data: '2026-04-28', tipo: 'evento', cor: '#7c3aed', descricao: 'Semana Cultural da escola com apresentações e oficinas.' },
    { id: 'ev04', titulo: 'Dia do Trabalho', data: '2026-05-01', tipo: 'feriado', cor: '#dc2626', descricao: 'Feriado nacional — não haverá aula.' },
    { id: 'ev05', titulo: 'Prova Bimestral', data: '2026-05-12', tipo: 'prova', cor: '#059669', descricao: 'Provas bimestrais para todas as turmas.' },
    { id: 'ev06', titulo: 'Encerramento 2º Bim', data: '2026-06-20', tipo: 'academico', cor: '#2563eb', descricao: 'Último dia de aula do 2º bimestre.' },
  ],

  equipe: [
    { id: 'eq01', nome: 'Mariana Costa', cargo: 'Diretora', descricao: 'Gestão escolar há 12 anos, especialista em administração educacional.', icone: 'fa-crown', cor1: '#d97706', cor2: '#f59e0b', ativo: true, ordem: 1 },
    { id: 'eq02', nome: 'Maria das Graças', cargo: 'Coordenadora Pedagógica', descricao: 'Responsável pelo planejamento pedagógico e formação continuada.', icone: 'fa-chalkboard-user', cor1: '#2563eb', cor2: '#3b82f6', ativo: true, ordem: 2 },
    { id: 'eq03', nome: 'José Carlos', cargo: 'Professor de Matemática', descricao: 'Licenciado em Matemática com pós-graduação em ensino lúdico.', icone: 'fa-book-open', cor1: '#059669', cor2: '#10b981', ativo: true, ordem: 3 },
    { id: 'eq04', nome: 'Ana Beatriz', cargo: 'Professora de Ciências', descricao: 'Bióloga, apaixonada por despertar a curiosidade científica.', icone: 'fa-flask', cor1: '#7c3aed', cor2: '#8b5cf6', ativo: true, ordem: 4 },
    { id: 'eq05', nome: 'Carla Fernanda', cargo: 'Psicopedagoga · AEE', descricao: 'Atendimento especializado e inclusão educacional.', icone: 'fa-heart-pulse', cor1: '#dc2626', cor2: '#ef4444', ativo: true, ordem: 5 },
    { id: 'eq06', nome: 'Fernanda Ribeiro', cargo: 'Secretária Escolar', descricao: 'Organização documental, matrículas e atendimento às famílias.', icone: 'fa-clipboard-list', cor1: '#ec4899', cor2: '#f472b6', ativo: true, ordem: 6 },
  ],

  galeria: [
    { id: 'gal01', titulo: 'Sala de Aula', icone: 'fa-chalkboard-user', corFundo1: '#dbeafe', corFundo2: '#bfdbfe', corIcone: '#2563eb', ativo: true, ordem: 1 },
    { id: 'gal02', titulo: 'Educação Física', icone: 'fa-futbol', corFundo1: '#d1fae5', corFundo2: '#a7f3d0', corIcone: '#059669', ativo: true, ordem: 2 },
    { id: 'gal03', titulo: 'Semana Cultural', icone: 'fa-masks-theater', corFundo1: '#fef3c7', corFundo2: '#fde68a', corIcone: '#d97706', ativo: true, ordem: 3 },
    { id: 'gal04', titulo: 'Laboratório', icone: 'fa-flask', corFundo1: '#ede9fe', corFundo2: '#ddd6fe', corIcone: '#7c3aed', ativo: true, ordem: 4 },
    { id: 'gal05', titulo: 'Biblioteca', icone: 'fa-book-open-reader', corFundo1: '#fce7f3', corFundo2: '#fbcfe8', corIcone: '#db2777', ativo: true, ordem: 5 },
    { id: 'gal06', titulo: 'Premiação', icone: 'fa-award', corFundo1: '#fee2e2', corFundo2: '#fecaca', corIcone: '#dc2626', ativo: true, ordem: 6 },
  ],

  depoimentos: [
    { id: 'dep01', texto: 'O portal facilitou muito o acompanhamento das notas do meu filho. Agora consigo ver tudo em tempo real!', nome: 'Maria Silva', cargo: 'Mãe de Aluno · 7º Ano A', cor1: '#059669', cor2: '#10b981', ativo: true, ordem: 1 },
    { id: 'dep02', texto: 'O diário digital e o sistema de frequência tornaram minha rotina muito mais organizada como professora.', nome: 'Ana Oliveira', cargo: 'Professora · 8º Ano A', cor1: '#2563eb', cor2: '#3b82f6', ativo: true, ordem: 2 },
    { id: 'dep03', texto: 'Ter acesso às minhas notas e avisos pelo celular é muito prático. A escola está no futuro!', nome: 'Pedro Santos', cargo: 'Aluno · 9º Ano A', cor1: '#d97706', cor2: '#f59e0b', ativo: true, ordem: 3 },
  ],

  // ─── SEMED: Repasses Financeiros ─────────────────────────────
  repasses_financeiros: [
    { id: 'rf01', tipo: 'PDDE',       valor: 12500.00, data: '2026-02-15', descricao: 'Programa Dinheiro Direto na Escola — 1ª parcela',       status: 'recebido' },
    { id: 'rf02', tipo: 'PNAE',       valor: 8300.00,  data: '2026-03-01', descricao: 'Programa Nacional de Alimentação Escolar — março',     status: 'recebido' },
    { id: 'rf03', tipo: 'Manutenção', valor: 5000.00,  data: '2026-03-10', descricao: 'Repasse para manutenção predial e reparos emergenciais', status: 'recebido' },
    { id: 'rf04', tipo: 'PNAE',       valor: 8300.00,  data: '2026-04-01', descricao: 'Programa Nacional de Alimentação Escolar — abril',     status: 'recebido' },
    { id: 'rf05', tipo: 'Material',   valor: 3200.00,  data: '2026-04-15', descricao: 'Aquisição de material didático e de escritório',        status: 'recebido' },
    { id: 'rf06', tipo: 'PDDE',       valor: 12500.00, data: '2026-06-15', descricao: 'Programa Dinheiro Direto na Escola — 2ª parcela',       status: 'pendente' },
  ],

  // ─── SEMED: Estoque de Merenda ───────────────────────────────
  estoque_merenda: [
    { id: 'em01', item: 'Arroz (5kg)',          quantidade: 45, unidade: 'pacote', minimo: 20, ultimaEntrada: '2026-04-10', fornecedor: 'Dist. São Luís' },
    { id: 'em02', item: 'Feijão (1kg)',         quantidade: 30, unidade: 'pacote', minimo: 15, ultimaEntrada: '2026-04-10', fornecedor: 'Dist. São Luís' },
    { id: 'em03', item: 'Leite Integral (1L)',  quantidade: 8,  unidade: 'caixa',  minimo: 20, ultimaEntrada: '2026-03-28', fornecedor: 'Laticínios MA' },
    { id: 'em04', item: 'Macarrão (500g)',      quantidade: 60, unidade: 'pacote', minimo: 25, ultimaEntrada: '2026-04-12', fornecedor: 'Dist. São Luís' },
    { id: 'em05', item: 'Óleo de Soja (900ml)', quantidade: 12, unidade: 'garrafa',minimo: 10, ultimaEntrada: '2026-04-05', fornecedor: 'Atacadão Viana' },
    { id: 'em06', item: 'Açúcar (1kg)',         quantidade: 5,  unidade: 'pacote', minimo: 10, ultimaEntrada: '2026-03-20', fornecedor: 'Atacadão Viana' },
    { id: 'em07', item: 'Farinha de Trigo (1kg)',quantidade: 25, unidade: 'pacote', minimo: 12, ultimaEntrada: '2026-04-08', fornecedor: 'Dist. São Luís' },
    { id: 'em08', item: 'Frutas (variadas)',    quantidade: 3,  unidade: 'caixa',  minimo: 5,  ultimaEntrada: '2026-04-28', fornecedor: 'Hortifruti Viana' },
  ],

  // ─── SEMED: Circulares e Ofícios ─────────────────────────────
  circulares: [
    { id: 'circ01', numero: 'SEMED/2026/001', titulo: 'Calendário Letivo 2026 — Aprovação Final', corpo: 'Informamos que o calendário letivo de 2026 foi aprovado pelo Conselho Municipal de Educação. As escolas devem seguir rigorosamente as datas estabelecidas para início e término de cada bimestre, bem como os dias letivos previstos.', tipo: 'resolucao', dataPublicacao: '2026-02-01', prazoConfirmacao: '2026-02-10', confirmadoPor: null, dataConfirmacao: null, status: 'pendente' },
    { id: 'circ02', numero: 'SEMED/2026/002', titulo: 'Obrigatoriedade de Lançamento Digital de Notas', corpo: 'A partir do 1º bimestre de 2026, todas as unidades escolares devem utilizar exclusivamente o sistema digital para lançamento de notas e frequência. Diários em papel serão aceitos apenas como backup. O não cumprimento acarretará notificação formal.', tipo: 'portaria', dataPublicacao: '2026-02-15', prazoConfirmacao: '2026-02-25', confirmadoPor: 'Mariana Costa', dataConfirmacao: '2026-02-20T14:30:00', status: 'confirmado' },
    { id: 'circ03', numero: 'SEMED/2026/003', titulo: 'Semana de Formação Continuada — Abril/2026', corpo: 'Será realizada de 07 a 11 de abril a Semana de Formação Continuada para todos os professores da rede municipal. A participação é obrigatória e constará no registro funcional. Temas: Metodologias Ativas, Educação Inclusiva e Tecnologia em Sala de Aula.', tipo: 'oficio', dataPublicacao: '2026-03-15', prazoConfirmacao: '2026-03-25', confirmadoPor: null, dataConfirmacao: null, status: 'pendente' },
  ],

  // ─── SEMED: Histórico IDEB ───────────────────────────────────
  ideb_historico: [
    { id: 'ideb01', ano: 2017, nota: 4.2, meta: 4.5 },
    { id: 'ideb02', ano: 2019, nota: 4.8, meta: 4.8 },
    { id: 'ideb03', ano: 2021, nota: 5.1, meta: 5.0 },
    { id: 'ideb04', ano: 2023, nota: 5.4, meta: 5.2 },
    { id: 'ideb05', ano: 2025, nota: 5.7, meta: 5.5 },
  ],

  // ─── SEMED: Consumo de Merenda ───────────────────────────────
  consumo_merenda: [
    { id: 'cm01', data: '2026-04-14', refeicoes: 85,  observacao: 'Cardápio: arroz, feijão, frango, salada' },
    { id: 'cm02', data: '2026-04-15', refeicoes: 82,  observacao: 'Cardápio: macarronada com carne, suco' },
    { id: 'cm03', data: '2026-04-16', refeicoes: 78,  observacao: 'Cardápio: sopa de legumes, pão, suco' },
    { id: 'cm04', data: '2026-04-17', refeicoes: 90,  observacao: 'Cardápio: arroz, feijão, peixe, farofa' },
    { id: 'cm05', data: '2026-04-18', refeicoes: 88,  observacao: 'Cardápio: galinhada, salada, fruta' },
    { id: 'cm06', data: '2026-04-21', refeicoes: 80,  observacao: 'Cardápio: arroz, feijão, carne moída, legumes' },
    { id: 'cm07', data: '2026-04-22', refeicoes: 75,  observacao: 'Cardápio: mingau de aveia, pão, fruta' },
    { id: 'cm08', data: '2026-04-23', refeicoes: 92,  observacao: 'Cardápio: arroz, feijão, frango assado, macarrão' },
    { id: 'cm09', data: '2026-04-24', refeicoes: 86,  observacao: 'Cardápio: risoto de carne, salada, suco' },
    { id: 'cm10', data: '2026-04-25', refeicoes: 84,  observacao: 'Cardápio: macarrão com molho, fruta' },
    { id: 'cm11', data: '2026-04-28', refeicoes: 88,  observacao: 'Cardápio: arroz, feijão, bife, purê' },
    { id: 'cm12', data: '2026-04-29', refeicoes: 91,  observacao: 'Cardápio: canja de galinha, pão, suco' },
    { id: 'cm13', data: '2026-04-30', refeicoes: 79,  observacao: 'Cardápio: arroz, feijão, linguiça, farofa' },
    { id: 'cm14', data: '2026-05-02', refeicoes: 87,  observacao: 'Cardápio: feijoada light, arroz, couve, laranja' },
  ],

  escolas_rede: [
    { id: 'esc01', slug: 'ueedithnair', nome: 'U.E. Professora Edith Nair Furtado da Silva', nomeAbreviado: 'U.E. Edith Nair',
      codigoINEP: '21045780', endereco: 'Rua Principal, 100 - Centro', cidade: 'Viana', estado: 'MA',
      telefone: '(98) 99999-9999', email: 'secretaria@edith.edu.ma.gov.br', diretorNome: 'Administrador',
      whatsapp: '(98) 99999-9999', logomarca: '',
      tipo: 'urbana', modalidades: ['fundamental_ii'], turnosFuncionamento: ['manhã','tarde'],
      capacidade: 500, anoLetivo: 2026,
      dependenciaAdm: 'municipal', localizacaoDiferenciada: 'nao_se_aplica',
      infraestrutura: { agua: 'rede_publica', esgoto: 'rede_publica', energia: 'rede_publica',
        internet: true, bandaLarga: true, acessibilidade: true, quadraEsportiva: true,
        biblioteca: true, laboratorioInformatica: true, laboratorioCiencias: false,
        cozinha: true, refeitorio: true, banheiroPNE: true, salaRecursos: false },
      sistemaFechado: false, dataFechamento: null, notaMinima: 5.0, bimestreAtual: 1,
      ativa: true, criadoEm: '2026-01-15' },
    { id: 'esc02', slug: 'uemanoel', nome: 'U.E. Manoel Beckman', nomeAbreviado: 'U.E. Manoel Beckman',
      codigoINEP: '21045798', endereco: 'Av. Brasil, 450 - Bairro Novo', cidade: 'Viana', estado: 'MA',
      telefone: '(98) 98888-8888', email: 'contato@manoel.edu.ma.gov.br', diretorNome: 'José Ferreira',
      whatsapp: '(98) 98888-8888', logomarca: '',
      tipo: 'urbana', modalidades: ['fundamental_ii'], turnosFuncionamento: ['manhã','tarde','noite'],
      capacidade: 350, anoLetivo: 2026,
      dependenciaAdm: 'municipal', localizacaoDiferenciada: 'nao_se_aplica',
      infraestrutura: { agua: 'rede_publica', esgoto: 'fossa', energia: 'rede_publica',
        internet: true, bandaLarga: false, acessibilidade: false, quadraEsportiva: true,
        biblioteca: false, laboratorioInformatica: true, laboratorioCiencias: false,
        cozinha: true, refeitorio: false, banheiroPNE: false, salaRecursos: false },
      sistemaFechado: false, dataFechamento: null, notaMinima: 5.0, bimestreAtual: 1,
      ativa: true, criadoEm: '2026-02-01' },
    { id: 'esc03', slug: 'uesaojoao', nome: 'U.E. São João Batista', nomeAbreviado: 'U.E. São João',
      codigoINEP: '21045801', endereco: 'Estrada do Interior, Km 12', cidade: 'Viana', estado: 'MA',
      telefone: '(98) 97777-7777', email: 'contato@saojoao.edu.ma.gov.br', diretorNome: 'Ana Oliveira',
      whatsapp: '(98) 97777-7777', logomarca: '',
      tipo: 'rural', modalidades: ['fundamental_ii'], turnosFuncionamento: ['manhã'],
      capacidade: 120, anoLetivo: 2026,
      dependenciaAdm: 'municipal', localizacaoDiferenciada: 'area_assentamento',
      infraestrutura: { agua: 'poco_artesiano', esgoto: 'fossa', energia: 'rede_publica',
        internet: false, bandaLarga: false, acessibilidade: false, quadraEsportiva: false,
        biblioteca: false, laboratorioInformatica: false, laboratorioCiencias: false,
        cozinha: true, refeitorio: false, banheiroPNE: false, salaRecursos: false },
      sistemaFechado: false, dataFechamento: null, notaMinima: 5.0, bimestreAtual: 1,
      ativa: true, criadoEm: '2026-02-10' },
  ],

  // ── MODALIDADES DE ENSINO ──────────────────────────────────────
  modalidades_ensino: [
    { id: 'mod_infantil', codigo: 'educacao_infantil', nome: 'Educação Infantil',
      registroCargaHoraria: 'manual_diario', cargaHorariaAnualMinima: 800, diasLetivosMinimos: 200,
      usaNotasBimestrais: false, usaCamposExperiencia: true, permiteMultisseriada: true, ativo: true },
    { id: 'mod_fund1', codigo: 'fundamental_i', nome: 'Ensino Fundamental I (Anos Iniciais)',
      registroCargaHoraria: 'grade_fixa', cargaHorariaAnualMinima: 800, diasLetivosMinimos: 200,
      usaNotasBimestrais: true, usaCamposExperiencia: false, permiteMultisseriada: true, ativo: true },
    { id: 'mod_fund2', codigo: 'fundamental_ii', nome: 'Ensino Fundamental II (Anos Finais)',
      registroCargaHoraria: 'grade_fixa', cargaHorariaAnualMinima: 800, diasLetivosMinimos: 200,
      usaNotasBimestrais: true, usaCamposExperiencia: false, permiteMultisseriada: false, ativo: true },
    { id: 'mod_eja', codigo: 'eja', nome: 'Educação de Jovens e Adultos (EJA)',
      registroCargaHoraria: 'grade_fixa', cargaHorariaAnualMinima: 640, diasLetivosMinimos: 200,
      usaNotasBimestrais: true, usaCamposExperiencia: false, permiteMultisseriada: false, ativo: true },
    { id: 'mod_medio', codigo: 'ensino_medio', nome: 'Ensino Médio',
      registroCargaHoraria: 'grade_fixa', cargaHorariaAnualMinima: 1000, diasLetivosMinimos: 200,
      usaNotasBimestrais: true, usaCamposExperiencia: false, permiteMultisseriada: false, ativo: true },
    { id: 'mod_medio_tec', codigo: 'ensino_medio_tecnico', nome: 'Ensino Médio Técnico Integrado',
      registroCargaHoraria: 'grade_fixa', cargaHorariaAnualMinima: 1000, diasLetivosMinimos: 200,
      usaNotasBimestrais: true, usaCamposExperiencia: false, permiteMultisseriada: false, ativo: true },
    { id: 'mod_aee', codigo: 'aee', nome: 'Atendimento Educacional Especializado (AEE)',
      registroCargaHoraria: 'manual_diario', cargaHorariaAnualMinima: 0, diasLetivosMinimos: 0,
      usaNotasBimestrais: false, usaCamposExperiencia: false, permiteMultisseriada: false, ativo: true },
    { id: 'mod_ativcomp', codigo: 'atividades_complementares', nome: 'Atividades Complementares',
      registroCargaHoraria: 'manual_diario', cargaHorariaAnualMinima: 0, diasLetivosMinimos: 0,
      usaNotasBimestrais: false, usaCamposExperiencia: false, permiteMultisseriada: false, ativo: true },
  ],

  // ── NÍVEIS DE ENSINO ───────────────────────────────────────────
  niveis_ensino: [
    // Educação Infantil
    { id: 'niv_bercario', modalidadeId: 'mod_infantil', nome: 'Berçário (Creche)', sigla: 'BRC',
      subniveis: ['M1','M2','M3'], idadeMinimaMeses: 0, idadeMaximaMeses: 23, dataCorte: '03-31', ordemExibicao: 1, ativo: true },
    { id: 'niv_creche_g', modalidadeId: 'mod_infantil', nome: 'Creche — Grupos', sigla: 'CRG',
      subniveis: ['G1','G2','G2.2','G2.3'], idadeMinimaMeses: 12, idadeMaximaMeses: 35, dataCorte: '03-31', ordemExibicao: 2, ativo: true },
    { id: 'niv_preescola', modalidadeId: 'mod_infantil', nome: 'Pré-Escola', sigla: 'PRE',
      subniveis: ['G3','G3.4','G3.5','G4','G5'], idadeMinimaMeses: 36, idadeMaximaMeses: 71, dataCorte: '03-31', ordemExibicao: 3, ativo: true },
    // Fundamental I
    { id: 'niv_fund1', modalidadeId: 'mod_fund1', nome: 'Anos Iniciais (1º ao 5º)', sigla: 'AI',
      subniveis: ['1º Ano','2º Ano','3º Ano','4º Ano','5º Ano'], idadeMinimaMeses: 72, idadeMaximaMeses: 131, dataCorte: '03-31', ordemExibicao: 1, ativo: true },
    // Fundamental II
    { id: 'niv_fund2', modalidadeId: 'mod_fund2', nome: 'Anos Finais (6º ao 9º)', sigla: 'AF',
      subniveis: ['6º','7º','8º','9º'], idadeMinimaMeses: 132, idadeMaximaMeses: 179, dataCorte: '03-31', ordemExibicao: 1, ativo: true },
    // EJA
    { id: 'niv_eja1', modalidadeId: 'mod_eja', nome: 'EJA — Etapa 1 (1º ao 3º)', sigla: 'EJ1',
      subniveis: ['1º Ano','2º Ano','3º Ano'], idadeMinimaMeses: 180, idadeMaximaMeses: null, dataCorte: null, ordemExibicao: 1, ativo: true },
    { id: 'niv_eja2', modalidadeId: 'mod_eja', nome: 'EJA — Etapa 2 (4º e 5º)', sigla: 'EJ2',
      subniveis: ['4º Ano','5º Ano'], idadeMinimaMeses: 180, idadeMaximaMeses: null, dataCorte: null, ordemExibicao: 2, ativo: true },
    { id: 'niv_eja3', modalidadeId: 'mod_eja', nome: 'EJA — Etapa 3 (6º e 7º)', sigla: 'EJ3',
      subniveis: ['6º Ano','7º Ano'], idadeMinimaMeses: 180, idadeMaximaMeses: null, dataCorte: null, ordemExibicao: 3, ativo: true },
    { id: 'niv_eja4', modalidadeId: 'mod_eja', nome: 'EJA — Etapa 4 (8º e 9º)', sigla: 'EJ4',
      subniveis: ['8º Ano','9º Ano'], idadeMinimaMeses: 180, idadeMaximaMeses: null, dataCorte: null, ordemExibicao: 4, ativo: true },
    // Ensino Médio
    { id: 'niv_medio', modalidadeId: 'mod_medio', nome: 'Ensino Médio (1ª a 3ª)', sigla: 'EM',
      subniveis: ['1ª Série','2ª Série','3ª Série'], idadeMinimaMeses: 180, idadeMaximaMeses: null, dataCorte: null, ordemExibicao: 1, ativo: true },
    { id: 'niv_medio_tec', modalidadeId: 'mod_medio_tec', nome: 'Ensino Médio Técnico', sigla: 'EMT',
      subniveis: ['1ª Série','2ª Série','3ª Série'], idadeMinimaMeses: 180, idadeMaximaMeses: null, dataCorte: null, ordemExibicao: 1, ativo: true },
    // AEE
    { id: 'niv_aee', modalidadeId: 'mod_aee', nome: 'Sala de Recursos AEE', sigla: 'AEE',
      subniveis: [], idadeMinimaMeses: null, idadeMaximaMeses: null, dataCorte: null, ordemExibicao: 1, ativo: true },
    // Atividades Complementares
    { id: 'niv_ativcomp', modalidadeId: 'mod_ativcomp', nome: 'Atividades Complementares', sigla: 'ATC',
      subniveis: [], idadeMinimaMeses: null, idadeMaximaMeses: null, dataCorte: null, ordemExibicao: 1, ativo: true },
  ],

  // ── REGISTRO DE CARGA HORÁRIA ────────────────────────────────
  registro_carga_horaria: [
    { id: 'rch01', escolaId: 'esc01', turmaId: 't01', data: '2026-02-10',
      blocos: [
        { inicio: '07:30', fim: '09:00', atividade: 'Aula de Matemática', minutos: 90 },
        { inicio: '09:20', fim: '10:50', atividade: 'Aula de Português', minutos: 90 },
        { inicio: '11:00', fim: '11:50', atividade: 'Aula de Ciências', minutos: 50 },
      ],
      totalMinutos: 230, professorId: 'p01', observacao: '', criadoEm: '2026-02-10' },
    { id: 'rch02', escolaId: 'esc01', turmaId: 't01', data: '2026-02-11',
      blocos: [
        { inicio: '07:30', fim: '09:00', atividade: 'Aula de História', minutos: 90 },
        { inicio: '09:20', fim: '10:50', atividade: 'Aula de Geografia', minutos: 90 },
        { inicio: '11:00', fim: '11:50', atividade: 'Educação Física', minutos: 50 },
      ],
      totalMinutos: 230, professorId: 'p01', observacao: '', criadoEm: '2026-02-11' },
    { id: 'rch03', escolaId: 'esc01', turmaId: 't01', data: '2026-02-12',
      blocos: [
        { inicio: '07:30', fim: '09:00', atividade: 'Aula de Matemática', minutos: 90 },
        { inicio: '09:20', fim: '11:00', atividade: 'Projeto Integrador', minutos: 100 },
      ],
      totalMinutos: 190, professorId: 'p01', observacao: 'Hora-atividade após 11h', criadoEm: '2026-02-12' },
  ],

  // ── DICIONÁRIO INEP / EDUCACENSO ───────────────────────
  dicionario_inep: [
    // Cor/Raça (Tabela 2)
    { id: 'inep_cor_0', tabela: 'cor_raca', codigo: 0, descricao: 'Não declarada', chave: 'nao_declarada' },
    { id: 'inep_cor_1', tabela: 'cor_raca', codigo: 1, descricao: 'Branca', chave: 'branca' },
    { id: 'inep_cor_2', tabela: 'cor_raca', codigo: 2, descricao: 'Preta', chave: 'preta' },
    { id: 'inep_cor_3', tabela: 'cor_raca', codigo: 3, descricao: 'Parda', chave: 'parda' },
    { id: 'inep_cor_4', tabela: 'cor_raca', codigo: 4, descricao: 'Amarela', chave: 'amarela' },
    { id: 'inep_cor_5', tabela: 'cor_raca', codigo: 5, descricao: 'Indígena', chave: 'indigena' },
    // Sexo (Tabela 3)
    { id: 'inep_sexo_1', tabela: 'sexo', codigo: 1, descricao: 'Masculino', chave: 'M' },
    { id: 'inep_sexo_2', tabela: 'sexo', codigo: 2, descricao: 'Feminino', chave: 'F' },
    // Dependência Administrativa (Tabela 10)
    { id: 'inep_dep_1', tabela: 'dependencia_adm', codigo: 1, descricao: 'Federal', chave: 'federal' },
    { id: 'inep_dep_2', tabela: 'dependencia_adm', codigo: 2, descricao: 'Estadual', chave: 'estadual' },
    { id: 'inep_dep_3', tabela: 'dependencia_adm', codigo: 3, descricao: 'Municipal', chave: 'municipal' },
    { id: 'inep_dep_4', tabela: 'dependencia_adm', codigo: 4, descricao: 'Privada', chave: 'privada' },
    // Localização (Tabela 11)
    { id: 'inep_loc_1', tabela: 'localizacao', codigo: 1, descricao: 'Urbana', chave: 'urbana' },
    { id: 'inep_loc_2', tabela: 'localizacao', codigo: 2, descricao: 'Rural', chave: 'rural' },
    // Abastecimento de Água (Tabela 14)
    { id: 'inep_agua_1', tabela: 'agua', codigo: 1, descricao: 'Rede Pública', chave: 'rede_publica' },
    { id: 'inep_agua_2', tabela: 'agua', codigo: 2, descricao: 'Poço Artesiano', chave: 'poco_artesiano' },
    { id: 'inep_agua_3', tabela: 'agua', codigo: 3, descricao: 'Cacimba/Cisterna', chave: 'cacimba' },
    { id: 'inep_agua_4', tabela: 'agua', codigo: 4, descricao: 'Rio/Igarapé', chave: 'rio' },
    { id: 'inep_agua_5', tabela: 'agua', codigo: 5, descricao: 'Inexistente', chave: 'inexistente' },
    // Esgoto (Tabela 15)
    { id: 'inep_esg_1', tabela: 'esgoto', codigo: 1, descricao: 'Rede Pública', chave: 'rede_publica' },
    { id: 'inep_esg_2', tabela: 'esgoto', codigo: 2, descricao: 'Fossa Séptica', chave: 'fossa' },
    { id: 'inep_esg_3', tabela: 'esgoto', codigo: 3, descricao: 'Inexistente', chave: 'inexistente' },
    // Deficiência (Tabela 24)
    { id: 'inep_def_1', tabela: 'deficiencia', codigo: 1, descricao: 'Cegueira', chave: 'cegueira' },
    { id: 'inep_def_2', tabela: 'deficiencia', codigo: 2, descricao: 'Baixa Visão', chave: 'baixa_visao' },
    { id: 'inep_def_3', tabela: 'deficiencia', codigo: 3, descricao: 'Surdez', chave: 'surdez' },
    { id: 'inep_def_4', tabela: 'deficiencia', codigo: 4, descricao: 'Def. Auditiva', chave: 'auditiva' },
    { id: 'inep_def_5', tabela: 'deficiencia', codigo: 5, descricao: 'Surdocegueira', chave: 'surdocegueira' },
    { id: 'inep_def_6', tabela: 'deficiencia', codigo: 6, descricao: 'Def. Física', chave: 'fisica' },
    { id: 'inep_def_7', tabela: 'deficiencia', codigo: 7, descricao: 'Def. Intelectual', chave: 'intelectual' },
    { id: 'inep_def_8', tabela: 'deficiencia', codigo: 8, descricao: 'Def. Múltipla', chave: 'multipla' },
    { id: 'inep_def_9', tabela: 'deficiencia', codigo: 9, descricao: 'TEA (Autismo)', chave: 'tea' },
    { id: 'inep_def_10', tabela: 'deficiencia', codigo: 10, descricao: 'Altas Habilidades', chave: 'altas_habilidades' },
    // Transporte Escolar (Tabela 29)
    { id: 'inep_transp_0', tabela: 'transporte', codigo: 0, descricao: 'Não utiliza', chave: 'nenhum' },
    { id: 'inep_transp_1', tabela: 'transporte', codigo: 1, descricao: 'Escolar Público Municipal', chave: 'escolar_publico' },
    { id: 'inep_transp_2', tabela: 'transporte', codigo: 2, descricao: 'Escolar Público Estadual', chave: 'escolar_estadual' },
    { id: 'inep_transp_3', tabela: 'transporte', codigo: 3, descricao: 'Particular', chave: 'particular' },
    // Situação do Aluno (Tabela 35)
    { id: 'inep_sit_1', tabela: 'situacao_aluno', codigo: 1, descricao: 'Aprovado', chave: 'aprovado' },
    { id: 'inep_sit_2', tabela: 'situacao_aluno', codigo: 2, descricao: 'Reprovado', chave: 'reprovado' },
    { id: 'inep_sit_3', tabela: 'situacao_aluno', codigo: 3, descricao: 'Cursando', chave: 'cursando' },
    { id: 'inep_sit_4', tabela: 'situacao_aluno', codigo: 4, descricao: 'Transferido', chave: 'transferido' },
    { id: 'inep_sit_5', tabela: 'situacao_aluno', codigo: 5, descricao: 'Deixou de Frequentar', chave: 'desistente' },
    { id: 'inep_sit_6', tabela: 'situacao_aluno', codigo: 6, descricao: 'Falecido', chave: 'falecido' },
  ],
};

// Coleções que são arrays (listas de documentos)
const LIST_COLLECTIONS = ['turmas','professores','disciplinas','alunos','notas','frequencia','diario','atividades','aee','avisos','horarios_aula','grade_horaria','eventos_calendario','equipe','galeria','depoimentos','repasses_financeiros','estoque_merenda','circulares','ideb_historico','consumo_merenda','escolas_rede','modalidades_ensino','niveis_ensino','registro_carga_horaria','dicionario_inep'];
// Coleções que são documentos únicos (singletons) — escola/config migrados para escolas_rede
const SINGLETON_COLLECTIONS = [];

// ─── FIRESTORE DATA ACCESS LAYER ─────────────────────────────

// Carrega TUDO do Firestore para o cache em memória
async function loadAllData() {
  console.log('📦 Carregando dados do Firestore...');
  const start = Date.now();

  // PERFORMANCE: Carregamento paralelo — todas as coleções ao mesmo tempo
  // Antes: serial (for...of await) = ~21 * latência
  // Agora: paralelo (Promise.all) = ~1 * latência

  // Singletons (paralelo)
  const singletonPromises = SINGLETON_COLLECTIONS.map(key =>
    db.collection(key).doc('info').get()
      .then(snap => { CACHE[key] = snap.exists ? snap.data() : null; })
      .catch(e => { console.warn(`Erro ao carregar ${key}:`, e); CACHE[key] = null; })
  );

  // Listas (paralelo)
  const listPromises = LIST_COLLECTIONS.map(key =>
    db.collection(key).get()
      .then(snap => { CACHE[key] = snap.docs.map(d => ({ id: d.id, ...d.data() })); })
      .catch(e => { console.warn(`Erro ao carregar ${key}:`, e); CACHE[key] = []; })
  );

  // Executar tudo ao mesmo tempo
  await Promise.all([...singletonPromises, ...listPromises]);

  console.log(`✅ Dados carregados em ${Date.now() - start}ms (paralelo)`);
  return CACHE;
}

// ─── SYNC READ API (from cache) ──────────────────────────────
function dbGet(key) {
  // Legacy compatibility: redirect escola/config to multi-tenant functions
  if (key === 'escola') return getEscolaInfo();
  if (key === 'config') return getConfig();
  if (SINGLETON_COLLECTIONS.includes(key)) {
    return CACHE[key] || SEED[key] || null;
  }
  return CACHE[key] || SEED[key] || [];
}

function dbSet(key, value) {
  CACHE[key] = value;
  // Persist to Firestore
  if (SINGLETON_COLLECTIONS.includes(key)) {
    db.collection(key).doc('info').set(value, { merge: true }).catch(e => console.error('dbSet error:', e));
  }
}

function dbGetAll(key) {
  return CACHE[key] || SEED[key] || [];
}

function dbFind(key, id) {
  return dbGetAll(key).find(item => item.id === id) || null;
}

function dbUpdate(key, id, updates) {
  // Singleton
  if (SINGLETON_COLLECTIONS.includes(key)) {
    CACHE[key] = { ...(CACHE[key] || {}), ...updates };
    db.collection(key).doc('info').set(CACHE[key], { merge: true }).catch(e => console.error('dbUpdate error:', e));
    return true;
  }
  // List
  const items = dbGetAll(key);
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return false;
  items[idx] = { ...items[idx], ...updates };
  CACHE[key] = items;
  // Firestore
  db.collection(key).doc(id).set(items[idx], { merge: true }).catch(e => console.error('dbUpdate error:', e));
  return true;
}

function dbAdd(key, item) {
  const items = dbGetAll(key);
  items.push(item);
  CACHE[key] = items;
  // Firestore
  db.collection(key).doc(item.id).set(item).catch(e => console.error('dbAdd error:', e));
  return item;
}

function dbDelete(key, id) {
  CACHE[key] = dbGetAll(key).filter(i => i.id !== id);
  // Firestore
  db.collection(key).doc(id).delete().catch(e => console.error('dbDelete error:', e));
}

function dbUpsert(key, id, item) {
  const items = dbGetAll(key);
  const idx = items.findIndex(i => i.id === id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...item };
  } else {
    items.push({ id, ...item });
  }
  CACHE[key] = items;
  // Firestore
  db.collection(key).doc(id).set({ id, ...item }, { merge: true }).catch(e => console.error('dbUpsert error:', e));
}

function generateId(prefix = 'id') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ─── CONFIG HELPERS (agora lê de escolas_rede) ──────────────
function getConfig() {
  if (!ESCOLA_ATIVA || ESCOLA_ATIVA === 'semed') return { sistemaFechado: false, dataFechamento: null, notaMinima: 5.0, bimestreAtual: 1 };
  const escola = dbFind('escolas_rede', ESCOLA_ATIVA);
  if (!escola) return { sistemaFechado: false, dataFechamento: null, notaMinima: 5.0, bimestreAtual: 1 };
  return {
    sistemaFechado: escola.sistemaFechado || false,
    dataFechamento: escola.dataFechamento || null,
    notaMinima: escola.notaMinima || 5.0,
    bimestreAtual: escola.bimestreAtual || 1
  };
}
function setConfig(updates) {
  if (!ESCOLA_ATIVA || ESCOLA_ATIVA === 'semed') return;
  dbUpdate('escolas_rede', ESCOLA_ATIVA, updates);
}

function getEscolaInfo() {
  if (!ESCOLA_ATIVA) return { nome: 'Sistema Escolar', cidade: 'Viana · MA', anoLetivo: 2026 };
  if (ESCOLA_ATIVA === 'semed') {
    return {
      id: 'semed',
      nome: 'SEMED - Secretaria Municipal de Educação',
      nomeAbreviado: 'SEMED',
      cidade: 'Viana - MA',
      anoLetivo: 2026,
      logomarca: '',
      whatsapp: '(98) 3351-1234',
      email: 'semed@viana.ma.gov.br',
      diretorNome: 'Secretário de Educação',
      tipo: 'semed'
    };
  }
  return dbFind('escolas_rede', ESCOLA_ATIVA) || { nome: 'Sistema Escolar', cidade: 'Viana · MA', anoLetivo: 2026 };
}

function isSistemaClosed() { return getConfig().sistemaFechado === true; }

function fecharSistema() {
  setConfig({ sistemaFechado: true, dataFechamento: new Date().toISOString() });
}
function abrirSistema() {
  setConfig({ sistemaFechado: false, dataFechamento: null });
}

// ─── AUTH HELPERS (Firebase Auth) ─────────────────────────────

// Busca o CPF nos alunos matriculados (para cadastro)
async function verificarCPF(cpf) {
  // Normaliza CPF (remove pontos e traço)
  const cpfNorm = cpf.replace(/\D/g, '');
  const cpfFormatado = cpfNorm.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  // Busca no Firestore
  const snap = await db.collection('alunos')
    .where('cpf', '==', cpfFormatado)
    .limit(1)
    .get();

  if (!snap.empty) {
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  // Fallback: buscar com CPF sem formatação
  const snap2 = await db.collection('alunos')
    .where('cpf', '==', cpfNorm)
    .limit(1)
    .get();

  if (!snap2.empty) {
    const doc = snap2.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  return null;
}

// Registra aluno com email/senha após verificar CPF
async function registrarAluno(cpf, email, senha) {
  // 1. Verificar CPF
  const aluno = await verificarCPF(cpf);
  if (!aluno) throw new Error('CPF não encontrado na matrícula da escola.');
  if (aluno.uid) throw new Error('Este CPF já possui uma conta cadastrada.');

  // 2. Criar conta no Firebase Auth
  const cred = await auth.createUserWithEmailAndPassword(email, senha);
  const uid = cred.user.uid;

  // 3. Criar documento do usuário (com escola do aluno)
  const escolaId = aluno.escolaId || 'esc01';
  await db.collection('users').doc(uid).set({
    email: email,
    nome: aluno.nome,
    roles: ['aluno'],
    alunoId: aluno.id,
    escolaIds: [escolaId],
    escolaAtiva: escolaId,
    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
  });

  // 4. Vincular uid ao aluno
  await db.collection('alunos').doc(aluno.id).update({ uid: uid });

  return { uid, aluno };
}

// Busca dados do usuário logado no Firestore
async function getUserData(uid) {
  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists) return null;
  return { uid, ...snap.data() };
}

// ─── NOTA HELPERS ─────────────────────────────────────────────
function getNotaAnual(b1, b2, b3, b4) {
  const notas = [b1, b2, b3, b4];
  // Exige TODOS os 4 bimestres preenchidos para calcular média anual
  if (notas.some(n => n === null || n === undefined)) return null;
  const vals = notas.map(n => parseFloat(n));
  if (vals.some(v => isNaN(v))) return null;
  return +(vals.reduce((a,b) => a+b, 0) / 4).toFixed(1);
}

function isAprovado(notaAnual, notaMinima = 5.0) {
  if (notaAnual === null) return null;
  return notaAnual >= notaMinima;
}

function getNotasAluno(alunoId) {
  return dbGetAll('notas').filter(n => n.alunoId === alunoId);
}

function salvarNota(alunoId, disciplinaId, bimestre, valor) {
  const notas = dbGetAll('notas');
  let nota = notas.find(n => n.alunoId === alunoId && n.disciplinaId === disciplinaId);
  const bKey = `b${bimestre}`;
  const valNum = valor === '' ? null : parseFloat(valor);
  if (nota) {
    dbUpdate('notas', nota.id, { [bKey]: valNum });
  } else {
    const newNota = { id: generateId('n'), alunoId, disciplinaId, b1: null, b2: null, b3: null, b4: null };
    newNota[bKey] = valNum;
    dbAdd('notas', newNota);
  }
}

// ─── DATE HELPERS ─────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length <= 10 ? 'T12:00:00' : ''));
  return d.toLocaleDateString('pt-BR');
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ─── SEED FIRESTORE ───────────────────────────────────────────
// SEGURANÇA: O seed agora requer que o usuário já esteja autenticado.
// Para fazer o seed inicial, faça login manualmente e chame seedFirestore()
// pelo console do navegador, ou use o Firebase Admin SDK em um script Node.js.
async function seedFirestore() {
  console.log('🌱 Verificando se Firestore precisa de seed...');

  // Verificar se já existe um usuário autenticado
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.log('⚠️ Seed requer autenticação. Faça login primeiro.');
    return false;
  }

  let adminUid = currentUser.uid;

  // Aguardar token de autenticação ser reconhecido pelo Firestore
  try {
    await currentUser.getIdToken(true);
    console.log('🔑 Token de autenticação atualizado.');
  } catch (e) {
    console.warn('Erro ao atualizar token:', e);
  }

  // Verificar se já tem dados (checa escolas_rede ao invés do antigo singleton)
  try {
    const escolaSnap = await db.collection('escolas_rede').doc('esc01').get();
    if (escolaSnap.exists) {
      console.log('✅ Firestore já tem dados, pulando seed.');
      return false;
    }
    // Fallback: checa antigo singleton também
    const oldSnap = await db.collection('escola').doc('info').get();
    if (oldSnap.exists) {
      console.log('✅ Firestore já tem dados (formato antigo), pulando seed.');
      return false;
    }
  } catch (e) {
    console.warn('Não foi possível verificar dados existentes:', e);
    return false;
  }

  console.log('🌱 Populando Firestore com dados iniciais (multi-tenant)...');

  try {
    // Lists (inclui escolas_rede)
    for (const key of LIST_COLLECTIONS) {
      const items = SEED[key] || [];
      const batch = db.batch();
      items.forEach(item => {
        const ref = db.collection(key).doc(item.id);
        batch.set(ref, item);
      });
      if (items.length > 0) await batch.commit();
    }

    // Criar/atualizar documento do admin no Firestore (com escolaIds multi-tenant)
    const userSnap = await db.collection('users').doc(adminUid).get();
    if (!userSnap.exists) {
      await db.collection('users').doc(adminUid).set({
        email: currentUser.email,
        nome: 'Administrador',
        roles: ['aluno', 'professor', 'diretor', 'secretaria'],
        alunoId: 'a01',
        professorId: 'p01',
        escolaIds: ['esc01', 'esc02', 'esc03'],
        escolaAtiva: 'esc01',
        criadoEm: firebase.firestore.FieldValue.serverTimestamp()
      });
      // Vincular uid ao aluno a01
      await db.collection('alunos').doc('a01').update({ uid: adminUid });
    } else {
      // Update existing user with escolaIds if missing
      const existingData = userSnap.data();
      if (!existingData.escolaIds) {
        await db.collection('users').doc(adminUid).update({
          escolaIds: ['esc01', 'esc02', 'esc03'],
          escolaAtiva: 'esc01',
          roles: existingData.roles?.includes('secretaria') ? existingData.roles : [...(existingData.roles || []), 'secretaria']
        });
      }
    }

    console.log('✅ Seed concluído!');
  } catch (e) {
    console.error('❌ Erro durante o seed:', e);
  }

  return true;
}
