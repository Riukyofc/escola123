// =============================================================
// DASHBOARD.JS — Portal Escolar Completo (Firebase)
// =============================================================

// ── State ─────────────────────────────────────────────────────
let SESSION = null;      // { role, user, name, userData }
let CONFIRM_CB = null;   // callback para modal de confirmação
let FIREBASE_USER = null; // Firebase Auth user object
let USER_DATA = null;     // Firestore user document

// ── SEGURANÇA: Funções anti-XSS ──────────────────────────────
// Escapa caracteres HTML perigosos para prevenir injeção de código
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Alias curto para uso em templates
const esc = escapeHtml;

// ── Nav configs ───────────────────────────────────────────────
const NAV = {
  aluno: [
    { id: 'page-aluno-inicio',      icon: 'fa-gauge-high',       label: 'Início',           sub: 'Resumo geral' },
    { id: 'page-aluno-notas',       icon: 'fa-chart-bar',        label: 'Minhas Notas',     sub: 'Notas por bimestre' },
    { id: 'page-aluno-horario',     icon: 'fa-calendar-week',    label: 'Meu Horário',      sub: 'Grade semanal' },
    { id: 'page-aluno-frequencia',  icon: 'fa-calendar-check',   label: 'Minha Frequência', sub: 'Presença nas aulas' },
    { id: 'page-aluno-diario',      icon: 'fa-book-open',        label: 'Diário de Aulas',  sub: 'Conteúdos ministrados' },
    { id: 'page-aluno-avisos',      icon: 'fa-bell',             label: 'Avisos',           sub: 'Comunicados da escola' },
  ],
  professor: [
    { id: 'page-prof-inicio',     icon: 'fa-gauge-high',      label: 'Início',           sub: 'Visão geral da turma' },
    { id: 'page-prof-notas',      icon: 'fa-pen-to-square',   label: 'Lançar Notas',     sub: 'Notas por bimestre' },
    { id: 'page-prof-turma',      icon: 'fa-users',           label: 'Minha Turma',      sub: 'Lista de alunos' },
    { id: 'page-prof-frequencia', icon: 'fa-calendar-check',  label: 'Frequência',       sub: 'Registro de presença' },
    { id: 'page-prof-diario',     icon: 'fa-book-open',       label: 'Diário Digital',   sub: 'Registros de aula' },
    { id: 'page-prof-atividades', icon: 'fa-clipboard-list',  label: 'Atividades',       sub: 'Exercícios e tarefas' },
    { id: 'page-prof-aee',        icon: 'fa-heart-pulse',     label: 'AEE',              sub: 'Atendimento Especializado' },
    { id: 'page-prof-avisos',     icon: 'fa-bell',            label: 'Avisos',           sub: 'Publicar comunicados' },
  ],
  diretor: [
    { id: 'page-dir-inicio',      icon: 'fa-gauge-high',      label: 'Dashboard',        sub: 'Visão geral da escola' },
    { id: 'page-dir-alunos',      icon: 'fa-user-graduate',   label: 'Alunos',           sub: 'Cadastro de alunos' },
    { id: 'page-dir-professores', icon: 'fa-chalkboard-user', label: 'Professores',      sub: 'Cadastro de professores' },
    { id: 'page-dir-turmas',      icon: 'fa-chalkboard',      label: 'Turmas',           sub: 'Salas e turnos' },
    { id: 'page-dir-horarios',    icon: 'fa-clock',           label: 'Horários',         sub: 'Horários de aula' },
    { id: 'page-dir-relatorios',  icon: 'fa-chart-pie',       label: 'Relatórios',       sub: 'Notas e desempenho' },
    { id: 'page-dir-conteudo',    icon: 'fa-palette',         label: 'Conteúdo do Site',  sub: 'Equipe, galeria e depoimentos' },
    { id: 'page-dir-circulares',  icon: 'fa-scroll',          label: 'Circulares SEMED', sub: 'Ofícios e resoluções' },
    { id: 'page-dir-avisos',      icon: 'fa-bell',            label: 'Avisos',           sub: 'Comunicados gerais' },
    { id: 'page-dir-config',      icon: 'fa-sliders',         label: 'Configurações',    sub: 'Dados e senhas' },
  ],
  secretaria: [
    { id: 'page-sec-inicio',      icon: 'fa-building-columns', label: 'Dashboard',       sub: 'Visão macro da educação' },
    { id: 'page-sec-alunos',      icon: 'fa-user-graduate',    label: 'Alunos',          sub: 'Consulta e edição' },
    { id: 'page-sec-escolas',     icon: 'fa-school',           label: 'Escolas da Rede', sub: 'Cadastro e gestão' },
    { id: 'page-sec-financeiro',  icon: 'fa-money-bill-wave',  label: 'Financeiro',      sub: 'Repasses e merenda' },
    { id: 'page-sec-auditoria',   icon: 'fa-clipboard-check',  label: 'Auditoria',       sub: 'Censo e lotação' },
    { id: 'page-sec-circulares',  icon: 'fa-scroll',           label: 'Circulares',      sub: 'Ofícios e resoluções' },
  ],
};

// =============================================================
// LOGIN / REGISTER (Firebase Auth)
// =============================================================

function switchLoginTab(tab) {
  const loginForm = document.getElementById('login-form');
  const regForm   = document.getElementById('register-form');
  const tabLogin  = document.getElementById('tab-login');
  const tabReg    = document.getElementById('tab-register');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    regForm.style.display   = 'none';
    tabLogin.classList.add('active');
    tabReg.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    regForm.style.display   = 'block';
    tabLogin.classList.remove('active');
    tabReg.classList.add('active');
  }
  // Clear errors
  document.getElementById('login-error').style.display = 'none';
  document.getElementById('reg-error').style.display   = 'none';
}

function togglePwd(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon  = document.getElementById(iconId);
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fa-solid fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fa-solid fa-eye';
  }
}

function formatCPFInput(el) {
  let v = el.value.replace(/\D/g, '');
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  el.value = v;

  // Verificar CPF quando completo
  if (v.replace(/\D/g, '').length === 11) {
    checkCPF(v);
  } else {
    const status = document.getElementById('reg-cpf-status');
    status.style.display = 'none';
  }
}

