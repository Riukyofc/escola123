// =============================================================
// DATA.JS — Plataforma Institucional Escolar
// Firestore + Cache em Memória
// =============================================================

// ─── IN-MEMORY CACHE ──────────────────────────────────────────
// Carregamos tudo do Firestore para a memória no login.
// Leituras são síncronas (do cache). Escritas vão pro Firestore + cache.
const CACHE = {};

// ─── SEED DATA ────────────────────────────────────────────────
const SEED = {

  escola: {
    nome: 'Unidade Escolar Professora Edith Nair Furtado da Silva',
    cidade: 'Viana · Maranhão',
    anoLetivo: 2026,
    logomarca: '',
    whatsapp: '(98) 99999-9999',
    email: 'secretaria@edith.edu.ma.gov.br'
  },

  config: {
    sistemaFechado: false,
    dataFechamento: null,
    notaMinima: 5.0,
    bimestreAtual: 1
  },

  turmas: [
    { id: 't01', nome: '6º Ano A',  turno: 'manhã',  professorId: 'p01', disciplinaId: 'd01', ativo: true },
    { id: 't02', nome: '7º Ano A',  turno: 'manhã',  professorId: 'p02', disciplinaId: 'd02', ativo: true },
    { id: 't03', nome: '8º Ano A',  turno: 'tarde',  professorId: 'p03', disciplinaId: 'd03', ativo: true },
    { id: 't04', nome: '8º Ano B',  turno: 'tarde',  professorId: 'p01', disciplinaId: 'd01', ativo: true },
    { id: 't05', nome: '9º Ano A',  turno: 'noite',  professorId: 'p02', disciplinaId: 'd01', ativo: true },
  ],

  professores: [
    { id: 'p01', nome: 'Maria das Graças Santos', email: 'maria@escola.edu', disciplinas: ['d01','d02'], turmaIds: ['t01','t04'], ativo: true },
    { id: 'p02', nome: 'José Carlos Ferreira',    email: 'jose@escola.edu',  disciplinas: ['d02','d03'], turmaIds: ['t02','t05'], ativo: true },
    { id: 'p03', nome: 'Ana Beatriz Oliveira',    email: 'ana@escola.edu',   disciplinas: ['d03','d04'], turmaIds: ['t03'],       ativo: true },
  ],

  disciplinas: [
    { id: 'd01', nome: 'Língua Portuguesa', icone: 'fa-book-open',      cor: '#ef4444', ativo: true },
    { id: 'd02', nome: 'Matemática',         icone: 'fa-calculator',     cor: '#3b82f6', ativo: true },
    { id: 'd03', nome: 'Ciências',           icone: 'fa-flask',          cor: '#10b981', ativo: true },
    { id: 'd04', nome: 'História',           icone: 'fa-landmark',       cor: '#f59e0b', ativo: true },
    { id: 'd05', nome: 'Geografia',          icone: 'fa-earth-americas', cor: '#8b5cf6', ativo: true },
    { id: 'd06', nome: 'Arte',               icone: 'fa-palette',        cor: '#ec4899', ativo: true },
    { id: 'd07', nome: 'Educação Física',    icone: 'fa-futbol',         cor: '#f97316', ativo: true },
    { id: 'd08', nome: 'Língua Inglesa',     icone: 'fa-language',       cor: '#6366f1', ativo: true },
    { id: 'd09', nome: 'Ensino Religioso',   icone: 'fa-star',           cor: '#a855f7', ativo: true },
  ],

  alunos: [
    { id: 'a01', nome: 'Ana Carolina Souza',      matricula: '2026001', cpf: '111.111.111-11', turmaId: 't01', ativo: true },
    { id: 'a02', nome: 'Bruno Henrique Lima',     matricula: '2026002', cpf: '222.222.222-22', turmaId: 't01', ativo: true },
    { id: 'a03', nome: 'Carla Fernanda Costa',    matricula: '2026003', cpf: '333.333.333-33', turmaId: 't01', ativo: true },
    { id: 'a04', nome: 'Diego Martins Pereira',   matricula: '2026004', cpf: '444.444.444-44', turmaId: 't02', ativo: true },
    { id: 'a05', nome: 'Eduarda Silva Rocha',     matricula: '2026005', cpf: '555.555.555-55', turmaId: 't02', ativo: true },
    { id: 'a06', nome: 'Felipe Augusto Nunes',    matricula: '2026006', cpf: '666.666.666-66', turmaId: 't02', ativo: true },
    { id: 'a07', nome: 'Gabriela Moura Santos',   matricula: '2026007', cpf: '777.777.777-77', turmaId: 't03', ativo: true },
    { id: 'a08', nome: 'Henrique Barbosa Dias',   matricula: '2026008', cpf: '888.888.888-88', turmaId: 't03', ativo: true },
    { id: 'a09', nome: 'Isabela Teixeira Ferraz', matricula: '2026009', cpf: '999.999.999-99', turmaId: 't03', ativo: true },
    { id: 'a10', nome: 'João Victor Cruz',         matricula: '2026010', cpf: '100.100.100-10', turmaId: 't04', ativo: true },
    { id: 'a11', nome: 'Larissa Vieira Alves',    matricula: '2026011', cpf: '110.110.110-11', turmaId: 't04', ativo: true },
    { id: 'a12', nome: 'Marcos Paulo Ribeiro',    matricula: '2026012', cpf: '120.120.120-12', turmaId: 't05', ativo: true },
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
      tipo: 'urbana', modalidades: ['fundamental_ii'], turnosFuncionamento: ['manhã','tarde'],
      capacidade: 500, ativa: true, criadoEm: '2026-01-15' },
    { id: 'esc02', slug: 'uemanoel', nome: 'U.E. Manoel Beckman', nomeAbreviado: 'U.E. Manoel Beckman',
      codigoINEP: '21045798', endereco: 'Av. Brasil, 450 - Bairro Novo', cidade: 'Viana', estado: 'MA',
      telefone: '(98) 98888-8888', email: 'contato@manoel.edu.ma.gov.br', diretorNome: 'José Ferreira',
      tipo: 'urbana', modalidades: ['fundamental_ii'], turnosFuncionamento: ['manhã','tarde','noite'],
      capacidade: 350, ativa: true, criadoEm: '2026-02-01' },
    { id: 'esc03', slug: 'uesaojoao', nome: 'U.E. São João Batista', nomeAbreviado: 'U.E. São João',
      codigoINEP: '21045801', endereco: 'Estrada do Interior, Km 12', cidade: 'Viana', estado: 'MA',
      telefone: '(98) 97777-7777', email: 'contato@saojoao.edu.ma.gov.br', diretorNome: 'Ana Oliveira',
      tipo: 'rural', modalidades: ['fundamental_ii'], turnosFuncionamento: ['manhã'],
      capacidade: 120, ativa: true, criadoEm: '2026-02-10' },
  ],
};