let cpfCheckTimeout = null;
async function checkCPF(cpf) {
  clearTimeout(cpfCheckTimeout);
  cpfCheckTimeout = setTimeout(async () => {
    const status = document.getElementById('reg-cpf-status');
    status.style.display = 'block';
    status.style.color = 'rgba(255,255,255,0.5)';
    status.innerHTML = '<i class="fa-solid fa-spinner spin"></i> Verificando CPF...';

    try {
      const aluno = await verificarCPF(cpf);
      if (aluno) {
        if (aluno.uid) {
          status.style.color = '#fca5a5';
          status.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> CPF já possui conta cadastrada.`;
        } else {
          status.style.color = '#6ee7b7';
          status.innerHTML = `<i class="fa-solid fa-circle-check"></i> Aluno encontrado: <strong>${esc(aluno.nome)}</strong>`;
        }
      } else {
        status.style.color = '#fca5a5';
        status.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> CPF não encontrado na matrícula.`;
      }
    } catch (e) {
      status.style.color = '#fca5a5';
      status.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Erro ao verificar CPF.`;
    }
  }, 500);
}

// ── LOGIN ──
async function doLogin(e) {
  e.preventDefault();
  const email = document.getElementById('input-email').value.trim();
  const senha = document.getElementById('input-senha').value.trim();

  if (!email || !senha) { showLoginError('Preencha email e senha.'); return; }

  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner spin"></i> Entrando...';

  try {
    await auth.signInWithEmailAndPassword(email, senha);
    // onAuthStateChanged vai tratar o resto
  } catch (e) {
    let msg = 'Email ou senha incorretos.';
    if (e.code === 'auth/user-not-found') msg = 'Email não cadastrado.';
    if (e.code === 'auth/wrong-password') msg = 'Senha incorreta.';
    if (e.code === 'auth/invalid-email') msg = 'Email inválido.';
    if (e.code === 'auth/too-many-requests') msg = 'Muitas tentativas. Aguarde um momento.';
    if (e.code === 'auth/invalid-credential') msg = 'Email ou senha incorretos.';
    showLoginError(msg);
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Entrar no Portal';
  }
}

// ── REGISTER ──
async function doRegister(e) {
  e.preventDefault();
  const cpf    = document.getElementById('reg-cpf').value.trim();
  const email  = document.getElementById('reg-email').value.trim();
  const senha  = document.getElementById('reg-senha').value.trim();
  const senha2 = document.getElementById('reg-senha2').value.trim();

  document.getElementById('reg-error').style.display = 'none';

  if (!cpf || cpf.replace(/\D/g, '').length !== 11) { showRegError('Digite um CPF válido.'); return; }
  if (!email) { showRegError('Digite seu email.'); return; }
  if (senha.length < 6) { showRegError('A senha deve ter no mínimo 6 caracteres.'); return; }
  if (senha !== senha2) { showRegError('As senhas não conferem.'); return; }

  const btn = document.getElementById('reg-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner spin"></i> Criando conta...';

  try {
    await registrarAluno(cpf, email, senha);
    // onAuthStateChanged vai tratar o resto
  } catch (e) {
    let msg = e.message || 'Erro ao criar conta.';
    if (e.code === 'auth/email-already-in-use') msg = 'Este email já está em uso.';
    if (e.code === 'auth/weak-password') msg = 'Senha muito fraca. Use no mínimo 6 caracteres.';
    if (e.code === 'auth/invalid-email') msg = 'Email inválido.';
    showRegError(msg);
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Criar Minha Conta';
  }
}

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  document.getElementById('login-error-msg').textContent = msg;
  el.style.display = 'flex';
}

function showRegError(msg) {
  const el = document.getElementById('reg-error');
  document.getElementById('reg-error-msg').textContent = msg;
  el.style.display = 'flex';
}

function showLoading(msg) {
  const el = document.getElementById('login-loading');
  document.getElementById('login-loading-msg').textContent = msg || 'Conectando ao servidor...';
  el.style.display = 'flex';
}

function hideLoading() {
  document.getElementById('login-loading').style.display = 'none';
}

// ── SESSION ──
async function handleAuthUser(firebaseUser) {
  if (!firebaseUser) {
    // Not logged in — show login screen
    FIREBASE_USER = null;
    USER_DATA = null;
    SESSION = null;
    document.getElementById('dashboard-app').classList.remove('active');
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('login-card').style.display = '';
    document.getElementById('role-selector-card').style.display = 'none';
    hideLoading();
    return;
  }

  FIREBASE_USER = firebaseUser;
  showLoading('Carregando seus dados...');

  try {
    // Load user data from Firestore
    USER_DATA = await getUserData(firebaseUser.uid);

    if (!USER_DATA) {
      // User exists in Auth but not in Firestore — shouldn't happen
      showLoginError('Conta sem perfil configurado. Contate a direção.');
      await auth.signOut();
      hideLoading();
      return;
    }

    // Try to seed Firestore if needed (first-time setup only)
    try { await seedFirestore(); } catch(e) { console.warn('Seed check:', e); }

    // Load all data from Firestore into cache
    await loadAllData();

    // Check roles
    const roles = USER_DATA.roles || [];
    if (roles.length === 0) {
      showLoginError('Conta sem permissão de acesso. Contate a direção.');
      await auth.signOut();
      hideLoading();
      return;
    }

    if (roles.length > 1) {
      // Multiple roles — show role selector
      showRoleSelector(USER_DATA, roles);
    } else {
      // Single role — enter directly
      enterDashboard(roles[0]);
    }
  } catch (e) {
    console.error('Erro ao carregar dados:', e);
    showLoginError('Erro ao conectar ao servidor. Tente novamente.');
    await auth.signOut();
    hideLoading();
  }
}

function showRoleSelector(userData, roles) {
  hideLoading();
  document.getElementById('login-card').style.display = 'none';
  document.getElementById('role-selector-card').style.display = '';
  document.getElementById('rs-user-name').textContent = `Olá, ${userData.nome?.split(' ')[0] || 'Usuário'}!`;

  const roleConfig = {
    aluno:      { icon: 'fa-user-graduate',   label: 'Painel do Aluno',       desc: 'Ver notas, frequência e avisos',       color: '#059669' },
    professor:  { icon: 'fa-chalkboard-user', label: 'Painel do Professor',   desc: 'Lançar notas, diário, atividades',     color: '#2563eb' },
    diretor:    { icon: 'fa-crown',           label: 'Painel da Direção',     desc: 'Gestão completa da escola',            color: '#d97706' },
    secretaria: { icon: 'fa-building-columns',label: 'Painel da Secretaria',  desc: 'Macrogestão, auditoria e indicadores', color: '#991b1b' },
  };

  const list = document.getElementById('rs-roles-list');
  list.innerHTML = roles.map(role => {
    const cfg = roleConfig[role];
    return `
      <button class="hero-access-item" onclick="enterDashboard('${role}')" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:var(--r-md); padding:14px 18px; display:flex; align-items:center; gap:14px; cursor:pointer; transition:var(--t-fast); text-decoration:none; width:100%; color:#fff;">
        <div style="width:42px; height:42px; border-radius:var(--r-sm); background:${cfg.color}22; color:${cfg.color}; display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0;">
          <i class="fa-solid ${cfg.icon}"></i>
        </div>
        <div style="text-align:left;">
          <div style="color:#fff; font-weight:700; font-size:0.9rem;">${cfg.label}</div>
          <div style="color:rgba(255,255,255,0.4); font-size:0.72rem; margin-top:1px;">${cfg.desc}</div>
        </div>
        <i class="fa-solid fa-chevron-right" style="margin-left:auto; color:rgba(255,255,255,0.2); font-size:.72rem;"></i>
      </button>
    `;
  }).join('');
}

function enterDashboard(role) {
  // Build session
  let user = null;
  let name = USER_DATA.nome || 'Usuário';

  if (role === 'aluno' && USER_DATA.alunoId) {
    user = dbFind('alunos', USER_DATA.alunoId);
    if (user) name = user.nome;
  } else if (role === 'professor' && USER_DATA.professorId) {
    user = dbFind('professores', USER_DATA.professorId);
    if (user) name = user.nome;
  } else if (role === 'diretor') {
    name = USER_DATA.nome || 'Diretor(a)';
  } else if (role === 'secretaria') {
    name = USER_DATA.nome || 'Secretaria de Educação';
  }

  SESSION = { role, user, name, userData: USER_DATA };
  hideLoading();
  initDashboard();
}

function doLogout() {
  auth.signOut().then(() => {
    SESSION = null;
    FIREBASE_USER = null;
    USER_DATA = null;
    document.getElementById('dashboard-app').classList.remove('active');
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('login-card').style.display = '';
    document.getElementById('role-selector-card').style.display = 'none';
    // Reset forms
    document.getElementById('input-email').value = '';
    document.getElementById('input-senha').value = '';
    document.getElementById('login-error').style.display = 'none';
    // Reset buttons
    const btn = document.getElementById('login-btn');
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Entrar no Portal';
  });
}

// =============================================================
// DASHBOARD INIT
// =============================================================
function initDashboard() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard-app').classList.add('active');

  buildSidebar();
  updateSystemStatus();
  updateUserInfo();
  updateBellBadge();
  startTopbarClock();

  const firstPage = NAV[SESSION.role][0].id;
  showPage(firstPage);
}

function updateBellBadge() {
  const avisos = dbGetAll('avisos').filter(a => a.ativo);
  const badge = document.getElementById('bell-badge');
  if (badge && avisos.length > 0) {
    badge.textContent = avisos.length;
    badge.style.display = 'flex';
  } else if (badge) {
    badge.style.display = 'none';
  }
}

function buildSidebar() {
  const nav = document.getElementById('sidebar-nav');
  const items = NAV[SESSION.role];
  nav.innerHTML = `<div class="sidebar-section-title">Menu</div>` + items.map(item => `
    <button class="sidebar-link" data-page="${item.id}" onclick="showPage('${item.id}')">
      <i class="fa-solid ${item.icon}"></i>
      ${item.label}
    </button>
  `).join('');

  // Build bottom nav for mobile
  buildBottomNav(items);
}

function updateUserInfo() {
  const name   = SESSION.name;
  const role   = SESSION.role;
  const initial= name.charAt(0).toUpperCase();
  const roleLabels = { aluno:'Aluno', professor:'Professor(a)', diretor:'Diretor(a)', secretaria:'SEMED' };
  const roleClasses= { aluno:'aluno', professor:'professor', diretor:'diretor', secretaria:'secretaria' };

  const sbAvatar = document.getElementById('sb-avatar');
  sbAvatar.textContent = initial;
  sbAvatar.className   = `sidebar-avatar ${roleClasses[role]}`;
  document.getElementById('topbar-avatar').textContent  = initial;
  document.getElementById('sb-name').textContent        = name;
  const badge = document.getElementById('sb-role-badge');
  badge.textContent  = roleLabels[role];
  badge.className    = `role-badge ${roleClasses[role]}`;
}

function buildBottomNav(items) {
  const inner = document.getElementById('bottom-nav-inner');
  if (!inner) return;
  // Show max 5 items on mobile
  const mobileItems = items.slice(0, 5);
  inner.innerHTML = mobileItems.map(item => `
    <button class="bnav-item" data-page="${item.id}" onclick="showPage('${item.id}')">
      <i class="fa-solid ${item.icon}"></i>
      <span>${item.label}</span>
    </button>
  `).join('');
}

function updateSystemStatus() {
  const closed = isSistemaClosed();
  const cfg    = getConfig();

  // Sidebar
  const sbStatus = document.getElementById('sidebar-system-status');
  const sbText   = document.getElementById('sb-sys-text');
  sbStatus.className = `system-status-inner ${closed ? 'closed' : 'open'}`;
  sbText.textContent = closed ? 'Sistema fechado' : 'Sistema aberto';

  // Topbar
  const tb    = document.getElementById('topbar-system-badge');
  const tbSpan= tb.querySelector('span');
  tb.className = `topbar-system-badge ${closed ? 'closed' : 'open'}`;
  tbSpan.textContent = closed ? 'Sistema Fechado' : 'Sistema Aberto';

  // Director panel
  if (SESSION && SESSION.role === 'diretor') {
    const toggle  = document.getElementById('dir-sys-toggle');
    const title   = document.getElementById('dir-sys-title');
    const time    = document.getElementById('dir-sys-time');
    const label   = document.getElementById('dir-sys-label');

    if (toggle) {
      toggle.checked = !closed; // checked = sistema ABERTO
      if (title) title.textContent = closed ? 'Sistema Fechado ⚠️' : 'Sistema Aberto ✅';
      if (label) label.textContent = closed ? 'FECHADO' : 'ABERTO';
      if (time && cfg.dataFechamento && closed) {
        time.textContent = `Fechado em ${formatDateTime(cfg.dataFechamento)}`;
      } else if (time) {
        time.textContent = '';
      }
    }
  }

  // Prof banners
  if (SESSION && (SESSION.role === 'professor' || SESSION.role === 'aluno')) {
    const banners = document.querySelectorAll(
      '#prof-closed-banner, #prof-notas-closed-banner, #aluno-closed-banner'
    );
    const cfg2 = getConfig();
    banners.forEach(b => {
      b.style.display = closed ? 'flex' : 'none';
      if (closed && cfg2.dataFechamento) {
        const sub = b.querySelector('.closed-banner-sub');
        if (sub && sub.id !== 'prof-notas-closed-time') {
          sub.textContent = `Fechado em ${formatDateTime(cfg2.dataFechamento)}`;
        }
      }
    });
    const pct = document.getElementById('prof-closed-time');
    const pnct= document.getElementById('prof-notas-closed-time');
    if (closed && cfg2.dataFechamento) {
      if (pct)  pct.textContent  = `Fechado em ${formatDateTime(cfg2.dataFechamento)}`;
      if (pnct) pnct.textContent = `Fechado em ${formatDateTime(cfg2.dataFechamento)}`;
    }
  }
}

// =============================================================
// PAGE NAVIGATION
// =============================================================
function showPage(pageId) {
  // Deactivate all pages
  document.querySelectorAll('.dash-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.bnav-item').forEach(b => b.classList.remove('active'));

  const page = document.getElementById(pageId);
  if (!page) return;
  page.classList.add('active');

  // Activate sidebar link
  const link = document.querySelector(`.sidebar-link[data-page="${pageId}"]`);
  if (link) link.classList.add('active');

  // Activate bottom nav link
  const bnav = document.querySelector(`.bnav-item[data-page="${pageId}"]`);
  if (bnav) bnav.classList.add('active');

  // Update topbar title
  const navItem = NAV[SESSION.role]?.find(n => n.id === pageId);
  if (navItem) {
    document.getElementById('topbar-page-title').textContent = navItem.label;
    document.getElementById('topbar-page-sub').textContent   = navItem.sub;
  }

  // Close sidebar on mobile
  closeSidebar();

  // Update system status
  updateSystemStatus();

  // Load page data
  loadPageData(pageId);
}

function loadPageData(pageId) {
  switch (pageId) {
    case 'page-aluno-inicio':     loadAlunoInicio();    break;
    case 'page-aluno-notas':      loadAlunoNotas();     break;
    case 'page-aluno-frequencia': loadAlunoFrequencia(); break;
    case 'page-aluno-horario':    loadAlunoHorario();    break;
    case 'page-aluno-diario':     loadAlunoDiario();     break;
    case 'page-aluno-avisos':     loadAvisosPage('aluno-avisos-body'); break;

    case 'page-prof-inicio':      loadProfInicio();     break;
    case 'page-prof-notas':       loadProfNotasSetup(); break;
    case 'page-prof-turma':       loadProfTurmaSetup(); break;
    case 'page-prof-frequencia':  loadFreqSetup();      break;
    case 'page-prof-diario':      loadDiarioPage();     break;
    case 'page-prof-atividades':  loadAtividades();     break;
    case 'page-prof-aee':         loadAEE();            break;
    case 'page-prof-avisos':      loadAvisosPage('prof-avisos-body', true); break;

    case 'page-dir-inicio':       loadDirInicio();      break;
    case 'page-dir-alunos':       loadDirAlunos();      break;
    case 'page-dir-professores':  loadDirProfessores(); break;
    case 'page-dir-turmas':       loadDirTurmas();      break;
    case 'page-dir-horarios':     loadDirHorarios();    break;
    case 'page-dir-relatorios':   loadRelatorio();      break;
    case 'page-dir-conteudo':     loadDirConteudo();    break;
    case 'page-dir-circulares':   loadDirCirculares();  break;
    case 'page-dir-avisos':       loadAllAvisos();      break;
    case 'page-dir-config':       loadConfigPage();     break;

    // ── SEMED ──
    case 'page-sec-inicio':       loadSecInicio();      break;
    case 'page-sec-alunos':       loadSecAlunos();      break;
    case 'page-sec-escolas':      loadSecEscolas();     break;
    case 'page-sec-financeiro':   loadSecFinanceiro();  break;
    case 'page-sec-auditoria':    loadSecAuditoria();   break;
    case 'page-sec-circulares':   loadSecCirculares();  break;
  }
}

// =============================================================
// MOBILE SIDEBAR
// =============================================================
function toggleSidebar() {
  document.getElementById('dash-sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}

function closeSidebar() {
  document.getElementById('dash-sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

// =============================================================
// HELPERS
// =============================================================
function notaBadge(nota, notaMin) {
  if (nota === null || nota === undefined) return `<span class="nota-anual-badge pendente">—</span>`;
  const aprov = nota >= notaMin;
  return `<span class="nota-anual-badge ${aprov ? 'aprovado' : 'reprovado'}">
    <i class="fa-solid ${aprov ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>
    ${nota.toFixed(1)}
  </span>`;
}

function situacaoBadge(notaAnual, notaMin) {
  if (notaAnual === null) return `<span class="badge badge-gray">Em andamento</span>`;
  return notaAnual >= notaMin
    ? `<span class="badge badge-green"><i class="fa-solid fa-check"></i> Aprovado</span>`
    : `<span class="badge badge-red"><i class="fa-solid fa-xmark"></i> Reprovado</span>`;
}

function renderNota(n) {
  return (n === null || n === undefined) ? '—' : parseFloat(n).toFixed(1);
}

function turnoIcon(turno) {
  const map = { 'manhã': '🌅', 'tarde': '☀️', 'noite': '🌙' };
  return map[turno] || '📅';
}

function buildEmptyState(msg = 'Nenhum registro encontrado.') {
  return `<div class="empty-state">
    <div class="empty-state-icon"><i class="fa-solid fa-folder-open"></i></div>
    <div class="empty-state-title">${esc(msg)}</div>
  </div>`;
}

function fillSelectTurmas(selectId, selected = '') {
  const sel    = document.getElementById(selectId);
  if (!sel) return;
  const turmas = dbGetAll('turmas').filter(t => t.ativo);
  const firstOpt = sel.querySelector('option[value=""]');
  const defaultText = firstOpt ? firstOpt.textContent : 'Selecione a turma...';
  sel.innerHTML = `<option value="">${esc(defaultText)}</option>`;
  const opts   = turmas.map(t =>
    `<option value="${esc(t.id)}" ${t.id === selected ? 'selected' : ''}>${esc(t.nome)} (${turnoIcon(t.turno)} ${esc(t.turno)})</option>`
  ).join('');
  sel.innerHTML += opts;
}

function fillSelectDiscs(selectId, selected = '') {
  const sel  = document.getElementById(selectId);
  if (!sel) return;
  const discs= dbGetAll('disciplinas').filter(d => d.ativo);
  const firstOpt = sel.querySelector('option[value=""]');
  const defaultText = firstOpt ? firstOpt.textContent : 'Selecione disciplina...';
  sel.innerHTML = `<option value="">${esc(defaultText)}</option>`;
  const opts = discs.map(d =>
    `<option value="${esc(d.id)}" ${d.id === selected ? 'selected' : ''}>${esc(d.nome)}</option>`
  ).join('');
  sel.innerHTML += opts;
}

function fillSelectAlunos(selectId, selected = '') {
  const sel    = document.getElementById(selectId);
  if (!sel) return;
  const alunos = dbGetAll('alunos').filter(a => a.ativo);
  sel.innerHTML = alunos.map(a =>
    `<option value="${esc(a.id)}" ${a.id === selected ? 'selected' : ''}>${esc(a.nome)} (${esc(a.matricula)})</option>`
  ).join('');
}

function fillSelectProfs(selectId, selected = '') {
  const sel  = document.getElementById(selectId);
  if (!sel) return;
  const profs= dbGetAll('professores').filter(p => p.ativo);
  sel.innerHTML = `<option value="">Sem professor</option>` +
    profs.map(p => `<option value="${esc(p.id)}" ${p.id === selected ? 'selected' : ''}>${esc(p.nome)}</option>`).join('');
}

function getMyTurmas() {
  if (SESSION.role === 'diretor') return dbGetAll('turmas').filter(t => t.ativo);
  // Professor: filtra pelas turmas atribuídas ao professor logado
  if (SESSION.user && SESSION.user.turmaIds && SESSION.user.turmaIds.length) {
    return dbGetAll('turmas').filter(t => t.ativo && SESSION.user.turmaIds.includes(t.id));
  }
  // Fallback: retorna todas se o professor não tiver turmas atribuídas
  return dbGetAll('turmas').filter(t => t.ativo);
}

// =============================================================
// ALUNO PAGES
// =============================================================
function loadAlunoInicio() {
  const aluno   = SESSION.user;
  const turma   = dbFind('turmas', aluno.turmaId);
  const notas   = getNotasAluno(aluno.id);
  const cfg     = getConfig();

  // Welcome banner
  const wbNome  = document.getElementById('wb-aluno-nome');
  const wbTurma = document.getElementById('wb-aluno-turma');
  const wbAvatar= document.getElementById('wb-aluno-avatar');
  if (wbNome)   wbNome.textContent  = `${getGreeting()}, ${aluno.nome.split(' ')[0]}!`;
  if (wbTurma)  wbTurma.textContent = turma ? `${turma.nome} · ${turnoIcon(turma.turno)} Turno ${turma.turno}` : '—';
  if (wbAvatar) wbAvatar.textContent = aluno.nome.charAt(0).toUpperCase();

  // Stats
  const disciplinas = dbGetAll('disciplinas').filter(d => d.ativo);
  let totalAprov = 0; let totalRep = 0;
  notas.forEach(n => {
    const anual = getNotaAnual(n.b1, n.b2, n.b3, n.b4);
    if (anual !== null) { if (anual >= cfg.notaMinima) totalAprov++; else totalRep++; }
  });

  // Frequency
  const freqAll = dbGetAll('frequencia').filter(f => f.turmaId === aluno.turmaId);
  let totalAulas = 0, presencas = 0;
  freqAll.forEach(f => {
    const aula = f.aulas.find(a => a.alunoId === aluno.id);
    const qtd = f.qtdAulas || 1;
    if (aula) { totalAulas += qtd; if (aula.status === 'presente') presencas += qtd; }
  });
  const freqPct = totalAulas > 0 ? ((presencas / totalAulas) * 100).toFixed(0) : '—';

  // Welcome banner stats
  const wbDisc = document.getElementById('wb-stat-disc');
  const wbAprov = document.getElementById('wb-stat-aprov');
  const wbFreq = document.getElementById('wb-stat-freq');
  if (wbDisc)  wbDisc.textContent  = disciplinas.length;
  if (wbAprov) wbAprov.textContent = totalAprov;
  if (wbFreq)  wbFreq.textContent  = freqPct;

  // Bimestre badge
  const bimBadge = document.getElementById('aluno-bim-badge');
  if (bimBadge) bimBadge.textContent = `${cfg.bimestreAtual}º Bimestre`;

  const st = document.getElementById('aluno-stats-row');
  st.innerHTML = `
    <div class="stat-card">
      <div class="stat-card-header"><span class="stat-card-label">Minha Turma</span><div class="stat-icon blue"><i class="fa-solid fa-users"></i></div></div>
      <div class="stat-num">${turma ? turma.nome : '—'}</div>
      <div class="stat-desc">${turma ? `${turnoIcon(turma.turno)} Turno ${turma.turno}` : ''}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-header"><span class="stat-card-label">Disciplinas</span><div class="stat-icon purple"><i class="fa-solid fa-layer-group"></i></div></div>
      <div class="stat-num">${disciplinas.length}</div>
      <div class="stat-desc">disciplinas no currículo</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-header"><span class="stat-card-label">Aprovações</span><div class="stat-icon green"><i class="fa-solid fa-circle-check"></i></div></div>
      <div class="stat-num" style="color:var(--success)">${totalAprov}</div>
      <div class="stat-desc">após 4º bimestre</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-header"><span class="stat-card-label">Em Recuperação</span><div class="stat-icon red"><i class="fa-solid fa-circle-xmark"></i></div></div>
      <div class="stat-num" style="color:var(--danger)">${totalRep}</div>
      <div class="stat-desc">após 4º bimestre</div>
    </div>
  `;

  // Resumo de notas
  const body = document.getElementById('aluno-notas-resumo');
  body.innerHTML = renderAlunoNotasTable(aluno.id, cfg.notaMinima);

  // Render student individual charts
  renderAlunoCharts();
}

function loadAlunoNotas() {
  const aluno = SESSION.user;
  const turma = dbFind('turmas', aluno.turmaId);
  const cfg   = getConfig();
  document.getElementById('aluno-nome-notas').textContent = aluno.nome;
  const turmaBadge = document.getElementById('aluno-turma-badge-notas');
  if (turmaBadge && turma) turmaBadge.textContent = `${turma.nome} · ${turma.turno}`;
  document.getElementById('aluno-notas-tbody').innerHTML =
    renderAlunoNotasRows(aluno.id, cfg.notaMinima);
}

function renderAlunoNotasTable(alunoId, notaMin) {
  const rows = renderAlunoNotasRows(alunoId, notaMin);
  return `
    <div style="overflow-x:auto">
      <table class="data-table">
        <thead>
          <tr>
            <th>Disciplina</th>
            <th class="text-center">1º Bim</th>
            <th class="text-center">2º Bim</th>
            <th class="text-center">3º Bim</th>
            <th class="text-center">4º Bim</th>
            <th class="text-center">Nota Anual</th>
            <th class="text-center">Situação</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderAlunoNotasRows(alunoId, notaMin) {
  const disciplinas = dbGetAll('disciplinas').filter(d => d.ativo);
  const notas       = getNotasAluno(alunoId);

  return disciplinas.map(d => {
    const nota  = notas.find(n => n.disciplinaId === d.id);
    const b1    = nota?.b1  ?? null; const b2 = nota?.b2 ?? null;
    const b3    = nota?.b3  ?? null; const b4 = nota?.b4 ?? null;
    const anual = getNotaAnual(b1, b2, b3, b4);

    const cell = (v) => {
      if (v === null) return `<td class="text-center" style="color:var(--text-muted)">—</td>`;
      const color = v >= notaMin ? 'var(--success)' : 'var(--danger)';
      return `<td class="text-center" style="font-weight:700; color:${color}">${parseFloat(v).toFixed(1)}</td>`;
    };

    return `<tr>
      <td style="font-weight:600">${esc(d.nome)}</td>
      ${cell(b1)}${cell(b2)}${cell(b3)}${cell(b4)}
      <td class="text-center">${notaBadge(anual, notaMin)}</td>
      <td class="text-center">${situacaoBadge(anual, notaMin)}</td>
    </tr>`;
  }).join('');
}

// =============================================================
// ALUNO: FREQUÊNCIA
// =============================================================
function loadAlunoFrequencia() {
  const aluno  = SESSION.user;
  const body   = document.getElementById('aluno-freq-body');
  const nomeEl = document.getElementById('aluno-nome-freq');
  if (nomeEl) nomeEl.textContent = aluno.nome;
  if (!body) return;

  const turma   = dbFind('turmas', aluno.turmaId);
  const freqAll = dbGetAll('frequencia').filter(f => f.turmaId === aluno.turmaId);

  if (!freqAll.length) {
    body.innerHTML = buildEmptyState('Nenhum registro de frequência ainda.');
    return;
  }

  const sorted = [...freqAll].sort((a, b) => b.data.localeCompare(a.data));

  let totalAulas = 0, presencas = 0, faltas = 0, justificados = 0;
  sorted.forEach(f => {
    const aula = f.aulas.find(a => a.alunoId === aluno.id);
    const qtd  = f.qtdAulas || 1;
    if (aula) {
      totalAulas += qtd;
      if (aula.status === 'presente')     presencas += qtd;
      else if (aula.status === 'falta')   faltas += qtd;
      else if (aula.status === 'justificado') justificados += qtd;
    }
  });

  const pct = totalAulas > 0 ? ((presencas / totalAulas) * 100).toFixed(1) : '—';
  const statusFreq = totalAulas > 0 && (presencas / totalAulas) >= 0.75
    ? '<span class="badge badge-green"><i class="fa-solid fa-check"></i> Regular</span>'
    : totalAulas > 0
      ? '<span class="badge badge-red"><i class="fa-solid fa-xmark"></i> Em Risco</span>'
      : '<span class="badge badge-gray">Sem dados</span>';

  body.innerHTML = `
    <div class="stats-row" style="margin-bottom:20px">
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-card-label">Total de Aulas</span><div class="stat-icon blue"><i class="fa-solid fa-calendar"></i></div></div>
        <div class="stat-num">${totalAulas}</div>
        <div class="stat-desc">aulas registradas</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-card-label">Presenças</span><div class="stat-icon green"><i class="fa-solid fa-circle-check"></i></div></div>
        <div class="stat-num" style="color:var(--success)">${presencas}</div>
        <div class="stat-desc">aulas presentes</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-card-label">Faltas</span><div class="stat-icon red"><i class="fa-solid fa-circle-xmark"></i></div></div>
        <div class="stat-num" style="color:var(--danger)">${faltas}</div>
        <div class="stat-desc">aulas perdidas</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header"><span class="stat-card-label">Frequência</span><div class="stat-icon ${parseFloat(pct) >= 75 ? 'blue' : 'red'}"><i class="fa-solid fa-percent"></i></div></div>
        <div class="stat-num" style="color:${parseFloat(pct) >= 75 ? 'var(--success)' : 'var(--danger)'}">${pct}%</div>
        <div class="stat-desc">${statusFreq}</div>
      </div>
    </div>

    <div style="overflow-x:auto">
      <table class="data-table">
        <thead>
          <tr>
            <th>Data</th>
            <th class="text-center">Aulas</th>
            <th class="text-center">Situação</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map(f => {
            const aula = f.aulas.find(a => a.alunoId === aluno.id);
            const status = aula ? aula.status : null;
            const qtd = f.qtdAulas || 1;
            const badge = status === 'presente'
              ? '<span class="badge badge-green"><i class="fa-solid fa-check"></i> Presente</span>'
              : status === 'falta'
                ? '<span class="badge badge-red"><i class="fa-solid fa-xmark"></i> Falta</span>'
                : status === 'justificado'
                  ? '<span class="badge badge-yellow">📋 Justificado</span>'
                  : '<span class="badge badge-gray">—</span>';
            return `<tr>
              <td><i class="fa-regular fa-calendar" style="color:var(--secondary);margin-right:6px"></i>${formatDate(f.data)}</td>
              <td class="text-center"><span class="badge badge-amber">${qtd}x</span></td>
              <td class="text-center">${badge}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

// =============================================================
// ALUNO: MEU HORÁRIO SEMANAL
// =============================================================
const DIAS_SEMANA = ['','Segunda','Terça','Quarta','Quinta','Sexta'];
const DIAS_SEMANA_CURTO = ['','Seg','Ter','Qua','Qui','Sex'];

function loadAlunoHorario() {
  const aluno = SESSION.user;
  const body  = document.getElementById('aluno-horario-body');
  if (!body) return;

  const turma = dbFind('turmas', aluno.turmaId);
  const grade = dbGetAll('grade_horaria').filter(g => g.turmaId === aluno.turmaId);
  const discs = dbGetAll('disciplinas');
  const profs = dbGetAll('professores');

  if (!grade.length) {
    body.innerHTML = buildEmptyState('Horário ainda não definido para sua turma.');
    return;
  }

  // Group by day
  const byDay = {};
  for (let d = 1; d <= 5; d++) byDay[d] = grade.filter(g => g.diaSemana === d).sort((a,b) => a.ordem - b.ordem);

  // Find max slots per day
  const maxSlots = Math.max(...Object.values(byDay).map(arr => arr.length), 1);

  let html = `
    <div style="margin-bottom:16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <div style="font-weight:800;font-size:1rem;color:var(--text)">${turma ? esc(turma.nome) : ''}</div>
      ${turma ? `<span class="badge badge-blue">${turnoIcon(turma.turno)} ${esc(turma.turno)}</span>` : ''}
      <span style="color:var(--text-muted);font-size:.78rem">${grade.reduce((s,g)=>s+g.qtdAulas,0)} aulas/semana</span>
    </div>
    <div class="schedule-grid">
      <div class="schedule-header">
        ${[1,2,3,4,5].map(d => `<div class="schedule-header-cell">${DIAS_SEMANA[d]}</div>`).join('')}
      </div>
      <div class="schedule-body">
        ${[1,2,3,4,5].map(d => `
          <div class="schedule-day-col">
            ${byDay[d].map(slot => {
              const disc = discs.find(x => x.id === slot.disciplinaId);
              const prof = profs.find(x => x.id === slot.professorId);
              return `<div class="schedule-slot" style="border-left:3px solid ${disc?.cor || '#666'}">
                <div class="schedule-slot-name"><i class="fa-solid ${disc?.icone || 'fa-book'}" style="color:${disc?.cor || '#666'}"></i> ${esc(disc?.nome || '?')}</div>
                <div class="schedule-slot-info">${slot.qtdAulas > 1 ? `<span class="badge badge-amber" style="font-size:.6rem;padding:1px 6px">${slot.qtdAulas} aulas</span>` : '<span style="font-size:.68rem;color:var(--text-muted)">1 aula</span>'}</div>
                <div class="schedule-slot-prof">${esc(prof?.nome?.split(' ')[0] || '?')}</div>
              </div>`;
            }).join('')}
            ${byDay[d].length === 0 ? '<div class="schedule-slot empty"><i class="fa-solid fa-minus" style="color:var(--text-muted)"></i></div>' : ''}
          </div>
        `).join('')}
      </div>
    </div>`;

  body.innerHTML = html;
}

// =============================================================
// AVISOS PAGE (Aluno + Professor + Diretor)
// =============================================================
function loadAvisosPage(bodyId, showActions = false) {
  const body   = document.getElementById(bodyId);
  const avisos = dbGetAll('avisos').filter(a => a.ativo);
  if (!body) return;

  if (!avisos.length) { body.innerHTML = buildEmptyState('Nenhum aviso publicado.'); return; }

  const tipoIcon = { info:'fa-circle-info', urgente:'fa-triangle-exclamation', sucesso:'fa-circle-check', geral:'fa-bullhorn' };
  const tipoBg   = { info:'var(--info-light)', urgente:'var(--danger-light)', sucesso:'var(--success-light)', geral:'var(--bg)' };
  const tipoClr  = { info:'var(--secondary)', urgente:'var(--danger)', sucesso:'var(--success)', geral:'var(--text-muted)' };

  body.innerHTML = avisos.map(av => `
    <div class="dash-aviso-item">
      <div class="dash-aviso-icon" style="background:${tipoBg[av.tipo]||'var(--bg)'}; color:${tipoClr[av.tipo]||'var(--text-muted)'}">
        <i class="fa-solid ${tipoIcon[av.tipo]||'fa-bullhorn'}"></i>
      </div>
      <div style="flex:1; min-width:0">
        <div class="dash-aviso-title">${esc(av.titulo)}</div>
        <div class="dash-aviso-body">${esc(av.corpo)}</div>
        <div class="dash-aviso-date"><i class="fa-regular fa-calendar"></i> ${formatDate(av.dataCriacao)}
          ${av.turmaId ? `<span style="margin-left:8px; background:var(--info-light); color:var(--secondary); padding:2px 8px; border-radius:99px; font-size:.7rem; font-weight:700">Turma específica</span>` : ''}
        </div>
      </div>
      ${showActions ? `
      <div style="display:flex; align-items:flex-start; gap:6px; flex-shrink:0">
        <button class="btn btn-sm btn-danger" onclick="confirmAction('Excluir este aviso?', () => deleteAviso('${av.id}'))">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>` : ''}
    </div>
  `).join('');
}

function loadAllAvisos() {
  loadAvisosPage('dir-avisos-all-body', true);
}

function deleteAviso(id) {
  dbDelete('avisos', id);
  toast('Aviso excluído.', 'success');
  loadAllAvisos();
  closeModal('modal-confirm');
}

// =============================================================
// PROFESSOR: INÍCIO
// =============================================================
function loadProfInicio() {
  const turmas  = getMyTurmas();
  const alunos  = dbGetAll('alunos').filter(a => a.ativo);
  const atividades = dbGetAll('atividades').filter(a => a.ativo);
  const aees    = dbGetAll('aee');

  // Welcome banner
  const wbNome = document.getElementById('wb-prof-nome');
  const wbTurmas = document.getElementById('wb-prof-turmas');
  const wbAvatar = document.getElementById('wb-prof-avatar');
  if (wbNome)   wbNome.textContent  = `${getGreeting()}, ${SESSION.name.split(' ')[0]}!`;
  if (wbTurmas) wbTurmas.textContent = turmas.length > 0 ? `${turmas.map(t=>t.nome).join(', ')}` : 'Nenhuma turma atribuída';
  if (wbAvatar) wbAvatar.textContent = SESSION.name.charAt(0).toUpperCase();

  // Welcome banner stats
  const myAlunos = alunos.filter(a => turmas.some(t => t.id === a.turmaId));
  const wbStatTurmas = document.getElementById('wb-stat-turmas');
  const wbStatAlunos = document.getElementById('wb-stat-alunos');
  const wbStatAee = document.getElementById('wb-stat-aee');
  if (wbStatTurmas) wbStatTurmas.textContent = turmas.length;
  if (wbStatAlunos) wbStatAlunos.textContent = myAlunos.length;
  if (wbStatAee)    wbStatAee.textContent = aees.length;

  const st = document.getElementById('prof-stats-row');
  st.innerHTML = `
    <div class="stat-card">
      <div class="stat-card-header"><span class="stat-card-label">Minhas Turmas</span><div class="stat-icon blue"><i class="fa-solid fa-chalkboard"></i></div></div>
      <div class="stat-num">${turmas.length}</div>
      <div class="stat-desc">turmas ativas</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-header"><span class="stat-card-label">Total de Alunos</span><div class="stat-icon green"><i class="fa-solid fa-user-graduate"></i></div></div>
      <div class="stat-num">${alunos.length}</div>
      <div class="stat-desc">alunos matriculados</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-header"><span class="stat-card-label">Atividades</span><div class="stat-icon amber"><i class="fa-solid fa-clipboard-list"></i></div></div>
      <div class="stat-num">${atividades.length}</div>
      <div class="stat-desc">publicadas</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-header"><span class="stat-card-label">Fichas AEE</span><div class="stat-icon purple"><i class="fa-solid fa-heart-pulse"></i></div></div>
      <div class="stat-num">${aees.length}</div>
      <div class="stat-desc">alunos com atendimento</div>
    </div>
  `;

  const resumo = document.getElementById('prof-turmas-resumo');
  if (!turmas.length) { resumo.innerHTML = buildEmptyState('Nenhuma turma atribuída.'); return; }

  resumo.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px">
      ${turmas.map(t => {
        const qtd = alunos.filter(a => a.turmaId === t.id).length;
        return `
          <div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-lg); padding:18px; cursor:pointer; transition:var(--transition-fast)"
               onclick="showPage('page-prof-notas')"
               onmouseenter="this.style.borderColor='var(--secondary-light)'"
               onmouseleave="this.style.borderColor='var(--border)'">
            <div style="font-weight:800; color:var(--primary); font-size:1rem; margin-bottom:4px">${t.nome}</div>
            <div style="color:var(--text-muted); font-size:.78rem; margin-bottom:10px">${turnoIcon(t.turno)} Turno ${t.turno}</div>
            <div style="display:flex; align-items:center; gap:8px">
              <span style="background:var(--info-light); color:var(--secondary); padding:3px 10px; border-radius:99px; font-size:.72rem; font-weight:700">
                ${qtd} alunos
              </span>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

// =============================================================
// PROFESSOR: NOTAS
// =============================================================
function loadProfNotasSetup() {
  const turmasSel = document.getElementById('notas-select-turma');
  const discsSel  = document.getElementById('notas-select-disc');
  if (!turmasSel.options.length || turmasSel.options.length <= 1) {
    turmasSel.innerHTML = '<option value="">Selecione a turma...</option>';
    fillSelectTurmas('notas-select-turma');
  }
  if (!discsSel.options.length || discsSel.options.length <= 1) {
    discsSel.innerHTML = '<option value="">Selecione disciplina...</option>';
    fillSelectDiscs('notas-select-disc');
  }
}

function loadNotasTurma() {
  const turmaId = document.getElementById('notas-select-turma').value;
  const discId  = document.getElementById('notas-select-disc').value;
  const bimestre= document.getElementById('notas-select-bimestre').value;
  const tbody   = document.getElementById('notas-tbody');
  const saveBar = document.getElementById('notas-save-bar');
  const cfg     = getConfig();
  const closed  = isSistemaClosed();

  if (!turmaId || !discId) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:28px; color:var(--text-muted)">
      <i class="fa-solid fa-arrow-up" style="margin-right:6px"></i>Selecione turma e disciplina
    </td></tr>`;
    saveBar.style.display = 'none';
    return;
  }

  const alunos = dbGetAll('alunos').filter(a => a.turmaId === turmaId && a.ativo);
  if (!alunos.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:28px; color:var(--text-muted)">Nenhum aluno nesta turma</td></tr>`;
    return;
  }

  tbody.innerHTML = alunos.map(a => {
    const notas = dbGetAll('notas').find(n => n.alunoId === a.id && n.disciplinaId === discId);
    const b1 = notas?.b1 ?? ''; const b2 = notas?.b2 ?? '';
    const b3 = notas?.b3 ?? ''; const b4 = notas?.b4 ?? '';
    const b1f = b1 !== '' ? parseFloat(b1) : null;
    const b2f = b2 !== '' ? parseFloat(b2) : null;
    const b3f = b3 !== '' ? parseFloat(b3) : null;
    const b4f = b4 !== '' ? parseFloat(b4) : null;
    const anual = getNotaAnual(b1f, b2f, b3f, b4f);

    const noteInput = (val, bim) => {
      const v = val !== null && val !== '' ? parseFloat(val).toFixed(1) : '';
      const isActive = String(bim) === String(bimestre);
      const cls = isActive && !closed ? 'nota-input' : 'nota-input';
      return `<td class="text-center">
        <input type="number" step="0.5" min="0" max="10"
               class="${cls}" value="${v}"
               data-aluno="${a.id}" data-disc="${discId}" data-bim="${bim}"
               ${(closed || !isActive) ? 'disabled' : ''}
               onchange="onNotaChange(this)"
               style="background:${isActive && !closed ? '#fff' : 'var(--bg)'}">
      </td>`;
    };

    return `<tr>
      <td style="font-weight:600">${a.nome}</td>
      <td style="color:var(--text-muted); font-size:.82rem">${a.matricula}</td>
      ${noteInput(b1, 1)}${noteInput(b2, 2)}${noteInput(b3, 3)}${noteInput(b4, 4)}
      <td class="text-center">${notaBadge(anual, cfg.notaMinima)}</td>
      <td class="text-center">${situacaoBadge(anual, cfg.notaMinima)}</td>
    </tr>`;
  }).join('');

  saveBar.style.display = closed ? 'none' : '';
  const btn = document.getElementById('btn-salvar-notas');
  if (btn) btn.disabled = closed;

  // Highlight active bimestre column header
  highlightActiveBimestre(bimestre);
  // Update nota counters
  updateNotaCounters();
}

function onNotaChange(input) {
  // Real-time save
  const alunoId = input.dataset.aluno;
  const discId  = input.dataset.disc;
  const bim     = parseInt(input.dataset.bim);
  const valor   = input.value;

  if (isSistemaClosed()) {
    toast('Sistema fechado. Notas não podem ser alteradas.', 'error');
    input.value = '';
    return;
  }

  if (valor !== '' && (parseFloat(valor) < 0 || parseFloat(valor) > 10)) {
    input.style.borderColor = 'var(--danger)';
    return;
  }
  input.style.borderColor = '';
  salvarNota(alunoId, discId, bim, valor);

  // Visual feedback — green flash
  input.classList.remove('saved-flash');
  void input.offsetWidth; // trigger reflow
  input.classList.add('saved-flash');

  // Recalculate anual in same row
  const row = input.closest('tr');
  if (row) {
    const inputs = row.querySelectorAll('.nota-input');
    const cfg = getConfig();
    const vals = Array.from(inputs).map(i => i.value !== '' ? parseFloat(i.value) : null);
    const anual = getNotaAnual(vals[0], vals[1], vals[2], vals[3]);
    const cells = row.querySelectorAll('td');
    const anualIdx = cells.length - 2;
    const sitIdx   = cells.length - 1;
    if (cells[anualIdx]) cells[anualIdx].innerHTML = notaBadge(anual, cfg.notaMinima);
    if (cells[sitIdx])   cells[sitIdx].innerHTML   = situacaoBadge(anual, cfg.notaMinima);
  }

  // Update counters
  updateNotaCounters();
}

function saveTodasNotas() {
  toast('Notas salvas com sucesso!', 'success');
}

// =============================================================
// PROFESSOR: TURMA
// =============================================================
function loadProfTurmaSetup() {
  const sel = document.getElementById('turma-select');
  if (!sel) return;
  if (sel.options.length <= 1) {
    sel.innerHTML = '<option value="">Selecione a turma...</option>';
    fillSelectTurmas('turma-select');
  }
}

function loadAlunosTurma() {
  const turmaId = document.getElementById('turma-select').value;
  const body    = document.getElementById('turma-alunos-body');
  const turma   = dbFind('turmas', turmaId);

  if (!turmaId || !turma) {
    body.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-users"></i></div><div class="empty-state-title">Selecione uma turma</div></div>`;
    return;
  }

  const alunos = dbGetAll('alunos').filter(a => a.turmaId === turmaId && a.ativo);
  if (!alunos.length) {
    body.innerHTML = buildEmptyState('Nenhum aluno nesta turma.');
    return;
  }

  body.innerHTML = `<div class="table-scroll"><table class="data-table"><thead><tr><th>#</th><th>Nome</th><th>Matrícula</th><th>Turma</th><th>Turno</th></tr></thead><tbody id="turma-alunos-tbody">
    ${alunos.map((a, i) => `
      <tr>
        <td style="color:var(--text-muted); font-weight:700">${String(i+1).padStart(2,'0')}</td>
        <td style="font-weight:700">${esc(a.nome)}</td>
        <td style="color:var(--text-muted)">${esc(a.matricula)}</td>
        <td><span class="badge badge-blue">${esc(turma.nome)}</span></td>
        <td>${turnoIcon(turma.turno)} ${turma.turno}</td>
      </tr>
    `).join('')}
  </tbody></table></div>`;
}

function filterAlunosList() {
  const search = (document.getElementById('turma-search')?.value || '').toLowerCase();
  const tbody = document.getElementById('turma-alunos-tbody');
  if (!tbody) return;
  const rows = tbody.querySelectorAll('tr');
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(search) ? '' : 'none';
  });
}

// =============================================================
// PROFESSOR: FREQUÊNCIA
// =============================================================
function loadFreqSetup() {
  const sel = document.getElementById('freq-turma-select');
  const dt  = document.getElementById('freq-data');
  if (!sel) return;
  if (sel.options.length <= 1) {
    sel.innerHTML = '<option value="">Selecione a turma...</option>';
    fillSelectTurmas('freq-turma-select');
  }
  if (!dt.value) dt.value = todayISO();
}

function getGradeDia(turmaId, dataStr) {
  const date = new Date(dataStr + 'T12:00:00');
  const diaSemana = date.getDay(); // 0=Dom ... 6=Sab
  if (diaSemana === 0 || diaSemana === 6) return [];
  return dbGetAll('grade_horaria')
    .filter(g => g.turmaId === turmaId && g.diaSemana === diaSemana)
    .sort((a,b) => a.ordem - b.ordem);
}

function loadFreqAlunos() {
  const turmaId = document.getElementById('freq-turma-select').value;
  const data    = document.getElementById('freq-data').value;
  const body    = document.getElementById('freq-body');
  const saveBar = document.getElementById('freq-save-bar');

  if (!turmaId || !data) {
    body.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-calendar-days"></i></div><div class="empty-state-title">Selecione turma e data</div></div>`;
    saveBar.style.display = 'none';
    return;
  }

  // Check for weekend
  const dayOfWeek = new Date(data + 'T12:00:00').getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    body.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-bed"></i></div><div class="empty-state-title">Fim de semana — sem aulas</div></div>`;
    saveBar.style.display = 'none';
    return;
  }

  const alunos = dbGetAll('alunos').filter(a => a.turmaId === turmaId && a.ativo);
  if (!alunos.length) { body.innerHTML = buildEmptyState('Nenhum aluno nesta turma'); return; }

  // Grade info for this day
  const gradeDia = getGradeDia(turmaId, data);
  const discs = dbGetAll('disciplinas');
  const totalAulasDia = gradeDia.reduce((s, g) => s + g.qtdAulas, 0);

  let gradeInfoHtml = '';
  if (gradeDia.length) {
    gradeInfoHtml = `<div style="background:var(--info-light);border:1px solid rgba(37,99,235,0.2);border-radius:var(--r-lg);padding:14px 18px;margin-bottom:16px">
      <div style="font-weight:700;font-size:.85rem;color:var(--secondary);margin-bottom:8px"><i class="fa-solid fa-calendar-week" style="margin-right:6px"></i>Aulas do dia (${DIAS_SEMANA[dayOfWeek]}): <strong>${totalAulasDia} aulas</strong></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${gradeDia.map(g => {
        const d = discs.find(x => x.id === g.disciplinaId);
        return `<span class="badge" style="background:${d?.cor || '#666'}22;color:${d?.cor || '#666'};border:1px solid ${d?.cor || '#666'}44;font-size:.72rem"><i class="fa-solid ${d?.icone || 'fa-book'}" style="margin-right:4px"></i>${esc(d?.nome || '?')} (${g.qtdAulas}x)</span>`;
      }).join('')}</div>
    </div>`;
  } else {
    gradeInfoHtml = `<div style="background:var(--warning-light);border:1px solid rgba(217,119,6,0.3);border-radius:var(--r-lg);padding:12px 16px;margin-bottom:16px;color:var(--warning);font-size:.82rem;font-weight:600"><i class="fa-solid fa-triangle-exclamation" style="margin-right:6px"></i>Nenhuma aula definida na grade para este dia. A frequência contará como 1 aula.</div>`;
  }

  // Load existing frequency
  const existing = dbGetAll('frequencia').find(f => f.turmaId === turmaId && f.data === data);
  const statusMap = {};
  if (existing) existing.aulas.forEach(au => { statusMap[au.alunoId] = au.status; });

  body.innerHTML = gradeInfoHtml + `<div class="freq-grid">
    ${alunos.map(a => {
      const st = statusMap[a.id] || null;
      return `<div class="freq-aluno-row">
        <div>
          <div class="freq-aluno-name">${esc(a.nome)}</div>
          <div style="color:var(--text-muted); font-size:.75rem">${esc(a.matricula)}</div>
        </div>
        <div class="freq-buttons">
          <button class="freq-btn presente ${st==='presente'?'active':''}" data-aluno="${a.id}" data-status="presente" onclick="setFreqBtn(this, '${a.id}')">✅ Presente</button>
          <button class="freq-btn falta ${st==='falta'?'active':''}" data-aluno="${a.id}" data-status="falta" onclick="setFreqBtn(this, '${a.id}')">❌ Falta</button>
          <button class="freq-btn justificado ${st==='justificado'?'active':''}" data-aluno="${a.id}" data-status="justificado" onclick="setFreqBtn(this, '${a.id}')">📋 Justificado</button>
        </div>
      </div>`;
    }).join('')}
  </div>`;

  saveBar.style.display = '';
}

function setFreqBtn(btn, alunoId) {
  const row = btn.closest('.freq-aluno-row');
  row.querySelectorAll('.freq-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function freqSelectAll(status) {
  const btns = document.querySelectorAll(`.freq-btn.${status}`);
  btns.forEach(btn => {
    const row = btn.closest('.freq-aluno-row');
    row.querySelectorAll('.freq-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
  const labels = { presente: 'presentes', falta: 'com falta', justificado: 'justificados' };
  toast(`Todos marcados como ${labels[status] || status}!`, 'success');
}

function saveFrequencia() {
  const turmaId = document.getElementById('freq-turma-select').value;
  const data    = document.getElementById('freq-data').value;
  const alunos  = dbGetAll('alunos').filter(a => a.turmaId === turmaId && a.ativo);

  // Get qtdAulas from grade
  const gradeDia = getGradeDia(turmaId, data);
  const qtdAulas = gradeDia.length ? gradeDia.reduce((s, g) => s + g.qtdAulas, 0) : 1;

  const aulas = alunos.map(a => {
    const activeBtn = document.querySelector(`.freq-btn.active[data-aluno="${a.id}"]`);
    return { alunoId: a.id, status: activeBtn ? activeBtn.dataset.status : 'falta' };
  });

  const existing = dbGetAll('frequencia').find(f => f.turmaId === turmaId && f.data === data);
  if (existing) {
    dbUpdate('frequencia', existing.id, { aulas, qtdAulas });
  } else {
    dbAdd('frequencia', { id: generateId('fr'), turmaId, data, aulas, qtdAulas });
  }

  toast(`Frequência salva! (${qtdAulas} aulas contabilizadas)`, 'success');
}

// =============================================================
// PROFESSOR: DIÁRIO DIGITAL (Spreadsheet)
// =============================================================
const DIAS_SEMANA_FULL = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];

function toggleDiarioForm() {
  const body = document.getElementById('diario-form-body');
  const card = document.getElementById('diario-form-card');
  const chevron = document.getElementById('diario-form-chevron');
  if (body.classList.contains('open')) {
    body.classList.remove('open');
    card.classList.remove('form-open');
  } else {
    body.classList.add('open');
    card.classList.add('form-open');
  }
}

function loadDiarioPage() {
  // Form selects
  const sel = document.getElementById('diario-turma');
  if (!sel) return;
  if (sel.options.length <= 1) {
    sel.innerHTML = '<option value="">Selecione a turma...</option>';
    fillSelectTurmas('diario-turma');
  }
  // Disciplina select
  const discSel = document.getElementById('diario-disciplina');
  if (discSel && discSel.options.length <= 1) {
    discSel.innerHTML = '<option value="">Selecione...</option>';
    fillSelectDiscs('diario-disciplina');
  }
  // Filter turma select
  const filtroSel = document.getElementById('diario-filtro-turma');
  if (filtroSel && filtroSel.options.length <= 1) {
    filtroSel.innerHTML = '<option value="">Todas as turmas</option>';
    dbGetAll('turmas').filter(t => t.ativo).forEach(t => {
      filtroSel.innerHTML += `<option value="${esc(t.id)}">${esc(t.nome)}</option>`;
    });
  }
  const dt = document.getElementById('diario-data');
  if (!dt.value) dt.value = todayISO();
  renderDiarioHistorico();
}

function saveDiario() {
  const turmaId      = document.getElementById('diario-turma').value;
  const data         = document.getElementById('diario-data').value;
  const conteudo     = document.getElementById('diario-conteudo').value.trim();
  const obs          = document.getElementById('diario-obs').value.trim();
  const disciplinaId = document.getElementById('diario-disciplina')?.value || '';
  const qtdAulas     = parseInt(document.getElementById('diario-qtd-aulas')?.value) || 1;

  if (!turmaId || !conteudo) { toast('Preencha turma e conteúdo.', 'error'); return; }

  dbAdd('diario', {
    id: generateId('di'),
    turmaId,
    professorId: SESSION.user ? SESSION.user.id : 'p01',
    disciplinaId,
    data,
    conteudo,
    anotacao: obs,
    qtdAulas,
  });

  document.getElementById('diario-conteudo').value = '';
  document.getElementById('diario-obs').value = '';
  toast('Registro salvo no diário!', 'success');
  // Collapse form
  const body = document.getElementById('diario-form-body');
  if (body) { body.classList.remove('open'); document.getElementById('diario-form-card')?.classList.remove('form-open'); }
  renderDiarioHistorico();
}

function renderDiarioHistorico() {
  const tbody    = document.getElementById('diario-historico');
  let registros  = [...dbGetAll('diario')].sort((a,b) => b.data.localeCompare(a.data));
  const turmas   = dbGetAll('turmas');
  const discs    = dbGetAll('disciplinas');
  const profs    = dbGetAll('professores');

  // Apply filters
  const filtroTurma = document.getElementById('diario-filtro-turma')?.value || '';
  const search      = (document.getElementById('diario-search')?.value || '').toLowerCase();
  if (filtroTurma) registros = registros.filter(r => r.turmaId === filtroTurma);
  if (search) registros = registros.filter(r => 
    (r.conteudo || '').toLowerCase().includes(search) ||
    (r.anotacao || '').toLowerCase().includes(search)
  );

  // Stats
  const allRegistros = dbGetAll('diario');
  const totalEl = document.getElementById('diario-stat-total');
  const turmasEl = document.getElementById('diario-stat-turmas');
  if (totalEl) totalEl.textContent = allRegistros.length;
  if (turmasEl) turmasEl.textContent = new Set(allRegistros.map(r => r.turmaId)).size;
  const countEl = document.getElementById('diario-filter-count');
  if (countEl) countEl.textContent = `${registros.length} registro${registros.length !== 1 ? 's' : ''}`;

  if (!registros.length) {
    tbody.innerHTML = `<tr class="diario-empty-row"><td colspan="8">
      <i class="fa-solid fa-book-open"></i>
      <div style="font-weight:700;margin-bottom:4px">Nenhum registro encontrado</div>
      <div style="font-size:.78rem">Clique em "Novo Registro de Aula" para começar</div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = registros.map((r, idx) => {
    const turma = turmas.find(t => t.id === r.turmaId);
    const disc  = discs.find(d => d.id === r.disciplinaId);
    const prof  = profs.find(p => p.id === r.professorId);
    const dateObj = new Date(r.data + 'T12:00:00');
    const weekday = DIAS_SEMANA_FULL[dateObj.getDay()];
    const discBg = disc ? `${disc.cor}18` : 'var(--bg)';
    const discColor = disc?.cor || 'var(--text-muted)';
    const qtd = r.qtdAulas || 1;

    return `<tr>
      <td><div class="diario-row-num">${String(idx + 1).padStart(2, '0')}</div></td>
      <td>
        <div class="diario-date-cell">${formatDate(r.data)}</div>
        <span class="diario-date-weekday">${weekday}</span>
      </td>
      <td>${turma ? `<span class="badge badge-blue">${esc(turma.nome)}</span>` : '<span class="badge badge-gray">—</span>'}</td>
      <td>${disc ? `<span class="diario-disc-badge" style="background:${discBg};color:${discColor};border:1px solid ${discColor}33"><i class="fa-solid ${disc.icone || 'fa-book'}"></i> ${esc(disc.nome)}</span>` : '<span class="badge badge-gray">—</span>'}</td>
      <td class="diario-conteudo-cell">${esc(r.conteudo)}</td>
      <td class="text-center"><span class="diario-aulas-chip">${qtd}</span></td>
      <td class="diario-obs-cell">${r.anotacao ? esc(r.anotacao) : '<span style="color:var(--text-muted);opacity:.4">—</span>'}</td>
      <td class="text-center">
        <button class="diario-delete-btn" onclick="confirmAction('Excluir este registro?', () => deleteDiario('${r.id}'))" title="Excluir">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    </tr>`;
  }).join('');
}

function deleteDiario(id) {
  dbDelete('diario', id);
  toast('Registro removido.', 'success');
  renderDiarioHistorico();
  closeModal('modal-confirm');
}

// =============================================================
// ALUNO: DIÁRIO DE AULAS
// =============================================================
function loadAlunoDiario() {
  const aluno = SESSION.user;
  if (!aluno) return;

  // Fill discipline filter
  const discSel = document.getElementById('aluno-diario-filtro-disc');
  if (discSel && discSel.options.length <= 1) {
    discSel.innerHTML = '<option value="">Todas as disciplinas</option>';
    dbGetAll('disciplinas').filter(d => d.ativo).forEach(d => {
      discSel.innerHTML += `<option value="${esc(d.id)}">${esc(d.nome)}</option>`;
    });
  }
  renderAlunoDiario();
}

function renderAlunoDiario() {
  const aluno    = SESSION.user;
  const tbody    = document.getElementById('aluno-diario-tbody');
  if (!tbody || !aluno) return;

  let registros  = [...dbGetAll('diario')]
    .filter(r => r.turmaId === aluno.turmaId)
    .sort((a,b) => b.data.localeCompare(a.data));
  const discs    = dbGetAll('disciplinas');
  const profs    = dbGetAll('professores');

  // Filters
  const filtroDisc = document.getElementById('aluno-diario-filtro-disc')?.value || '';
  const search     = (document.getElementById('aluno-diario-search')?.value || '').toLowerCase();
  if (filtroDisc) registros = registros.filter(r => r.disciplinaId === filtroDisc);
  if (search) registros = registros.filter(r => 
    (r.conteudo || '').toLowerCase().includes(search) ||
    (r.anotacao || '').toLowerCase().includes(search)
  );

  // Stats
  const totalEl = document.getElementById('aluno-diario-total');
  const allForTurma = dbGetAll('diario').filter(r => r.turmaId === aluno.turmaId);
  if (totalEl) totalEl.textContent = allForTurma.length;
  const countEl = document.getElementById('aluno-diario-count');
  if (countEl) countEl.textContent = `${registros.length} registro${registros.length !== 1 ? 's' : ''}`;

  if (!registros.length) {
    tbody.innerHTML = `<tr class="diario-empty-row"><td colspan="7">
      <i class="fa-solid fa-book-open"></i>
      <div style="font-weight:700;margin-bottom:4px">Nenhuma aula registrada</div>
      <div style="font-size:.78rem">Os registros aparecerão aqui conforme os professores preencherem o diário</div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = registros.map((r, idx) => {
    const disc  = discs.find(d => d.id === r.disciplinaId);
    const prof  = profs.find(p => p.id === r.professorId);
    const dateObj = new Date(r.data + 'T12:00:00');
    const weekday = DIAS_SEMANA_FULL[dateObj.getDay()];
    const discBg = disc ? `${disc.cor}18` : 'var(--bg)';
    const discColor = disc?.cor || 'var(--text-muted)';
    const qtd = r.qtdAulas || 1;

    return `<tr>
      <td><div class="diario-row-num">${String(idx + 1).padStart(2, '0')}</div></td>
      <td>
        <div class="diario-date-cell">${formatDate(r.data)}</div>
        <span class="diario-date-weekday">${weekday}</span>
      </td>
      <td>${disc ? `<span class="diario-disc-badge" style="background:${discBg};color:${discColor};border:1px solid ${discColor}33"><i class="fa-solid ${disc.icone || 'fa-book'}"></i> ${esc(disc.nome)}</span>` : '<span class="badge badge-gray">—</span>'}</td>
      <td class="diario-conteudo-cell">${esc(r.conteudo)}</td>
      <td class="text-center"><span class="diario-aulas-chip">${qtd}</span></td>
      <td style="font-size:.82rem;color:var(--text-secondary)">${prof ? esc(prof.nome.split(' ').slice(0,2).join(' ')) : '—'}</td>
      <td class="diario-obs-cell">${r.anotacao ? esc(r.anotacao) : '<span style="color:var(--text-muted);opacity:.4">—</span>'}</td>
    </tr>`;
  }).join('');
}

// =============================================================
// PROFESSOR: ATIVIDADES
// =============================================================
function loadAtividades() {
  const grid = document.getElementById('atividades-cards');
  if (!grid) return;
  const atividades = dbGetAll('atividades').filter(a => a.ativo);
  const turmas = dbGetAll('turmas');

  if (!atividades.length) {
    grid.innerHTML = buildEmptyState('Nenhuma atividade publicada.');
    return;
  }

  const tipoIcon = { prova:'fa-file-pen', trabalho:'fa-clipboard-list', exercicio:'fa-pencil', projeto:'fa-flask' };
  const tipoLabel = { prova:'Prova', trabalho:'Trabalho', exercicio:'Exercício', projeto:'Projeto' };
  const tipoBg = { prova:'var(--danger-light)', trabalho:'var(--info-light)', exercicio:'var(--success-light)', projeto:'var(--purple-light)' };
  const tipoColor = { prova:'var(--danger)', trabalho:'var(--secondary)', exercicio:'var(--success)', projeto:'var(--purple)' };

  grid.innerHTML = atividades.map(a => {
    const turma = turmas.find(t => t.id === a.turmaId);
    const tipo = a.tipo || 'exercicio';
    return `<div class="ativ-card">
      <div class="ativ-icon ${tipo}" style="background:${tipoBg[tipo]||'var(--bg)'};color:${tipoColor[tipo]||'var(--text-muted)'}">
        <i class="fa-solid ${tipoIcon[tipo]||'fa-clipboard-list'}"></i>
      </div>
      <div style="flex:1;min-width:0">
        <div class="ativ-title">${esc(a.titulo)}</div>
        <div class="ativ-meta">
          ${turma ? `<span><i class="fa-solid fa-users"></i> ${esc(turma.nome)}</span>` : ''}
          <span><i class="fa-regular fa-calendar"></i> ${formatDate(a.dataPrazo)}</span>
          <span><i class="fa-solid fa-star"></i> ${esc(a.pontos)} pts</span>
          <span class="badge badge-gray">${esc(tipoLabel[tipo]||tipo)}</span>
        </div>
        ${a.descricao ? `<div style="color:var(--text-secondary);font-size:.82rem;margin-top:6px;line-height:1.5">${esc(a.descricao)}</div>` : ''}
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0;align-items:flex-start">
        <button class="btn btn-sm btn-danger" data-id="${a.id}" onclick="confirmDeleteAtividade(this)">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>`;
  }).join('');
}

function openAtividadeModal() {
  document.getElementById('ativ-id').value = '';
  document.getElementById('ativ-titulo').value = '';
  document.getElementById('ativ-desc').value = '';
  document.getElementById('ativ-pontos').value = '10';
  document.getElementById('ativ-modal-title').textContent = 'Nova Atividade';
  const sel = document.getElementById('ativ-turma');
  sel.innerHTML = '';
  fillSelectTurmas('ativ-turma');
  openModal('modal-atividade');
}

function saveAtividade() {
  const id     = document.getElementById('ativ-id').value;
  const titulo = document.getElementById('ativ-titulo').value.trim();
  const turma  = document.getElementById('ativ-turma').value;
  const tipo   = document.getElementById('ativ-tipo').value;
  const prazo  = document.getElementById('ativ-prazo').value;
  const pontos = document.getElementById('ativ-pontos').value;
  const desc   = document.getElementById('ativ-desc').value.trim();

  if (!titulo || !turma) { toast('Preencha título e turma.', 'error'); return; }

  const data = { titulo, turmaId: turma, tipo, dataPrazo: prazo, pontos: parseInt(pontos), descricao: desc, ativo: true, dataCriacao: todayISO(), professorId: SESSION.user ? SESSION.user.id : 'p01' };

  if (id) {
    dbUpdate('atividades', id, data);
    toast('Atividade atualizada!', 'success');
  } else {
    dbAdd('atividades', { id: generateId('at'), ...data });
    toast('Atividade publicada!', 'success');
  }
  closeModal('modal-atividade');
  loadAtividades();
}

function confirmDeleteAtividade(btn) {
  const id = btn.dataset.id;
  confirmAction('Excluir esta atividade?', () => deleteAtividade(id));
}

function deleteAtividade(id) {
  dbUpdate('atividades', id, { ativo: false });
  toast('Atividade removida.', 'success');
  loadAtividades();
  closeModal('modal-confirm');
}

// =============================================================
// PROFESSOR: AEE
// =============================================================
function loadAEE() {
  const grid = document.getElementById('aee-cards-grid');
  const fichas = dbGetAll('aee');
  const alunos = dbGetAll('alunos');
  const turmas = dbGetAll('turmas');

  if (!fichas.length) {
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon"><i class="fa-solid fa-heart-pulse"></i></div>
      <div class="empty-state-title">Nenhuma ficha AEE cadastrada</div>
      <div class="empty-state-desc">Clique em "Nova Ficha AEE" para adicionar um aluno ao atendimento especializado.</div>
    </div>`;
    return;
  }

  grid.innerHTML = fichas.map(f => {
    const aluno = alunos.find(a => a.id === f.alunoId);
    const turma = aluno ? turmas.find(t => t.id === aluno.turmaId) : null;
    return `<div class="aee-card">
      <div class="aee-header">
        <div>
          <div class="aee-name">${aluno ? esc(aluno.nome) : 'Aluno não encontrado'}</div>
          <div class="aee-turma">${turma ? esc(turma.nome) + ' · ' + turnoIcon(turma.turno) + ' ' + esc(turma.turno) : '—'}</div>
        </div>
        <span class="badge badge-purple"><i class="fa-solid fa-heart-pulse"></i> AEE</span>
      </div>
      ${f.necessidade ? `<div style="color:#7c3aed; font-weight:700; font-size:.82rem; margin-bottom:6px; text-transform:uppercase; letter-spacing:.04em">Necessidade:</div>
      <div class="aee-desc">${esc(f.necessidade)}</div>` : ''}
      ${f.planoAtendimento ? `<div style="color:#7c3aed; font-weight:700; font-size:.82rem; margin-top:12px; margin-bottom:6px; text-transform:uppercase; letter-spacing:.04em">Plano de Atendimento:</div>
      <div class="aee-desc">${esc(f.planoAtendimento)}</div>` : ''}
      ${f.observacoes ? `<div style="margin-top:10px; padding:10px 12px; background:rgba(255,255,255,0.5); border-radius:8px; font-size:.82rem; color:#5b21b6; font-style:italic">${esc(f.observacoes)}</div>` : ''}
      <div class="aee-actions">
        <button class="btn btn-sm btn-ghost" data-id="${f.id}" onclick="editAEE(this.dataset.id)"><i class="fa-solid fa-pen"></i> Editar</button>
        <button class="btn btn-sm btn-danger" data-id="${f.id}" onclick="confirmDeleteAEE(this)">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
      <div style="margin-top:10px; color:#9ca3af; font-size:.72rem; font-weight:500">Registrado em ${formatDate(f.dataCriacao)}</div>
    </div>`;
  }).join('');
}

function editAEE(id) {
  const ficha = dbFind('aee', id);
  if (!ficha) return;
  document.getElementById('aee-id').value          = ficha.id;
  const titleEl = document.getElementById('aee-modal-title');
  if (titleEl) titleEl.textContent = 'Editar Ficha AEE';
  const sel = document.getElementById('aee-aluno');
  fillSelectAlunos('aee-aluno', ficha.alunoId);
  document.getElementById('aee-necessidade').value = ficha.necessidade || '';
  document.getElementById('aee-plano').value        = ficha.planoAtendimento || '';
  document.getElementById('aee-obs').value           = ficha.observacoes || '';
  openModal('modal-aee');
}

function saveAEE() {
  const id          = document.getElementById('aee-id').value;
  const alunoId     = document.getElementById('aee-aluno').value;
  const necessidade = document.getElementById('aee-necessidade').value.trim();
  const plano       = document.getElementById('aee-plano').value.trim();
  const obs         = document.getElementById('aee-obs').value.trim();

  if (!alunoId) { toast('Selecione um aluno.', 'error'); return; }

  const data = { alunoId, professorId: SESSION.user ? SESSION.user.id : 'p01', necessidade, planoAtendimento: plano, observacoes: obs };

  if (id) {
    dbUpdate('aee', id, data);
    toast('Ficha AEE atualizada!', 'success');
  } else {
    dbAdd('aee', { id: generateId('aee'), ...data, dataCriacao: todayISO() });
    toast('Ficha AEE criada!', 'success');
  }
  closeModal('modal-aee');
  loadAEE();
}

function confirmDeleteAEE(btn) {
  const id = btn.dataset.id;
  confirmAction('Excluir esta ficha AEE?', () => deleteAEE(id));
}

function deleteAEE(id) {
  dbDelete('aee', id);
  toast('Ficha AEE removida.', 'success');
  loadAEE();
  closeModal('modal-confirm');
}

// =============================================================
// AVISOS (Professor + Diretor publish)
// =============================================================
function saveAviso() {
  const titulo = document.getElementById('aviso-titulo').value.trim();
  const tipo   = document.getElementById('aviso-tipo').value;
  const turmaId= document.getElementById('aviso-turma').value;
  const corpo  = document.getElementById('aviso-corpo').value.trim();

  if (!titulo || !corpo) { toast('Preencha título e mensagem.', 'error'); return; }

  dbAdd('avisos', {
    id: generateId('av'),
    titulo, corpo, tipo,
    turmaId: turmaId || null,
    autoria: SESSION.role,
    dataCriacao: todayISO(),
    ativo: true
  });

  toast('Aviso publicado!', 'success');
  closeModal('modal-aviso');
  loadAllAvisos();
  loadAvisosPage('prof-avisos-body', true);
}

// =============================================================
// DIRETOR: DASHBOARD
// =============================================================
function loadDirInicio() {
  const turmas  = dbGetAll('turmas').filter(t => t.ativo);
  const alunos  = dbGetAll('alunos').filter(a => a.ativo);
  const profs   = dbGetAll('professores').filter(p => p.ativo);
  const avisos  = dbGetAll('avisos').filter(a => a.ativo);

  const st = document.getElementById('dir-stats-row');
  st.innerHTML = `
    <div class="stat-card">
      <div class="stat-card-header"><span class="stat-card-label">Turmas Ativas</span><div class="stat-icon blue"><i class="fa-solid fa-chalkboard"></i></div></div>
      <div class="stat-num">${turmas.length}</div>
      <div class="stat-desc">salas cadastradas</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-header"><span class="stat-card-label">Alunos</span><div class="stat-icon green"><i class="fa-solid fa-user-graduate"></i></div></div>
      <div class="stat-num">${alunos.length}</div>
      <div class="stat-desc">matriculados</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-header"><span class="stat-card-label">Professores</span><div class="stat-icon amber"><i class="fa-solid fa-chalkboard-user"></i></div></div>
      <div class="stat-num">${profs.length}</div>
      <div class="stat-desc">ativos</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-header"><span class="stat-card-label">Avisos</span><div class="stat-icon red"><i class="fa-solid fa-bell"></i></div></div>
      <div class="stat-num">${avisos.length}</div>
      <div class="stat-desc">publicados</div>
    </div>
  `;

  // Turmas list
  const turmasList = document.getElementById('dir-turmas-list');
  turmasList.innerHTML = turmas.length ? turmas.map(t => {
    const qtd = alunos.filter(a => a.turmaId === t.id).length;
    const prof = dbGetAll('professores').find(p => p.id === t.professorId);
    return `<div style="padding:12px 0; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center">
      <div>
        <div style="font-weight:700; color:var(--text)">${esc(t.nome)}</div>
        <div style="color:var(--text-muted); font-size:.78rem">${turnoIcon(t.turno)} ${esc(t.turno)} · ${prof ? esc(prof.nome) : 'Sem professor'}</div>
      </div>
      <span class="badge badge-blue">${qtd} alunos</span>
    </div>`;
  }).join('') : buildEmptyState('Nenhuma turma');

  // Avisos list
  const avisosList = document.getElementById('dir-avisos-list');
  const recentAvisos = [...avisos].reverse().slice(0, 5);
  avisosList.innerHTML = recentAvisos.length ? recentAvisos.map(av => `
    <div style="padding:10px 0; border-bottom:1px solid var(--border)">
      <div style="font-weight:700; font-size:.875rem; color:var(--text)">${esc(av.titulo)}</div>
      <div style="color:var(--text-muted); font-size:.75rem; margin-top:2px">${formatDate(av.dataCriacao)}</div>
    </div>
  `).join('') : buildEmptyState('Nenhum aviso');

  // Update system toggle state
  updateSystemStatus();

  // Professor status + Calendar
  renderProfStatus();
  renderCalendario('dir-calendario-body');
}

function toggleSistema() {
  const toggle  = document.getElementById('dir-sys-toggle');
  const isOpen  = toggle.checked; // checked = ABERTO

  if (isOpen) {
    abrirSistema();
    toast('✅ Sistema aberto! Professores podem lançar notas.', 'success');
  } else {
    fecharSistema();
    toast('🔒 Sistema fechado! Professores não podem editar notas.', 'warning');
  }

  updateSystemStatus();
}

// =============================================================
// DIRETOR: ALUNOS
// =============================================================
function loadDirAlunos() {
  const filtroTurma  = document.getElementById('dir-alunos-filtro-turma')?.value || '';
  const filtroEscola = document.getElementById('dir-alunos-filtro-escola')?.value || '';
  const filtroSerie  = document.getElementById('dir-alunos-filtro-serie')?.value || '';
  const search       = document.getElementById('dir-alunos-search')?.value.toLowerCase() || '';
  const tbody        = document.getElementById('dir-alunos-tbody');
  const turmas       = dbGetAll('turmas');
  const escolas      = dbGetAll('escolas_rede');

  // Helper para obter a série da turma
  const getSerie = (tNome) => {
    const parts = tNome.split(' ');
    return parts.length >= 2 ? parts[0] + ' ' + parts[1] : tNome;
  };

  // Fill filters (once)
  const escolaSel = document.getElementById('dir-alunos-filtro-escola');
  if (escolaSel && escolaSel.options.length <= 1) {
    escolaSel.innerHTML = '<option value="">Todas as escolas</option>';
    escolas.filter(e => e.ativa).forEach(e => {
      escolaSel.innerHTML += `<option value="${esc(e.id)}">${esc(e.nomeAbreviado || e.nome)}</option>`;
    });
  }

  const serieSel = document.getElementById('dir-alunos-filtro-serie');
  if (serieSel && serieSel.options.length <= 1) {
    serieSel.innerHTML = '<option value="">Todas as séries</option>';
    const series = [...new Set(turmas.map(t => getSerie(t.nome)))].sort();
    series.forEach(s => {
      serieSel.innerHTML += `<option value="${esc(s)}">${esc(s)}</option>`;
    });
  }

  const filtroSel = document.getElementById('dir-alunos-filtro-turma');
  if (filtroSel && filtroSel.options.length <= 1) {
    filtroSel.innerHTML = '<option value="">Todas as turmas</option>';
    turmas.forEach(t => {
      filtroSel.innerHTML += `<option value="${esc(t.id)}">${esc(t.nome)} (${esc(t.turno)})</option>`;
    });
  }

  let alunos = dbGetAll('alunos').filter(a => a.ativo);
  
  if (filtroEscola) {
    // Como a base atual não tem escolaId explícito na turma, vamos mapear implicitamente para a 1ª escola (Edith Nair) 
    // ou filtrar caso as turmas passem a ter escolaId
    const turmasEscolaIds = turmas.filter(t => t.escolaId === filtroEscola || (!t.escolaId && filtroEscola === 'esc01')).map(t => t.id);
    alunos = alunos.filter(a => turmasEscolaIds.includes(a.turmaId) || (a.escolaId === filtroEscola));
  }

  if (filtroSerie) {
    const turmasSerieIds = turmas.filter(t => getSerie(t.nome) === filtroSerie).map(t => t.id);
    alunos = alunos.filter(a => turmasSerieIds.includes(a.turmaId));
  }

  if (filtroTurma) alunos = alunos.filter(a => a.turmaId === filtroTurma);
  if (search)      alunos = alunos.filter(a =>
    a.nome.toLowerCase().includes(search) || a.matricula.includes(search) ||
    (a.cpf && a.cpf.includes(search)) ||
    (a.nomeMae && a.nomeMae.toLowerCase().includes(search)) ||
    (a.nomePai && a.nomePai.toLowerCase().includes(search))
  );

  if (!alunos.length) {
    tbody.innerHTML = `<tr><td colspan="7">${buildEmptyState('Nenhum aluno encontrado.')}</td></tr>`;
    return;
  }

  tbody.innerHTML = alunos.map(a => {
    const turma = turmas.find(t => t.id === a.turmaId);
    return `<tr>
      <td style="font-weight:700">${esc(a.nome)}</td>
      <td style="color:var(--text-muted)">${esc(a.matricula)}</td>
      <td>${turma ? `<span class="badge badge-blue">${esc(turma.nome)}</span>` : '—'}</td>
      <td>${turma ? `${turnoIcon(turma.turno)} ${turma.turno}` : '—'}</td>
      <td style="font-size:.82rem;color:var(--text-secondary)">${esc(a.nomeMae || '—')}</td>
      <td style="font-size:.82rem;color:var(--text-secondary)">${esc(a.nomePai || '—')}</td>
      <td class="text-right" style="display:flex; gap:6px; justify-content:flex-end">
        <button class="btn btn-sm btn-ghost" data-id="${a.id}" onclick="editAluno(this.dataset.id)"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-danger" data-id="${a.id}" onclick="confirmDeleteAluno(this)">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    </tr>`;
  }).join('');
}

function openModalAluno(alunoId = null) {
  document.getElementById('aluno-id').value = alunoId || '';
  document.getElementById('aluno-modal-title').textContent = alunoId ? 'Editar Aluno' : 'Novo Aluno';

  const sel = document.getElementById('aluno-turma-select');
  sel.innerHTML = '';
  fillSelectTurmas('aluno-turma-select');

  // Helper to safely set field values
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

  if (alunoId) {
    const a = dbFind('alunos', alunoId);
    if (a) {
      setVal('aluno-nome', a.nome);
      setVal('aluno-matricula', a.matricula);
      setVal('aluno-cpf', a.cpf);
      setVal('aluno-nascimento', a.nascimento);
      setVal('aluno-sexo', a.sexo);
      setVal('aluno-turma-select', a.turmaId);
      setVal('aluno-nome-pai', a.nomePai);
      setVal('aluno-nome-mae', a.nomeMae);
      setVal('aluno-responsavel', a.responsavel);
      setVal('aluno-endereco', a.endereco);
      setVal('aluno-telefone', a.telefone);
      setVal('aluno-email-resp', a.emailResp);
      setVal('aluno-tipo-sanguineo', a.tipoSanguineo);
      setVal('aluno-nis', a.nis);
      setVal('aluno-saude', a.saude);
      setVal('aluno-observacoes', a.observacoes);
    }
  } else {
    ['aluno-nome','aluno-matricula','aluno-cpf','aluno-nascimento','aluno-sexo',
     'aluno-nome-pai','aluno-nome-mae','aluno-responsavel','aluno-endereco',
     'aluno-telefone','aluno-email-resp','aluno-tipo-sanguineo','aluno-nis',
     'aluno-saude','aluno-observacoes'].forEach(id => setVal(id, ''));
  }
  openModal('modal-aluno');
}

function editAluno(id) { openModalAluno(id); }

function saveAluno() {
  const id      = document.getElementById('aluno-id').value;
  const nome    = document.getElementById('aluno-nome').value.trim();
  const mat     = document.getElementById('aluno-matricula').value.trim();
  const cpfEl   = document.getElementById('aluno-cpf');
  const cpf     = cpfEl ? cpfEl.value.trim() : '';
  const turmaId = document.getElementById('aluno-turma-select').value;

  if (!nome || !mat || !turmaId) { toast('Preencha nome, matrícula e turma.', 'error'); return; }

  const getVal = (elId) => { const el = document.getElementById(elId); return el ? el.value.trim() : ''; };

  const data = {
    nome, matricula: mat, cpf, turmaId, ativo: true,
    nascimento:     getVal('aluno-nascimento'),
    sexo:           getVal('aluno-sexo'),
    nomePai:        getVal('aluno-nome-pai'),
    nomeMae:        getVal('aluno-nome-mae'),
    responsavel:    getVal('aluno-responsavel'),
    endereco:       getVal('aluno-endereco'),
    telefone:       getVal('aluno-telefone'),
    emailResp:      getVal('aluno-email-resp'),
    tipoSanguineo:  getVal('aluno-tipo-sanguineo'),
    nis:            getVal('aluno-nis'),
    saude:          getVal('aluno-saude'),
    observacoes:    getVal('aluno-observacoes'),
  };

  if (id) {
    dbUpdate('alunos', id, data);
    toast('Aluno atualizado!', 'success');
  } else {
    // Check duplicate matricula
    const exists = dbGetAll('alunos').find(a => a.matricula === mat);
    if (exists) { toast('Matrícula já cadastrada!', 'error'); return; }
    dbAdd('alunos', { id: generateId('a'), ...data });
    toast('Aluno cadastrado!', 'success');
  }
  closeModal('modal-aluno');
  // Reload whichever page is active
  if (SESSION.role === 'secretaria') { try { loadSecAlunos(); } catch(e){} }
  else loadDirAlunos();
}

function confirmDeleteAluno(btn) {
  const id = btn.dataset.id;
  const aluno = dbFind('alunos', id);
  confirmAction(`Excluir o aluno ${aluno ? esc(aluno.nome) : ''}?`, () => deleteAluno(id));
}

function deleteAluno(id) {
  dbUpdate('alunos', id, { ativo: false });
  toast('Aluno removido.', 'success');
  loadDirAlunos();
  closeModal('modal-confirm');
}

// =============================================================
// DIRETOR: PROFESSORES
// =============================================================
function loadDirProfessores() {
  const tbody  = document.getElementById('dir-profs-tbody');
  const profs  = dbGetAll('professores').filter(p => p.ativo);
  const turmas = dbGetAll('turmas');

  if (!profs.length) {
    tbody.innerHTML = `<tr><td colspan="4">${buildEmptyState('Nenhum professor cadastrado.')}</td></tr>`;
    return;
  }

  tbody.innerHTML = profs.map(p => {
    const turmasProf = turmas.filter(t => (p.turmaIds || []).includes(t.id));
    const discs      = dbGetAll('disciplinas').filter(d => (p.disciplinas || []).includes(d.id));
    return `<tr>
      <td style="font-weight:700">${p.nome}</td>
      <td>${turmasProf.map(t => `<span class="badge badge-blue" style="margin-right:4px">${t.nome}</span>`).join('') || '—'}</td>
      <td>${discs.map(d => `<span class="badge badge-gray" style="margin-right:4px">${d.nome}</span>`).join('') || '—'}</td>
      <td class="text-right" style="display:flex; gap:6px; justify-content:flex-end">
        <button class="btn btn-sm btn-ghost" data-id="${p.id}" onclick="editProfessor(this.dataset.id)"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-danger" data-id="${p.id}" onclick="confirmDeleteProfessor(this)">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    </tr>`;
  }).join('');
}

function openModalProfessor(profId = null) {
  document.getElementById('prof-modal-id').value = profId || '';
  document.getElementById('prof-modal-title').textContent = profId ? 'Editar Professor' : 'Novo Professor';

  const sel = document.getElementById('prof-modal-turmas');
  sel.innerHTML = '';
  dbGetAll('turmas').filter(t => t.ativo).forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = `${t.nome} (${t.turno})`;
    sel.appendChild(opt);
  });

  if (profId) {
    const p = dbFind('professores', profId);
    if (p) {
      document.getElementById('prof-modal-nome').value  = p.nome;
      document.getElementById('prof-modal-email').value = p.email || '';
      Array.from(sel.options).forEach(opt => {
        opt.selected = (p.turmaIds || []).includes(opt.value);
      });
    }
  } else {
    document.getElementById('prof-modal-nome').value  = '';
    document.getElementById('prof-modal-email').value = '';
  }
  openModal('modal-professor');
}

function editProfessor(id) { openModalProfessor(id); }

function saveProfessor() {
  const id      = document.getElementById('prof-modal-id').value;
  const nome    = document.getElementById('prof-modal-nome').value.trim();
  const email   = document.getElementById('prof-modal-email').value.trim();
  const turmasSel = document.getElementById('prof-modal-turmas');
  const turmaIds  = Array.from(turmasSel.selectedOptions).map(o => o.value);

  if (!nome) { toast('Preencha o nome.', 'error'); return; }

  const data = { nome, email, turmaIds, disciplinas: [], ativo: true };

  if (id) {
    dbUpdate('professores', id, data);
    toast('Professor atualizado!', 'success');
  } else {
    dbAdd('professores', { id: generateId('p'), ...data });
    toast('Professor cadastrado!', 'success');
  }
  closeModal('modal-professor');
  loadDirProfessores();
}

function confirmDeleteProfessor(btn) {
  const id = btn.dataset.id;
  const prof = dbFind('professores', id);
  confirmAction(`Remover o professor ${prof ? prof.nome : ''}?`, () => deleteProfessor(id));
}

function deleteProfessor(id) {
  dbUpdate('professores', id, { ativo: false });
  toast('Professor removido.', 'success');
  loadDirProfessores();
  closeModal('modal-confirm');
}

// =============================================================
// DIRETOR: TURMAS
// =============================================================
function loadDirTurmas() {
  const tbody  = document.getElementById('dir-turmas-tbody');
  const turmas = dbGetAll('turmas').filter(t => t.ativo);
  const profs  = dbGetAll('professores');
  const alunos = dbGetAll('alunos').filter(a => a.ativo);

  if (!turmas.length) {
    tbody.innerHTML = `<tr><td colspan="5">${buildEmptyState('Nenhuma turma cadastrada.')}</td></tr>`;
    return;
  }

  tbody.innerHTML = turmas.map(t => {
    const prof = profs.find(p => p.id === t.professorId);
    const qtd  = alunos.filter(a => a.turmaId === t.id).length;
    const turnoBadge = t.turno==='manhã' ? 'yellow' : t.turno==='tarde' ? 'amber' : 'purple';
    return `<tr>
      <td style="font-weight:700">${t.nome}</td>
      <td><span class="badge badge-${turnoBadge}">${turnoIcon(t.turno)} ${t.turno}</span></td>
      <td>${prof ? prof.nome : '—'}</td>
      <td class="text-center"><span class="badge badge-blue">${qtd}</span></td>
      <td class="text-right" style="display:flex; gap:6px; justify-content:flex-end">
        <button class="btn btn-sm btn-ghost" data-id="${t.id}" onclick="editTurma(this.dataset.id)"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-danger" data-id="${t.id}" onclick="confirmDeleteTurma(this)">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    </tr>`;
  }).join('');
}

function openModalTurma(turmaId = null) {
  document.getElementById('turma-id').value = turmaId || '';
  document.getElementById('turma-modal-title').textContent = turmaId ? 'Editar Turma' : 'Nova Turma';

  const profSel = document.getElementById('turma-professor');
  profSel.innerHTML = '<option value="">Sem professor</option>';
  fillSelectProfs('turma-professor');

  if (turmaId) {
    const t = dbFind('turmas', turmaId);
    if (t) {
      document.getElementById('turma-nome').value   = t.nome;
      document.getElementById('turma-turno').value  = t.turno;
      document.getElementById('turma-professor').value = t.professorId || '';
    }
  } else {
    document.getElementById('turma-nome').value  = '';
    document.getElementById('turma-turno').value = 'manhã';
  }
  openModal('modal-turma');
}

function editTurma(id) { openModalTurma(id); }

function saveTurma() {
  const id   = document.getElementById('turma-id').value;
  const nome = document.getElementById('turma-nome').value.trim();
  const turno= document.getElementById('turma-turno').value;
  const profId = document.getElementById('turma-professor').value;

  if (!nome) { toast('Preencha o nome da turma.', 'error'); return; }

  const data = { nome, turno, professorId: profId || null, ativo: true };

  if (id) {
    dbUpdate('turmas', id, data);
    toast('Turma atualizada!', 'success');
  } else {
    dbAdd('turmas', { id: generateId('t'), ...data });
    toast('Turma criada!', 'success');
  }
  closeModal('modal-turma');
  loadDirTurmas();
}

function confirmDeleteTurma(btn) {
  const id = btn.dataset.id;
  const turma = dbFind('turmas', id);
  const alunosCount = dbGetAll('alunos').filter(a => a.turmaId === id && a.ativo).length;
  if (alunosCount > 0) {
    toast(`Esta turma tem ${alunosCount} aluno(s). Reatribua os alunos antes de excluir.`, 'error');
    return;
  }
  confirmAction(`Excluir a turma ${turma ? turma.nome : ''}?`, () => deleteTurma(id));
}

function deleteTurma(id) {
  dbUpdate('turmas', id, { ativo: false });
  toast('Turma removida.', 'success');
  loadDirTurmas();
  closeModal('modal-confirm');
}

// =============================================================
// DIRETOR: RELATÓRIOS
// =============================================================
function loadRelatorio() {
  const tbody    = document.getElementById('rel-tbody');
  const statsRow = document.getElementById('rel-stats-row');
  const filtroT  = document.getElementById('rel-turma-select').value;
  const filtroB  = document.getElementById('rel-bimestre-select').value;
  const turmasSel= document.getElementById('rel-turma-select');
  const cfg      = getConfig();

  // Fill selects
  if (turmasSel.options.length <= 1) {
    dbGetAll('turmas').filter(t=>t.ativo).forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id; opt.textContent = t.nome;
      turmasSel.appendChild(opt);
    });
  }

  let alunos = dbGetAll('alunos').filter(a => a.ativo);
  if (filtroT) alunos = alunos.filter(a => a.turmaId === filtroT);

  const disciplinas = dbGetAll('disciplinas').filter(d=>d.ativo);
  const turmas      = dbGetAll('turmas');
  const todasNotas  = dbGetAll('notas');

  // Build rows: aluno × disciplina
  const rows = [];
  alunos.forEach(a => {
    disciplinas.forEach(d => {
      const nota = todasNotas.find(n => n.alunoId === a.id && n.disciplinaId === d.id);
      if (nota || filtroT || filtroB) {
        const b1 = nota?.b1 ?? null; const b2 = nota?.b2 ?? null;
        const b3 = nota?.b3 ?? null; const b4 = nota?.b4 ?? null;
        if (!nota && !filtroB) return; // skip empty
        const anual = getNotaAnual(b1, b2, b3, b4);
        const turma = turmas.find(t => t.id === a.turmaId);
        rows.push({ aluno: a, disciplina: d, nota, b1, b2, b3, b4, anual, turma });
      }
    });
  });

  // Stats
  const totalRows   = rows.length;
  const aprovados   = rows.filter(r => r.anual !== null && r.anual >= cfg.notaMinima).length;
  const reprovados  = rows.filter(r => r.anual !== null && r.anual < cfg.notaMinima).length;
  const emCurso     = rows.filter(r => r.anual === null).length;

  statsRow.innerHTML = `
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Total de Registros</span><div class="stat-icon blue"><i class="fa-solid fa-table"></i></div></div><div class="stat-num">${totalRows}</div></div>
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Aprovados</span><div class="stat-icon green"><i class="fa-solid fa-circle-check"></i></div></div><div class="stat-num" style="color:var(--success)">${aprovados}</div></div>
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Reprovados</span><div class="stat-icon red"><i class="fa-solid fa-circle-xmark"></i></div></div><div class="stat-num" style="color:var(--danger)">${reprovados}</div></div>
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Em Curso</span><div class="stat-icon amber"><i class="fa-solid fa-hourglass-half"></i></div></div><div class="stat-num">${emCurso}</div></div>
  `;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="9">${buildEmptyState('Nenhum registro de notas encontrado.')}</td></tr>`;
    return;
  }

  const cell = (v, notaMin) => {
    if (v === null || v === undefined) return `<td class="text-center" style="color:var(--text-muted)">—</td>`;
    const color = parseFloat(v) >= notaMin ? 'var(--success)' : 'var(--danger)';
    return `<td class="text-center" style="font-weight:700; color:${color}">${parseFloat(v).toFixed(1)}</td>`;
  };

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td style="font-weight:700">${r.aluno.nome}</td>
      <td>${r.turma ? `<span class="badge badge-blue">${r.turma.nome}</span>` : '—'}</td>
      <td style="font-size:.82rem">${r.disciplina.nome}</td>
      ${cell(r.b1, cfg.notaMinima)}${cell(r.b2, cfg.notaMinima)}${cell(r.b3, cfg.notaMinima)}${cell(r.b4, cfg.notaMinima)}
      <td class="text-center">${notaBadge(r.anual, cfg.notaMinima)}</td>
      <td class="text-center">${situacaoBadge(r.anual, cfg.notaMinima)}</td>
    </tr>
  `).join('');

  // Render charts
  renderCharts(rows, cfg);
}

// Chart instances
let chartInstances = {};
function destroyChart(id) {
  if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
}

function renderCharts(rows, cfg) {
  const aprovados = rows.filter(r => r.anual !== null && r.anual >= cfg.notaMinima).length;
  const reprovados = rows.filter(r => r.anual !== null && r.anual < cfg.notaMinima).length;
  const emCurso = rows.filter(r => r.anual === null).length;

  // Pie chart
  destroyChart('chart-situacao');
  const ctxPie = document.getElementById('chart-situacao');
  if (ctxPie) {
    chartInstances['chart-situacao'] = new Chart(ctxPie, {
      type: 'doughnut',
      data: { labels: ['Aprovados','Reprovados','Em Curso'], datasets: [{ data: [aprovados, reprovados, emCurso], backgroundColor: ['#059669','#dc2626','#f59e0b'], borderWidth: 0, borderRadius: 4 }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter', weight: 600 }, padding: 16 } } } }
    });
  }

  // Bar chart - Médias por disciplina
  destroyChart('chart-medias');
  const ctxBar = document.getElementById('chart-medias');
  if (ctxBar) {
    const disciplinas = dbGetAll('disciplinas').filter(d => d.ativo);
    const labels = []; const medias = []; const cores = [];
    disciplinas.forEach(d => {
      const discRows = rows.filter(r => r.disciplina.id === d.id);
      if (!discRows.length) return;
      const vals = discRows.map(r => {
        const bims = [r.b1,r.b2,r.b3,r.b4].filter(v => v !== null);
        return bims.length ? bims.reduce((a,b)=>a+b,0)/bims.length : 0;
      });
      labels.push(d.nome.length > 12 ? d.nome.slice(0,12)+'…' : d.nome);
      medias.push(+(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1));
      cores.push(d.cor || '#3b82f6');
    });
    chartInstances['chart-medias'] = new Chart(ctxBar, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Média', data: medias, backgroundColor: cores.map(c=>c+'cc'), borderColor: cores, borderWidth: 1.5, borderRadius: 6 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 10 } } }
    });
  }

  // Line chart - Evolução por bimestre
  destroyChart('chart-evolucao');
  const ctxLine = document.getElementById('chart-evolucao');
  if (ctxLine) {
    const bimMedias = [1,2,3,4].map(b => {
      const key = `b${b}`;
      const vals = rows.map(r => r[key]).filter(v => v !== null);
      return vals.length ? +(vals.reduce((a,c)=>a+c,0)/vals.length).toFixed(1) : null;
    });
    chartInstances['chart-evolucao'] = new Chart(ctxLine, {
      type: 'line',
      data: { labels: ['1º Bim','2º Bim','3º Bim','4º Bim'], datasets: [{ label: 'Média Geral', data: bimMedias, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.1)', fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: '#2563eb' }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 10 } } }
    });
  }

  // Horizontal bar - Frequência por turma
  destroyChart('chart-frequencia');
  const ctxFreq = document.getElementById('chart-frequencia');
  if (ctxFreq) {
    const turmas = dbGetAll('turmas').filter(t => t.ativo);
    const freqAll = dbGetAll('frequencia');
    const labels = []; const pcts = [];
    turmas.forEach(t => {
      const freqs = freqAll.filter(f => f.turmaId === t.id);
      let total = 0, pres = 0;
      freqs.forEach(f => f.aulas.forEach(a => { total++; if (a.status === 'presente') pres++; }));
      labels.push(t.nome);
      pcts.push(total > 0 ? +((pres/total)*100).toFixed(0) : 0);
    });
    chartInstances['chart-frequencia'] = new Chart(ctxFreq, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Frequência %', data: pcts, backgroundColor: pcts.map(p => p >= 75 ? '#059669cc' : '#dc2626cc'), borderRadius: 6 }] },
      options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, max: 100 } } }
    });
  }
}

function exportPDF() {
  window.print();
}

// =============================================================
// DIRETOR: GRADE HORÁRIA SEMANAL
// =============================================================
function loadDirHorarios() {
  const sel = document.getElementById('grade-turma-select');
  if (!sel) return;
  if (sel.options.length <= 1) {
    sel.innerHTML = '<option value="">Selecione a turma...</option>';
    dbGetAll('turmas').filter(t => t.ativo).forEach(t => {
      sel.innerHTML += `<option value="${esc(t.id)}">${esc(t.nome)} (${turnoIcon(t.turno)} ${esc(t.turno)})</option>`;
    });
  }
  const turmaId = sel.value;
  const container = document.getElementById('grade-semanal-container');
  const totalEl = document.getElementById('grade-total-aulas');
  const infoEl = document.getElementById('grade-turma-info');
  const resumoEl = document.getElementById('grade-resumo-discs');
  if (!turmaId) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-calendar-week"></i></div><div class="empty-state-title">Selecione uma turma para visualizar a grade</div></div>`;
    if (totalEl) totalEl.textContent = '';
    if (infoEl) infoEl.style.display = 'none';
    if (resumoEl) resumoEl.style.display = 'none';
    return;
  }
  const turma = dbFind('turmas', turmaId);
  const grade = dbGetAll('grade_horaria').filter(g => g.turmaId === turmaId);
  const discs = dbGetAll('disciplinas');
  const profs = dbGetAll('professores');
  const alunosTurma = dbGetAll('alunos').filter(a => a.ativo && a.turmaId === turmaId);
  const totalAulas = grade.reduce((s, g) => s + g.qtdAulas, 0);
  if (totalEl) totalEl.textContent = `${totalAulas} aulas/semana`;

  // Turma info banner
  if (infoEl && turma) {
    infoEl.style.display = '';
    infoEl.innerHTML = `
      <div class="panel-card mb-16" style="background:linear-gradient(135deg,#1e3d7a,#0f2347);color:#fff;border:none">
        <div class="panel-card-body" style="padding:16px 20px;display:flex;align-items:center;gap:20px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:200px">
            <div style="width:48px;height:48px;background:rgba(255,255,255,.12);border-radius:var(--r-md);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">
              <i class="fa-solid fa-chalkboard"></i>
            </div>
            <div>
              <div style="font-weight:800;font-size:1rem">${esc(turma.nome)}</div>
              <div style="color:rgba(255,255,255,.5);font-size:.78rem">${turnoIcon(turma.turno)} Turno ${esc(turma.turno)}</div>
            </div>
          </div>
          <div style="display:flex;gap:20px;flex-wrap:wrap">
            <div style="text-align:center">
              <div style="font-weight:900;font-size:1.3rem">${alunosTurma.length}</div>
              <div style="font-size:.68rem;color:rgba(255,255,255,.5);font-weight:600">Alunos</div>
            </div>
            <div style="text-align:center">
              <div style="font-weight:900;font-size:1.3rem">${totalAulas}</div>
              <div style="font-size:.68rem;color:rgba(255,255,255,.5);font-weight:600">Aulas/Semana</div>
            </div>
            <div style="text-align:center">
              <div style="font-weight:900;font-size:1.3rem">${new Set(grade.map(g => g.disciplinaId)).size}</div>
              <div style="font-size:.68rem;color:rgba(255,255,255,.5);font-weight:600">Disciplinas</div>
            </div>
            <div style="text-align:center">
              <div style="font-weight:900;font-size:1.3rem">${new Set(grade.map(g => g.professorId)).size}</div>
              <div style="font-size:.68rem;color:rgba(255,255,255,.5);font-weight:600">Professores</div>
            </div>
          </div>
        </div>
      </div>`;
  }

  const byDay = {};
  for (let d = 1; d <= 5; d++) byDay[d] = grade.filter(g => g.diaSemana === d).sort((a,b) => a.ordem - b.ordem);
  container.innerHTML = `
    <div class="schedule-grid schedule-grid-editable">
      <div class="schedule-header">
        ${[1,2,3,4,5].map(d => {
          const dayTotal = byDay[d].reduce((s,g) => s + g.qtdAulas, 0);
          return `<div class="schedule-header-cell">${DIAS_SEMANA[d]} <span style="font-size:.65rem;color:var(--text-muted);font-weight:600;display:block">${dayTotal} aulas</span></div>`;
        }).join('')}
      </div>
      <div class="schedule-body">
        ${[1,2,3,4,5].map(d => `
          <div class="schedule-day-col">
            ${byDay[d].map((slot, idx) => {
              const disc = discs.find(x => x.id === slot.disciplinaId);
              const prof = profs.find(x => x.id === slot.professorId);
              return `<div class="schedule-slot editable" style="border-left:3px solid ${disc?.cor || '#666'}" onclick="openModalGradeSlot('${slot.id}')">
                <div style="font-size:.58rem;color:var(--text-muted);font-weight:700;margin-bottom:2px">${idx + 1}ª aula</div>
                <div class="schedule-slot-name"><i class="fa-solid ${disc?.icone || 'fa-book'}" style="color:${disc?.cor || '#666'}"></i> ${esc(disc?.nome || '?')}</div>
                <div class="schedule-slot-info">${slot.qtdAulas > 1 ? `<span class="badge badge-amber" style="font-size:.6rem;padding:1px 6px">${slot.qtdAulas} aulas</span>` : '<span style="font-size:.68rem;color:var(--text-muted)">1 aula</span>'}</div>
                <div class="schedule-slot-prof"><i class="fa-solid fa-user" style="font-size:.55rem;margin-right:3px;opacity:.5"></i>${esc(prof?.nome || '?')}</div>
                <button class="schedule-slot-delete" onclick="event.stopPropagation();confirmAction('Remover esta aula da grade?', () => deleteGradeSlot('${slot.id}'))"><i class="fa-solid fa-trash-can"></i></button>
              </div>`;
            }).join('')}
            <button class="schedule-add-btn" onclick="openModalGradeSlot(null, '${turmaId}', ${d})"><i class="fa-solid fa-plus"></i></button>
          </div>
        `).join('')}
      </div>
    </div>`;

  // Discipline summary
  if (resumoEl && grade.length) {
    const discCount = {};
    grade.forEach(g => { discCount[g.disciplinaId] = (discCount[g.disciplinaId] || 0) + g.qtdAulas; });
    resumoEl.style.display = '';
    resumoEl.innerHTML = `
      <div class="panel-card" style="margin-top:16px">
        <div class="panel-card-header">
          <div class="panel-card-title"><i class="fa-solid fa-chart-bar"></i> Resumo de Carga Horária</div>
        </div>
        <div class="panel-card-body" style="display:flex;gap:10px;flex-wrap:wrap">
          ${Object.entries(discCount).map(([dId, count]) => {
            const d = discs.find(x => x.id === dId);
            const profIds = [...new Set(grade.filter(g => g.disciplinaId === dId).map(g => g.professorId))];
            const profNames = profIds.map(pid => profs.find(p => p.id === pid)?.nome?.split(' ')[0] || '?').join(', ');
            return `<div style="background:${d?.cor || '#666'}11;border:1px solid ${d?.cor || '#666'}33;border-radius:var(--r-md);padding:10px 14px;min-width:140px;flex:1">
              <div style="font-weight:800;font-size:.85rem;color:${d?.cor || '#666'};display:flex;align-items:center;gap:6px"><i class="fa-solid ${d?.icone || 'fa-book'}"></i> ${esc(d?.nome || '?')}</div>
              <div style="font-size:.75rem;color:var(--text-muted);margin-top:4px"><strong>${count}</strong> aulas/semana · ${profNames}</div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
  } else if (resumoEl) {
    resumoEl.style.display = 'none';
  }
}

function openModalGradeSlot(id, presetTurmaId, presetDia) {
  document.getElementById('grade-slot-id').value = id || '';
  document.getElementById('grade-slot-modal-title').textContent = id ? 'Editar Aula da Grade' : 'Adicionar Aula à Grade';
  const turmaSel = document.getElementById('grade-slot-turma');
  turmaSel.innerHTML = '';
  dbGetAll('turmas').filter(t => t.ativo).forEach(t => { turmaSel.innerHTML += `<option value="${t.id}">${esc(t.nome)} (${esc(t.turno)})</option>`; });
  const discSel = document.getElementById('grade-slot-disc');
  discSel.innerHTML = '';
  dbGetAll('disciplinas').filter(d => d.ativo).forEach(d => { discSel.innerHTML += `<option value="${d.id}">${esc(d.nome)}</option>`; });
  const profSel = document.getElementById('grade-slot-prof');
  profSel.innerHTML = '';
  dbGetAll('professores').filter(p => p.ativo).forEach(p => { profSel.innerHTML += `<option value="${p.id}">${esc(p.nome)}</option>`; });
  document.getElementById('grade-slot-qtd').value = 1;
  if (presetTurmaId) turmaSel.value = presetTurmaId;
  if (presetDia) document.getElementById('grade-slot-dia').value = presetDia;
  if (id) {
    const slot = dbFind('grade_horaria', id);
    if (slot) {
      turmaSel.value = slot.turmaId;
      document.getElementById('grade-slot-dia').value = slot.diaSemana;
      discSel.value = slot.disciplinaId;
      profSel.value = slot.professorId;
      document.getElementById('grade-slot-qtd').value = slot.qtdAulas;
    }
  }
  openModal('modal-grade-slot');
}

function saveGradeSlot() {
  const id = document.getElementById('grade-slot-id').value;
  const turmaId = document.getElementById('grade-slot-turma').value;
  const diaSemana = parseInt(document.getElementById('grade-slot-dia').value);
  const disciplinaId = document.getElementById('grade-slot-disc').value;
  const professorId = document.getElementById('grade-slot-prof').value;
  const qtdAulas = parseInt(document.getElementById('grade-slot-qtd').value) || 1;
  if (!turmaId || !disciplinaId || !professorId) { toast('Preencha todos os campos.', 'error'); return; }
  const sameDay = dbGetAll('grade_horaria').filter(g => g.turmaId === turmaId && g.diaSemana === diaSemana && g.id !== id);
  const ordem = id ? (dbFind('grade_horaria', id)?.ordem || sameDay.length + 1) : sameDay.length + 1;
  const item = { turmaId, diaSemana, disciplinaId, professorId, qtdAulas, ordem };
  if (id) { dbUpdate('grade_horaria', id, item); toast('Aula atualizada na grade!', 'success'); }
  else { dbAdd('grade_horaria', { id: generateId('gh'), ...item }); toast('Aula adicionada à grade!', 'success'); }
  closeModal('modal-grade-slot');
  const currentTurma = document.getElementById('grade-turma-select');
  if (currentTurma && !currentTurma.value) currentTurma.value = turmaId;
  loadDirHorarios();
}

function deleteGradeSlot(id) {
  dbDelete('grade_horaria', id);
  toast('Aula removida da grade.', 'success');
  loadDirHorarios();
  closeModal('modal-confirm');
}

function openModalHorario(id) { openModalGradeSlot(id); }
function editHorario(id) { openModalGradeSlot(id); }
function saveHorario() { saveGradeSlot(); }
function deleteHorario(id) { deleteGradeSlot(id); }


// =============================================================
function loadConfigPage() {
  const escola = dbGet('escola');
  const cfg    = getConfig();

  document.getElementById('cfg-escola-nome').value   = escola.nome   || '';
  document.getElementById('cfg-escola-cidade').value = escola.cidade || '';
  document.getElementById('cfg-escola-wpp').value    = escola.whatsapp || '';
  document.getElementById('cfg-escola-email').value  = escola.email  || '';
  document.getElementById('cfg-nota-min').value      = cfg.notaMinima || 5;
  document.getElementById('cfg-bimestre-atual').value= cfg.bimestreAtual || 1;
}

function saveEscolaConfig() {
  const escola = {
    nome:     document.getElementById('cfg-escola-nome').value.trim(),
    cidade:   document.getElementById('cfg-escola-cidade').value.trim(),
    whatsapp: document.getElementById('cfg-escola-wpp').value.trim(),
    email:    document.getElementById('cfg-escola-email').value.trim(),
  };
  dbSet('escola', { ...dbGet('escola'), ...escola });
  toast('Dados da escola salvos!', 'success');
}

function saveSystemConfig() {
  setConfig({
    notaMinima:     parseFloat(document.getElementById('cfg-nota-min').value) || 5,
    bimestreAtual:  parseInt(document.getElementById('cfg-bimestre-atual').value) || 1,
  });
  toast('Configurações salvas!', 'success');
}

// =============================================================
// MODAL HELPERS
// =============================================================
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add('open');

  // Populate turma selects in modals
  if (id === 'modal-atividade') {
    const sel = document.getElementById('ativ-turma');
    sel.innerHTML = '<option value="">Selecione a turma...</option>';
    fillSelectTurmas('ativ-turma');
  }
  if (id === 'modal-aee') {
    // Só limpa o form se não houver ID de edição já preenchido
    const existingId = document.getElementById('aee-id').value;
    if (!existingId) {
      fillSelectAlunos('aee-aluno');
      document.getElementById('aee-necessidade').value = '';
      document.getElementById('aee-plano').value = '';
      document.getElementById('aee-obs').value = '';
    }
  }
  if (id === 'modal-aviso') {
    document.getElementById('aviso-titulo').value = '';
    document.getElementById('aviso-corpo').value  = '';
    document.getElementById('aviso-tipo').value   = 'info';
    const sel = document.getElementById('aviso-turma');
    // Sempre recria as opções para evitar duplicação
    sel.innerHTML = '<option value="">Toda a escola</option>';
    dbGetAll('turmas').filter(t=>t.ativo).forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id; opt.textContent = t.nome;
      sel.appendChild(opt);
    });
  }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
  CONFIRM_CB = null;
  // Limpa o ID de edição do AEE ao fechar
  if (id === 'modal-aee') {
    const el = document.getElementById('aee-id');
    if (el) el.value = '';
  }
}

function confirmAction(msg, callback) {
  CONFIRM_CB = callback;
  document.getElementById('confirm-msg').textContent = msg;
  openModal('modal-confirm');
}

function execConfirm() {
  if (CONFIRM_CB) CONFIRM_CB();
  CONFIRM_CB = null;
}

// Close modal on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
});

// =============================================================
// TOAST
// =============================================================
function toast(msg, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  const icons = { success:'fa-circle-check', error:'fa-circle-xmark', warning:'fa-triangle-exclamation', info:'fa-circle-info' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fa-solid ${icons[type]||icons.info}"></i> ${msg}`;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('removing');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// =============================================================
// REVEAL ON SCROLL
// =============================================================
function initReveal() {
  const obs = new IntersectionObserver((entries, o) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('active'); o.unobserve(e.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal:not(.active)').forEach(el => obs.observe(el));
}

// =============================================================
// INIT ON LOAD (Firebase Auth)
// =============================================================
document.addEventListener('DOMContentLoaded', async () => {
  // Listen for auth state changes
  auth.onAuthStateChanged(user => {
    handleAuthUser(user);
  });
});


// =============================================================
// CONTEXTUAL GREETING
// =============================================================
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return '🌅 Bom dia';
  if (h < 18) return '☀️ Boa tarde';
  return '🌙 Boa noite';
}

// =============================================================
// RIPPLE EFFECT ON BUTTONS
// =============================================================
document.addEventListener('click', e => {
  const btn = e.target.closest('.btn, .pub-btn-login');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple-effect';
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});

// =============================================================
// TOPBAR LIVE CLOCK
// =============================================================
let _topbarClockInterval = null;
function startTopbarClock() {
  updateTopbarDate();
  if (_topbarClockInterval) clearInterval(_topbarClockInterval);
  _topbarClockInterval = setInterval(updateTopbarDate, 60000); // update every minute
}

function updateTopbarDate() {
  const el = document.getElementById('topbar-date-text');
  if (!el) return;
  const now = new Date();
  const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const dia = dias[now.getDay()];
  const d = now.getDate();
  const m = meses[now.getMonth()];
  const h = String(now.getHours()).padStart(2,'0');
  const min = String(now.getMinutes()).padStart(2,'0');
  el.textContent = `${dia}, ${d} ${m} · ${h}:${min}`;
}

// =============================================================
// NOTA COUNTERS & BIMESTRE HIGHLIGHT
// =============================================================
function highlightActiveBimestre(bimestre) {
  // Remove previous highlights
  document.querySelectorAll('.bim-th-active, .bim-col-active').forEach(el => {
    el.classList.remove('bim-th-active', 'bim-col-active');
  });
  // Highlight the active bimestre header
  const thId = `notas-th-b${bimestre}`;
  const th = document.getElementById(thId);
  if (th) th.classList.add('bim-th-active');
}

function updateNotaCounters() {
  const bimestre = document.getElementById('notas-select-bimestre')?.value;
  if (!bimestre) return;
  const inputs = document.querySelectorAll(`#notas-tbody .nota-input[data-bim="${bimestre}"]`);
  const total = inputs.length;
  let preenchidas = 0;
  inputs.forEach(inp => { if (inp.value !== '') preenchidas++; });
  const semNota = total - preenchidas;

  // Update counters
  const semNotaBadge = document.getElementById('notas-sem-nota-badge');
  const semNotaCount = document.getElementById('notas-sem-nota-count');
  const preenchBadge = document.getElementById('notas-preenchidas-badge');
  const preenchCount = document.getElementById('notas-preenchidas-count');
  const totalCount   = document.getElementById('notas-total-count');

  if (semNotaBadge && semNotaCount) {
    semNotaCount.textContent = semNota;
    semNotaBadge.style.display = semNota > 0 ? 'inline-flex' : 'none';
  }
  if (preenchBadge && preenchCount && totalCount) {
    preenchCount.textContent = preenchidas;
    totalCount.textContent = total;
    preenchBadge.style.display = total > 0 ? 'inline-flex' : 'none';
  }
}

// =============================================================
// KEYBOARD NAVIGATION FOR NOTA INPUTS
// =============================================================
document.addEventListener('keydown', e => {
  if (!e.target.classList.contains('nota-input')) return;
  const input = e.target;
  
  // Enter or Tab: move to the same bimestre field of the next student row
  if (e.key === 'Enter') {
    e.preventDefault();
    const row = input.closest('tr');
    const nextRow = row?.nextElementSibling;
    if (nextRow) {
      const bim = input.dataset.bim;
      const nextInput = nextRow.querySelector(`.nota-input[data-bim="${bim}"]:not([disabled])`);
      if (nextInput) { nextInput.focus(); nextInput.select(); }
    }
  }
  // Escape: blur the input
  if (e.key === 'Escape') {
    input.blur();
  }
});

// =============================================================
// CONFETTI ON APPROVAL
// =============================================================
function launchConfetti() {
  const container = document.body;
  const colors = ['#059669','#fbbf24','#3b82f6','#ef4444','#ec4899','#8b5cf6'];
  for (let i = 0; i < 60; i++) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position:fixed; top:-10px; left:${Math.random()*100}vw;
      width:${6+Math.random()*6}px; height:${6+Math.random()*6}px;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      border-radius:${Math.random()>0.5?'50%':'2px'};
      z-index:9999; pointer-events:none;
      animation:confettiFall ${1.5+Math.random()*2}s ease-in ${Math.random()*0.5}s forwards;
    `;
    container.appendChild(confetti);
    setTimeout(() => confetti.remove(), 4000);
  }
}

// Add confetti keyframe
if (!document.getElementById('confetti-style')) {
  const style = document.createElement('style');
  style.id = 'confetti-style';
  style.textContent = `
    @keyframes confettiFall {
      0% { transform:translateY(0) rotate(0deg); opacity:1; }
      100% { transform:translateY(100vh) rotate(720deg); opacity:0; }
    }
  `;
  document.head.appendChild(style);
}

// =============================================================
// LOGIN PARTICLES ANIMATION
// =============================================================
function initLoginParticles() {
  const canvas = document.getElementById('loginParticles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  const COUNT = 45;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.4,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.35 + 0.08
    });
  }

  function draw() {
    if (!document.getElementById('login-screen') || document.getElementById('login-screen').style.display === 'none') return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => {
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(251,191,36,${p.opacity})`;
      ctx.fill();
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(37,99,235,${0.05 * (1 - dist / 100)})`;
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }
      }
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// =============================================================
// LOGIN TYPING EFFECT
// =============================================================
function initTypingEffect() {
  const el = document.getElementById('login-typing');
  if (!el) return;
  const text = el.textContent;
  el.textContent = '';
  el.style.borderRight = '2px solid rgba(255,255,255,0.5)';
  let i = 0;
  const iv = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) {
      clearInterval(iv);
      setTimeout(() => { el.style.borderRight = 'none'; }, 1500);
    }
  }, 60);
}

// Init login effects on load
document.addEventListener('DOMContentLoaded', () => {
  initLoginParticles();
  initTypingEffect();
});

// =============================================================
// STUDENT INDIVIDUAL CHARTS (Radar + Line)
// =============================================================
function renderAlunoCharts() {
  if (!SESSION || SESSION.role !== 'aluno' || !SESSION.user) return;
  const aluno = SESSION.user;
  const disciplinas = dbGetAll('disciplinas').filter(d => d.ativo);
  const notas = getNotasAluno(aluno.id);
  const cfg = getConfig();

  // Radar Chart — Performance by discipline
  destroyChart('chart-aluno-radar');
  const ctxRadar = document.getElementById('chart-aluno-radar');
  if (ctxRadar && disciplinas.length > 0) {
    const labels = disciplinas.map(d => d.nome.length > 10 ? d.nome.slice(0, 10) + '…' : d.nome);
    const data = disciplinas.map(d => {
      const n = notas.find(n => n.disciplinaId === d.id);
      if (!n) return 0;
      const vals = [n.b1, n.b2, n.b3, n.b4].filter(v => v !== null && v !== undefined);
      return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
    });
    chartInstances['chart-aluno-radar'] = new Chart(ctxRadar, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: 'Minha Média',
          data,
          backgroundColor: 'rgba(37,99,235,0.15)',
          borderColor: '#2563eb',
          borderWidth: 2,
          pointBackgroundColor: '#2563eb',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { r: { beginAtZero: true, max: 10, ticks: { stepSize: 2, font: { size: 10 } }, pointLabels: { font: { size: 11, family: 'Inter', weight: '600' } } } }
      }
    });
  }

  // Line Chart — Evolution by bimester
  destroyChart('chart-aluno-evolucao');
  const ctxLine = document.getElementById('chart-aluno-evolucao');
  if (ctxLine) {
    const datasets = [];
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316', '#6366f1'];
    disciplinas.forEach((d, idx) => {
      const n = notas.find(n => n.disciplinaId === d.id);
      if (!n) return;
      const vals = [n.b1, n.b2, n.b3, n.b4];
      if (vals.every(v => v === null || v === undefined)) return;
      datasets.push({
        label: d.nome.length > 12 ? d.nome.slice(0, 12) + '…' : d.nome,
        data: vals.map(v => v !== null && v !== undefined ? +v : null),
        borderColor: d.cor || colors[idx % colors.length],
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: d.cor || colors[idx % colors.length],
        spanGaps: true
      });
    });
    chartInstances['chart-aluno-evolucao'] = new Chart(ctxLine, {
      type: 'line',
      data: { labels: ['1º Bim', '2º Bim', '3º Bim', '4º Bim'], datasets },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11, weight: '600' }, boxWidth: 12, padding: 12 } } },
        scales: { y: { beginAtZero: true, max: 10 } }
      }
    });
  }
}

// =============================================================
// CALENDAR RENDERING
// =============================================================
let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();

function renderCalendario(containerId) {
  const body = document.getElementById(containerId);
  if (!body) return;
  const eventos = dbGetAll('eventos_calendario');
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const today = new Date();
  const isCurrentMonth = today.getMonth() === calendarMonth && today.getFullYear() === calendarYear;

  let html = `<div class="cal-header">
    <button class="btn btn-sm btn-ghost" onclick="calendarMonth--;if(calendarMonth<0){calendarMonth=11;calendarYear--;}renderCalendario('${containerId}')"><i class="fa-solid fa-chevron-left"></i></button>
    <span class="cal-title">${monthNames[calendarMonth]} ${calendarYear}</span>
    <button class="btn btn-sm btn-ghost" onclick="calendarMonth++;if(calendarMonth>11){calendarMonth=0;calendarYear++;}renderCalendario('${containerId}')"><i class="fa-solid fa-chevron-right"></i></button>
  </div>`;

  html += '<div class="cal-grid"><div class="cal-day-name">Dom</div><div class="cal-day-name">Seg</div><div class="cal-day-name">Ter</div><div class="cal-day-name">Qua</div><div class="cal-day-name">Qui</div><div class="cal-day-name">Sex</div><div class="cal-day-name">Sáb</div>';

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-cell empty"></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = eventos.filter(e => e.data === dateStr);
    const isToday = isCurrentMonth && today.getDate() === d;
    const dots = dayEvents.map(e => `<span class="cal-dot" style="background:${e.cor}" title="${e.titulo}"></span>`).join('');
    html += `<div class="cal-cell${isToday ? ' today' : ''}${dayEvents.length ? ' has-event' : ''}" ${dayEvents.length ? `data-tooltip="${dayEvents.map(e => e.titulo).join(', ')}"` : ''}>
      <span class="cal-num">${d}</span>${dots ? `<div class="cal-dots">${dots}</div>` : ''}
    </div>`;
  }
  html += '</div>';

  // Upcoming events list
  const upcoming = eventos.filter(e => e.data >= todayISO()).sort((a, b) => a.data.localeCompare(b.data)).slice(0, 4);
  if (upcoming.length) {
    html += '<div class="cal-events">';
    upcoming.forEach(e => {
      html += `<div class="cal-event-item">
        <div class="cal-event-dot" style="background:${e.cor}"></div>
        <div class="cal-event-info">
          <div class="cal-event-title">${e.titulo}</div>
          <div class="cal-event-date">${formatDate(e.data)}</div>
        </div>
        ${SESSION.role === 'diretor' ? `<button class="btn btn-sm btn-ghost" onclick="confirmAction('Excluir evento?',()=>deleteEvento('${e.id}'))"><i class="fa-solid fa-trash-can" style="font-size:.7rem"></i></button>` : ''}
      </div>`;
    });
    html += '</div>';
  }

  body.innerHTML = html;
}

// Calendar CRUD
function openModalEvento(id = null) {
  document.getElementById('evento-id').value = id || '';
  document.getElementById('evento-modal-title').textContent = id ? 'Editar Evento' : 'Novo Evento';
  document.getElementById('evento-titulo').value = '';
  document.getElementById('evento-data').value = todayISO();
  document.getElementById('evento-tipo').value = 'academico';
  document.getElementById('evento-cor').value = '#2563eb';
  document.getElementById('evento-desc').value = '';
  if (id) {
    const ev = dbFind('eventos_calendario', id);
    if (ev) {
      document.getElementById('evento-titulo').value = ev.titulo;
      document.getElementById('evento-data').value = ev.data;
      document.getElementById('evento-tipo').value = ev.tipo || 'academico';
      document.getElementById('evento-cor').value = ev.cor || '#2563eb';
      document.getElementById('evento-desc').value = ev.descricao || '';
    }
  }
  openModal('modal-evento');
}

function saveEvento() {
  const id = document.getElementById('evento-id').value;
  const titulo = document.getElementById('evento-titulo').value.trim();
  const data = document.getElementById('evento-data').value;
  const tipo = document.getElementById('evento-tipo').value;
  const cor = document.getElementById('evento-cor').value;
  const descricao = document.getElementById('evento-desc').value.trim();
  if (!titulo || !data) { toast('Preencha título e data.', 'error'); return; }
  const item = { titulo, data, tipo, cor, descricao };
  if (id) {
    dbUpdate('eventos_calendario', id, item);
    toast('Evento atualizado!', 'success');
  } else {
    dbAdd('eventos_calendario', { id: generateId('ev'), ...item });
    toast('Evento criado!', 'success');
  }
  closeModal('modal-evento');
  renderCalendario('dir-calendario-body');
}

function deleteEvento(id) {
  dbDelete('eventos_calendario', id);
  toast('Evento excluído.', 'success');
  renderCalendario('dir-calendario-body');
  closeModal('modal-confirm');
}

// =============================================================
// PROFESSOR GRADING STATUS
// =============================================================
function renderProfStatus() {
  const body = document.getElementById('dir-prof-status-body');
  const badge = document.getElementById('dir-bim-status-badge');
  if (!body) return;
  const cfg = getConfig();
  const bim = cfg.bimestreAtual || 1;
  if (badge) badge.textContent = `${bim}º Bimestre`;

  const profs = dbGetAll('professores').filter(p => p.ativo);
  const alunos = dbGetAll('alunos').filter(a => a.ativo);
  const discs = dbGetAll('disciplinas').filter(d => d.ativo);
  const todasNotas = dbGetAll('notas');
  const bKey = `b${bim}`;

  if (!profs.length) { body.innerHTML = buildEmptyState('Nenhum professor.'); return; }

  body.innerHTML = profs.map(p => {
    const turmaIds = p.turmaIds || [];
    const profAlunos = alunos.filter(a => turmaIds.includes(a.turmaId));
    const totalExpected = profAlunos.length * discs.length;
    let filled = 0;
    profAlunos.forEach(a => {
      discs.forEach(d => {
        const nota = todasNotas.find(n => n.alunoId === a.id && n.disciplinaId === d.id);
        if (nota && nota[bKey] !== null && nota[bKey] !== undefined) filled++;
      });
    });
    const pct = totalExpected > 0 ? Math.round((filled / totalExpected) * 100) : 0;
    const statusColor = pct >= 100 ? '#059669' : pct >= 50 ? '#d97706' : '#dc2626';
    const statusLabel = pct >= 100 ? '✅ Completo' : pct > 0 ? '⏳ Pendente' : '⚠️ Sem lançamento';

    return `<div class="prof-status-item">
      <div class="prof-status-info">
        <span class="prof-status-name">${p.nome.split(' ').slice(0, 2).join(' ')}</span>
        <span class="prof-status-pct" style="color:${statusColor}">${pct}% ${statusLabel}</span>
      </div>
      <div class="prof-status-bar">
        <div class="prof-status-fill" style="width:${pct}%;background:${statusColor}"></div>
      </div>
    </div>`;
  }).join('');
}

// =============================================================
// BOLETIM PDF GENERATION
// =============================================================
function generateBoletimPDF(alunoId) {
  const aluno = alunoId ? dbFind('alunos', alunoId) : SESSION?.user;
  if (!aluno) { toast('Aluno não encontrado.', 'error'); return; }
  const turma = dbFind('turmas', aluno.turmaId);
  const escola = dbGet('escola');
  const cfg = getConfig();
  const disciplinas = dbGetAll('disciplinas').filter(d => d.ativo);
  const notas = getNotasAluno(aluno.id);
  const freqAll = dbGetAll('frequencia').filter(f => f.turmaId === aluno.turmaId);
  let totalAulas = 0, presencas = 0;
  freqAll.forEach(f => {
    const aula = f.aulas.find(a => a.alunoId === aluno.id);
    if (aula) { totalAulas++; if (aula.status === 'presente') presencas++; }
  });
  const freqPct = totalAulas > 0 ? ((presencas / totalAulas) * 100).toFixed(1) : '—';

  const rows = disciplinas.map(d => {
    const n = notas.find(n => n.disciplinaId === d.id);
    const b1 = n?.b1 ?? null, b2 = n?.b2 ?? null, b3 = n?.b3 ?? null, b4 = n?.b4 ?? null;
    const anual = getNotaAnual(b1, b2, b3, b4);
    const sit = anual === null ? 'Em Curso' : anual >= cfg.notaMinima ? '✅ Aprovado' : '❌ Reprovado';
    const sitColor = anual === null ? '#666' : anual >= cfg.notaMinima ? '#059669' : '#dc2626';
    return `<tr>
      <td style="font-weight:600;text-align:left;padding:8px 12px;border:1px solid #e2e8f0">${d.nome}</td>
      <td style="text-align:center;padding:8px;border:1px solid #e2e8f0;color:${b1 !== null && b1 >= cfg.notaMinima ? '#059669' : '#dc2626'}">${b1 !== null ? parseFloat(b1).toFixed(1) : '—'}</td>
      <td style="text-align:center;padding:8px;border:1px solid #e2e8f0;color:${b2 !== null && b2 >= cfg.notaMinima ? '#059669' : '#dc2626'}">${b2 !== null ? parseFloat(b2).toFixed(1) : '—'}</td>
      <td style="text-align:center;padding:8px;border:1px solid #e2e8f0;color:${b3 !== null && b3 >= cfg.notaMinima ? '#059669' : '#dc2626'}">${b3 !== null ? parseFloat(b3).toFixed(1) : '—'}</td>
      <td style="text-align:center;padding:8px;border:1px solid #e2e8f0;color:${b4 !== null && b4 >= cfg.notaMinima ? '#059669' : '#dc2626'}">${b4 !== null ? parseFloat(b4).toFixed(1) : '—'}</td>
      <td style="text-align:center;padding:8px;border:1px solid #e2e8f0;font-weight:800">${anual !== null ? anual.toFixed(1) : '—'}</td>
      <td style="text-align:center;padding:8px;border:1px solid #e2e8f0;font-weight:700;color:${sitColor}">${sit}</td>
    </tr>`;
  }).join('');

  // Check overall approval
  let totalAprov = 0, totalRep = 0;
  disciplinas.forEach(d => {
    const n = notas.find(n => n.disciplinaId === d.id);
    const anual = getNotaAnual(n?.b1 ?? null, n?.b2 ?? null, n?.b3 ?? null, n?.b4 ?? null);
    if (anual !== null) { if (anual >= cfg.notaMinima) totalAprov++; else totalRep++; }
  });

  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Boletim - ${aluno.nome}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Inter',sans-serif; padding:40px; color:#0f172a; background:#fff; }
      .header { text-align:center; margin-bottom:32px; padding-bottom:24px; border-bottom:3px solid #0f2347; }
      .logo-row { display:flex; align-items:center; justify-content:center; gap:16px; margin-bottom:12px; }
      .school-name { font-size:1.3rem; font-weight:900; color:#0f2347; }
      .school-sub { font-size:.85rem; color:#64748b; }
      .boletim-title { font-size:1.5rem; font-weight:900; color:#0f2347; margin:20px 0 8px; letter-spacing:-0.02em; }
      .info-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:24px; }
      .info-item { background:#f1f5f9; padding:12px 16px; border-radius:8px; }
      .info-label { font-size:.72rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.06em; }
      .info-value { font-size:.95rem; font-weight:700; color:#0f172a; margin-top:4px; }
      table { width:100%; border-collapse:collapse; margin-bottom:24px; }
      th { background:#0f2347; color:#fff; padding:10px 12px; font-size:.78rem; font-weight:700; text-transform:uppercase; letter-spacing:.04em; border:1px solid #0f2347; }
      .freq-box { display:flex; gap:24px; padding:16px; background:#f1f5f9; border-radius:12px; margin-bottom:24px; }
      .freq-item { text-align:center; flex:1; }
      .freq-num { font-size:1.8rem; font-weight:900; }
      .freq-label { font-size:.75rem; color:#64748b; font-weight:600; }
      .seal { text-align:center; padding:20px; margin:24px 0; border:2px dashed #e2e8f0; border-radius:12px; }
      .seal-text { font-size:1.1rem; font-weight:800; }
      .footer { text-align:center; margin-top:32px; padding-top:20px; border-top:2px solid #e2e8f0; color:#94a3b8; font-size:.75rem; }
      @media print { body { padding:20px; } }
    </style>
  </head><body>
    <div class="header">
      <div class="logo-row">
        <div style="width:56px;height:56px;background:linear-gradient(135deg,#0f2347,#2563eb);border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fbbf24;font-size:1.5rem;font-weight:900">📚</div>
        <div style="text-align:left">
          <div class="school-name">${escola.nome || 'U.E. Professora Edith Nair'}</div>
          <div class="school-sub">${escola.cidade || 'Viana — MA'} · Ano Letivo ${escola.anoLetivo || 2026}</div>
        </div>
      </div>
      <div class="boletim-title">📄 BOLETIM ESCOLAR</div>
    </div>

    <div class="info-grid">
      <div class="info-item"><div class="info-label">Aluno(a)</div><div class="info-value">${aluno.nome}</div></div>
      <div class="info-item"><div class="info-label">Matrícula</div><div class="info-value">${aluno.matricula}</div></div>
      <div class="info-item"><div class="info-label">Turma / Turno</div><div class="info-value">${turma ? turma.nome + ' · ' + turma.turno : '—'}</div></div>
    </div>

    <table>
      <thead><tr>
        <th style="text-align:left">Disciplina</th><th>1º Bim</th><th>2º Bim</th><th>3º Bim</th><th>4º Bim</th><th>Média Anual</th><th>Situação</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="freq-box">
      <div class="freq-item"><div class="freq-num" style="color:#2563eb">${totalAulas}</div><div class="freq-label">Aulas Registradas</div></div>
      <div class="freq-item"><div class="freq-num" style="color:#059669">${presencas}</div><div class="freq-label">Presenças</div></div>
      <div class="freq-item"><div class="freq-num" style="color:#dc2626">${totalAulas - presencas}</div><div class="freq-label">Faltas</div></div>
      <div class="freq-item"><div class="freq-num" style="color:${parseFloat(freqPct) >= 75 ? '#059669' : '#dc2626'}">${freqPct}%</div><div class="freq-label">Frequência</div></div>
    </div>

    <div class="seal">
      <div class="seal-text" style="color:${totalRep > 0 ? '#dc2626' : totalAprov > 0 ? '#059669' : '#64748b'}">${totalRep > 0 ? '❌ ALUNO EM RECUPERAÇÃO' : totalAprov > 0 ? '✅ ALUNO APROVADO' : '📋 BOLETIM PARCIAL — NOTAS EM ANDAMENTO'}</div>
      <div style="color:#94a3b8;font-size:.78rem;margin-top:8px">Nota mínima para aprovação: ${cfg.notaMinima.toFixed(1)}</div>
    </div>

    <div class="footer">
      <div style="margin-bottom:40px;display:flex;justify-content:space-around">
        <div style="text-align:center"><div style="border-top:1px solid #cbd5e1;width:200px;margin:0 auto;padding-top:8px;font-size:.8rem;color:#475569">Diretor(a)</div></div>
        <div style="text-align:center"><div style="border-top:1px solid #cbd5e1;width:200px;margin:0 auto;padding-top:8px;font-size:.8rem;color:#475569">Secretário(a)</div></div>
      </div>
      <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} · ${escola.nome || 'U.E. Professora Edith Nair Furtado da Silva'}</p>
      <p>SEMED · Secretaria Municipal de Educação · ${escola.cidade || 'Viana — MA'}</p>
    </div>
    <script>setTimeout(()=>window.print(),500)<\/script>
  </body></html>`);
  w.document.close();
}

// =============================================================
// CONTENT MANAGEMENT — TABS
// =============================================================
function switchContentTab(tabId) {
  document.querySelectorAll('.content-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.content-tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`.content-tab[data-tab="${tabId}"]`)?.classList.add('active');
  document.getElementById(tabId)?.classList.add('active');
}

function loadDirConteudo() {
  loadDepoimentos();
  loadGaleriaAdmin();
  loadEquipeAdmin();
}

// =============================================================
// CONTENT: DEPOIMENTOS
// =============================================================
function loadDepoimentos() {
  const tbody = document.getElementById('dir-depoimentos-tbody');
  if (!tbody) return;
  const items = dbGetAll('depoimentos').filter(d => d.ativo !== false).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="5">${buildEmptyState('Nenhum depoimento cadastrado.')}</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(d => `<tr>
    <td style="font-weight:700">${esc(d.nome)}</td>
    <td style="color:var(--text-muted);font-size:.82rem">${esc(d.cargo)}</td>
    <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.82rem">${esc(d.texto)}</td>
    <td><div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,${d.cor1},${d.cor2})"></div></td>
    <td class="text-right" style="display:flex;gap:6px;justify-content:flex-end">
      <button class="btn btn-sm btn-ghost" onclick="openModalDepoimento('${d.id}')"><i class="fa-solid fa-pen"></i></button>
      <button class="btn btn-sm btn-danger" onclick="confirmAction('Excluir este depoimento?',()=>deleteDepoimento('${d.id}'))"><i class="fa-solid fa-trash-can"></i></button>
    </td>
  </tr>`).join('');
}

function openModalDepoimento(id = null) {
  document.getElementById('dep-id').value = id || '';
  document.getElementById('depoimento-modal-title').textContent = id ? 'Editar Depoimento' : 'Novo Depoimento';
  document.getElementById('dep-texto').value = '';
  document.getElementById('dep-nome').value = '';
  document.getElementById('dep-cargo').value = '';
  document.getElementById('dep-cor1').value = '#059669';
  document.getElementById('dep-cor2').value = '#10b981';

  if (id) {
    const d = dbFind('depoimentos', id);
    if (d) {
      document.getElementById('dep-texto').value = d.texto || '';
      document.getElementById('dep-nome').value = d.nome || '';
      document.getElementById('dep-cargo').value = d.cargo || '';
      document.getElementById('dep-cor1').value = d.cor1 || '#059669';
      document.getElementById('dep-cor2').value = d.cor2 || '#10b981';
    }
  }
  openModal('modal-depoimento');
}

function saveDepoimento() {
  const id = document.getElementById('dep-id').value;
  const texto = document.getElementById('dep-texto').value.trim();
  const nome = document.getElementById('dep-nome').value.trim();
  const cargo = document.getElementById('dep-cargo').value.trim();
  const cor1 = document.getElementById('dep-cor1').value;
  const cor2 = document.getElementById('dep-cor2').value;

  if (!texto || !nome || !cargo) { toast('Preencha texto, nome e cargo.', 'error'); return; }

  const data = { texto, nome, cargo, cor1, cor2, ativo: true };
  if (id) {
    dbUpdate('depoimentos', id, data);
    toast('Depoimento atualizado!', 'success');
  } else {
    const all = dbGetAll('depoimentos');
    data.ordem = all.length + 1;
    dbAdd('depoimentos', { id: generateId('dep'), ...data });
    toast('Depoimento criado!', 'success');
  }
  closeModal('modal-depoimento');
  loadDepoimentos();
}

function deleteDepoimento(id) {
  dbUpdate('depoimentos', id, { ativo: false });
  toast('Depoimento removido.', 'success');
  loadDepoimentos();
  closeModal('modal-confirm');
}

// =============================================================
// CONTENT: GALERIA
// =============================================================
function loadGaleriaAdmin() {
  const tbody = document.getElementById('dir-galeria-tbody');
  if (!tbody) return;
  const items = dbGetAll('galeria').filter(g => g.ativo !== false).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="4">${buildEmptyState('Nenhum item na galeria.')}</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(g => `<tr>
    <td style="font-weight:700">${esc(g.titulo)}</td>
    <td><code style="font-size:.78rem;background:var(--bg);padding:2px 8px;border-radius:4px">fa-solid ${esc(g.icone)}</code></td>
    <td>
      <div style="width:60px;height:44px;border-radius:8px;background:linear-gradient(135deg,${g.corFundo1},${g.corFundo2});display:flex;align-items:center;justify-content:center">
        <i class="fa-solid ${g.icone}" style="color:${g.corIcone};font-size:1.1rem"></i>
      </div>
    </td>
    <td class="text-right" style="display:flex;gap:6px;justify-content:flex-end">
      <button class="btn btn-sm btn-ghost" onclick="openModalGaleria('${g.id}')"><i class="fa-solid fa-pen"></i></button>
      <button class="btn btn-sm btn-danger" onclick="confirmAction('Excluir este item?',()=>deleteGaleria('${g.id}'))"><i class="fa-solid fa-trash-can"></i></button>
    </td>
  </tr>`).join('');
}

function openModalGaleria(id = null) {
  document.getElementById('gal-id').value = id || '';
  document.getElementById('galeria-modal-title').textContent = id ? 'Editar Item' : 'Novo Item da Galeria';
  document.getElementById('gal-titulo').value = '';
  document.getElementById('gal-icone').value = '';
  document.getElementById('gal-cor1').value = '#dbeafe';
  document.getElementById('gal-cor2').value = '#bfdbfe';
  document.getElementById('gal-cor-icone').value = '#2563eb';

  if (id) {
    const g = dbFind('galeria', id);
    if (g) {
      document.getElementById('gal-titulo').value = g.titulo || '';
      document.getElementById('gal-icone').value = g.icone || '';
      document.getElementById('gal-cor1').value = g.corFundo1 || '#dbeafe';
      document.getElementById('gal-cor2').value = g.corFundo2 || '#bfdbfe';
      document.getElementById('gal-cor-icone').value = g.corIcone || '#2563eb';
    }
  }
  openModal('modal-galeria');
}

function saveGaleria() {
  const id = document.getElementById('gal-id').value;
  const titulo = document.getElementById('gal-titulo').value.trim();
  const icone = document.getElementById('gal-icone').value.trim();
  const corFundo1 = document.getElementById('gal-cor1').value;
  const corFundo2 = document.getElementById('gal-cor2').value;
  const corIcone = document.getElementById('gal-cor-icone').value;

  if (!titulo || !icone) { toast('Preencha título e ícone.', 'error'); return; }

  const data = { titulo, icone, corFundo1, corFundo2, corIcone, ativo: true };
  if (id) {
    dbUpdate('galeria', id, data);
    toast('Item atualizado!', 'success');
  } else {
    const all = dbGetAll('galeria');
    data.ordem = all.length + 1;
    dbAdd('galeria', { id: generateId('gal'), ...data });
    toast('Item criado!', 'success');
  }
  closeModal('modal-galeria');
  loadGaleriaAdmin();
}

function deleteGaleria(id) {
  dbUpdate('galeria', id, { ativo: false });
  toast('Item removido.', 'success');
  loadGaleriaAdmin();
  closeModal('modal-confirm');
}

// =============================================================
// CONTENT: EQUIPE
// =============================================================
function loadEquipeAdmin() {
  const tbody = document.getElementById('dir-equipe-tbody');
  if (!tbody) return;
  const items = dbGetAll('equipe').filter(e => e.ativo !== false).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="5">${buildEmptyState('Nenhum membro cadastrado.')}</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(e => `<tr>
    <td style="font-weight:700">${esc(e.nome)}</td>
    <td style="color:var(--text-muted);font-size:.82rem">${esc(e.cargo)}</td>
    <td><i class="fa-solid ${e.icone}" style="font-size:1.1rem;color:${e.cor1}"></i></td>
    <td><div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,${e.cor1},${e.cor2})"></div></td>
    <td class="text-right" style="display:flex;gap:6px;justify-content:flex-end">
      <button class="btn btn-sm btn-ghost" onclick="openModalEquipe('${e.id}')"><i class="fa-solid fa-pen"></i></button>
      <button class="btn btn-sm btn-danger" onclick="confirmAction('Excluir este membro?',()=>deleteEquipe('${e.id}'))"><i class="fa-solid fa-trash-can"></i></button>
    </td>
  </tr>`).join('');
}

function openModalEquipe(id = null) {
  document.getElementById('eqp-id').value = id || '';
  document.getElementById('equipe-modal-title').textContent = id ? 'Editar Membro' : 'Novo Membro';
  document.getElementById('eqp-nome').value = '';
  document.getElementById('eqp-cargo').value = '';
  document.getElementById('eqp-descricao').value = '';
  document.getElementById('eqp-icone').value = '';
  document.getElementById('eqp-cor1').value = '#2563eb';
  document.getElementById('eqp-cor2').value = '#3b82f6';

  if (id) {
    const e = dbFind('equipe', id);
    if (e) {
      document.getElementById('eqp-nome').value = e.nome || '';
      document.getElementById('eqp-cargo').value = e.cargo || '';
      document.getElementById('eqp-descricao').value = e.descricao || '';
      document.getElementById('eqp-icone').value = e.icone || '';
      document.getElementById('eqp-cor1').value = e.cor1 || '#2563eb';
      document.getElementById('eqp-cor2').value = e.cor2 || '#3b82f6';
    }
  }
  openModal('modal-equipe');
}

function saveEquipe() {
  const id = document.getElementById('eqp-id').value;
  const nome = document.getElementById('eqp-nome').value.trim();
  const cargo = document.getElementById('eqp-cargo').value.trim();
  const descricao = document.getElementById('eqp-descricao').value.trim();
  const icone = document.getElementById('eqp-icone').value.trim();
  const cor1 = document.getElementById('eqp-cor1').value;
  const cor2 = document.getElementById('eqp-cor2').value;

  if (!nome || !cargo) { toast('Preencha nome e cargo.', 'error'); return; }

  const data = { nome, cargo, descricao, icone: icone || 'fa-user', cor1, cor2, ativo: true };
  if (id) {
    dbUpdate('equipe', id, data);
    toast('Membro atualizado!', 'success');
  } else {
    const all = dbGetAll('equipe');
    data.ordem = all.length + 1;
    dbAdd('equipe', { id: generateId('eq'), ...data });
    toast('Membro cadastrado!', 'success');
  }
  closeModal('modal-equipe');
  loadEquipeAdmin();
}

function deleteEquipe(id) {
  dbUpdate('equipe', id, { ativo: false });
  toast('Membro removido.', 'success');
  loadEquipeAdmin();
  closeModal('modal-confirm');
}