// Coleções que são arrays (listas de documentos)
const LIST_COLLECTIONS = ['turmas','professores','disciplinas','alunos','notas','frequencia','diario','atividades','aee','avisos','horarios_aula','grade_horaria','eventos_calendario','equipe','galeria','depoimentos','repasses_financeiros','estoque_merenda','circulares','ideb_historico','consumo_merenda','escolas_rede'];
// Coleções que são documentos únicos (singletons)
const SINGLETON_COLLECTIONS = ['escola','config'];

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

// ─── CONFIG HELPERS ──────────────────────────────────────────
function getConfig() { return dbGet('config'); }
function setConfig(updates) {
  const newCfg = { ...getConfig(), ...updates };
  dbSet('config', newCfg);
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

  // 3. Criar documento do usuário
  await db.collection('users').doc(uid).set({
    email: email,
    nome: aluno.nome,
    roles: ['aluno'],
    alunoId: aluno.id,
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
  if (b4 === null || b4 === undefined) return null;
  const notas = [b1, b2, b3, b4].map(n => parseFloat(n) || 0);
  return +(notas.reduce((a,b) => a+b, 0) / 4).toFixed(1);
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

  // Verificar se já tem dados
  try {
    const escolaSnap = await db.collection('escola').doc('info').get();
    if (escolaSnap.exists) {
      console.log('✅ Firestore já tem dados, pulando seed.');
      return false;
    }
  } catch (e) {
    console.warn('Não foi possível verificar dados existentes:', e);
    return false;
  }

  console.log('🌱 Populando Firestore com dados iniciais...');

  try {
    // Singletons
    await db.collection('escola').doc('info').set(SEED.escola);
    await db.collection('config').doc('info').set(SEED.config);

    // Lists
    for (const key of LIST_COLLECTIONS) {
      const items = SEED[key] || [];
      const batch = db.batch();
      items.forEach(item => {
        const ref = db.collection(key).doc(item.id);
        batch.set(ref, item);
      });
      if (items.length > 0) await batch.commit();
    }

    // Criar/atualizar documento do admin no Firestore
    const userSnap = await db.collection('users').doc(adminUid).get();
    if (!userSnap.exists) {
      await db.collection('users').doc(adminUid).set({
        email: currentUser.email,
        nome: 'Administrador',
        roles: ['aluno', 'professor', 'diretor'],
        alunoId: 'a01',
        professorId: 'p01',
        criadoEm: firebase.firestore.FieldValue.serverTimestamp()
      });
      // Vincular uid ao aluno a01
      await db.collection('alunos').doc('a01').update({ uid: adminUid });
    }

    console.log('✅ Seed concluído!');
  } catch (e) {
    console.error('❌ Erro durante o seed:', e);
  }

  return true;
}
