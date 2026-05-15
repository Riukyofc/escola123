// =============================================================
// SEMED.JS — Funções da Secretaria de Educação
// =============================================================
// SEGURANÇA: esc() / escapeHtml() é definido em dashboard.js (carregado antes)

// ── Helpers ───────────────────────────────────────────────────
function formatCurrency(v) { return 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function getGreetingSemed() { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }
const TIPO_CIRCULAR = { resolucao: '📜 Resolução', portaria: '📋 Portaria', oficio: '📄 Ofício', circular: '📢 Circular' };

// =============================================================
// 1. DASHBOARD BIG DATA
// =============================================================
let chartIdeb = null;
function loadSecInicio() {
  const alunos = dbGetAll('alunos').filter(a => a.ativo);
  const profs = dbGetAll('professores').filter(p => p.ativo);
  const turmas = dbGetAll('turmas').filter(t => t.ativo);
  const notas = dbGetAll('notas');
  const cfg = getConfig();

  // Welcome
  const el = document.getElementById('wb-sec-nome');
  if (el) el.textContent = getGreetingSemed() + ', Secretaria!';
  const sa = document.getElementById('wb-sec-alunos'); if (sa) sa.textContent = alunos.length;
  const sp = document.getElementById('wb-sec-profs'); if (sp) sp.textContent = profs.length;
  const st = document.getElementById('wb-sec-turmas'); if (st) st.textContent = turmas.length;

  // Taxa aprovação
  let totalAvaliados = 0, aprovados = 0;
  alunos.forEach(a => {
    const ns = notas.filter(n => n.alunoId === a.id);
    ns.forEach(n => {
      const an = getNotaAnual(n.b1, n.b2, n.b3, n.b4);
      if (an !== null) { totalAvaliados++; if (an >= cfg.notaMinima) aprovados++; }
    });
  });
  const txAprov = totalAvaliados > 0 ? ((aprovados / totalAvaliados) * 100).toFixed(0) : '—';
  const sap = document.getElementById('wb-sec-aprovacao'); if (sap) sap.textContent = txAprov + '%';

  // Stats row
  const circs = dbGetAll('circulares');
  const pendentes = circs.filter(c => c.status === 'pendente').length;
  const repasses = dbGetAll('repasses_financeiros');
  const totalRepasse = repasses.reduce((s, r) => s + (r.valor || 0), 0);
  const estoque = dbGetAll('estoque_merenda');
  const criticos = estoque.filter(e => e.quantidade < e.minimo).length;

  document.getElementById('sec-stats-row').innerHTML = `
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">IDEB Atual</span><div class="stat-icon blue"><i class="fa-solid fa-chart-line"></i></div></div>
      <div class="stat-num">${getUltimoIdeb()}</div><div class="stat-desc">Último resultado</div></div>
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Circulares Pendentes</span><div class="stat-icon red"><i class="fa-solid fa-scroll"></i></div></div>
      <div class="stat-num" style="color:var(--danger)">${pendentes}</div><div class="stat-desc">aguardando ciência</div></div>
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Total Repassado</span><div class="stat-icon green"><i class="fa-solid fa-money-bill-wave"></i></div></div>
      <div class="stat-num" style="font-size:1.1rem">${formatCurrency(totalRepasse)}</div><div class="stat-desc">no ano letivo</div></div>
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Estoque Crítico</span><div class="stat-icon ${criticos > 0 ? 'red' : 'green'}"><i class="fa-solid fa-utensils"></i></div></div>
      <div class="stat-num" style="color:${criticos > 0 ? 'var(--danger)' : 'var(--success)'}">${criticos}</div><div class="stat-desc">itens abaixo do mínimo</div></div>`;

  renderIdebChart();
  renderEvasao();
  renderAlertasAuto();
}

function getUltimoIdeb() {
  const hist = dbGetAll('ideb_historico').sort((a, b) => b.ano - a.ano);
  return hist.length > 0 ? hist[0].nota.toFixed(1) : '—';
}

function renderIdebChart() {
  const hist = dbGetAll('ideb_historico').sort((a, b) => a.ano - b.ano);
  const badge = document.getElementById('sec-ideb-ultimo');
  if (badge && hist.length) badge.textContent = 'IDEB ' + hist[hist.length - 1].nota.toFixed(1);

  const canvas = document.getElementById('chart-ideb');
  if (!canvas) return;
  if (chartIdeb) chartIdeb.destroy();
  chartIdeb = new Chart(canvas, {
    type: 'line',
    data: {
      labels: hist.map(h => h.ano),
      datasets: [
        { label: 'Nota IDEB', data: hist.map(h => h.nota), borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.1)', fill: true, tension: 0.3, pointRadius: 5, pointBackgroundColor: '#2563eb' },
        { label: 'Meta', data: hist.map(h => h.meta), borderColor: '#d97706', borderDash: [6, 3], pointRadius: 4, pointBackgroundColor: '#d97706', fill: false, tension: 0.3 }
      ]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: false, min: 3, max: 7 } } }
  });
}

function renderEvasao() {
  const turmas = dbGetAll('turmas').filter(t => t.ativo);
  const alunos = dbGetAll('alunos').filter(a => a.ativo);
  const notas = dbGetAll('notas');
  const freqs = dbGetAll('frequencia');
  const cfg = getConfig();
  const body = document.getElementById('sec-evasao-body');
  if (!body) return;

  let totalRisco = 0;
  let html = '';
  turmas.forEach(t => {
    const alunosTurma = alunos.filter(a => a.turmaId === t.id);
    let emRisco = 0;
    alunosTurma.forEach(a => {
      const freqTurma = freqs.filter(f => f.turmaId === t.id);
      let totalAulas = 0, faltas = 0;
      freqTurma.forEach(f => { const au = f.aulas?.find(x => x.alunoId === a.id); if (au) { totalAulas++; if (au.status === 'falta') faltas++; } });
      const taxaFalta = totalAulas > 0 ? (faltas / totalAulas) : 0;
      const ns = notas.filter(n => n.alunoId === a.id);
      let discBaixas = 0;
      ns.forEach(n => { const bim = n[`b${cfg.bimestreAtual}`]; if (bim !== null && bim !== undefined && bim < cfg.notaMinima) discBaixas++; });
      if (taxaFalta > 0.25 || discBaixas >= 3) emRisco++;
    });
    totalRisco += emRisco;
    const pct = alunosTurma.length > 0 ? ((emRisco / alunosTurma.length) * 100).toFixed(0) : 0;
    const cor = pct >= 30 ? '#dc2626' : pct >= 15 ? '#d97706' : '#059669';
    html += `<div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-weight:600;font-size:.85rem">${esc(t.nome)} <span style="color:var(--text-muted);font-weight:400">(${esc(t.turno)})</span></span>
        <span style="font-weight:700;color:${cor};font-size:.85rem">${emRisco}/${alunosTurma.length} alunos · ${pct}%</span>
      </div>
      <div class="evasao-gauge-track"><div class="evasao-gauge-fill" style="width:${Math.min(pct, 100)}%;background:${cor}"></div></div>
    </div>`;
  });

  body.innerHTML = html || buildEmptyState('Nenhuma turma cadastrada.');
  const badge = document.getElementById('sec-evasao-total');
  if (badge) badge.textContent = totalRisco + ' em risco';
}

function renderAlertasAuto() {
  const body = document.getElementById('sec-alertas-body');
  if (!body) return;
  const estoque = dbGetAll('estoque_merenda').filter(e => e.quantidade < e.minimo);
  const circs = dbGetAll('circulares').filter(c => c.status === 'pendente');
  const turmas = dbGetAll('turmas').filter(t => t.ativo && !t.professorId);
  let alertas = [];
  estoque.forEach(e => alertas.push({ tipo: 'danger', icon: 'fa-utensils', msg: `Estoque crítico: <strong>${esc(e.item)}</strong> (${esc(e.quantidade)}/${esc(e.minimo)} ${esc(e.unidade)}s)` }));
  circs.forEach(c => alertas.push({ tipo: 'warning', icon: 'fa-scroll', msg: `Circular pendente: <strong>${esc(c.numero)}</strong> — ${esc(c.titulo)}` }));
  turmas.forEach(t => alertas.push({ tipo: 'warning', icon: 'fa-user-slash', msg: `Turma sem professor: <strong>${esc(t.nome)}</strong> (${esc(t.turno)})` }));
  if (!alertas.length) { body.innerHTML = '<div style="text-align:center;padding:20px;color:var(--success)"><i class="fa-solid fa-circle-check fa-2x" style="margin-bottom:8px"></i><div style="font-weight:700">Nenhum alerta no momento</div></div>'; return; }
  body.innerHTML = alertas.map(a => `<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:var(--r-md);background:var(--${a.tipo}-light);margin-bottom:8px;border-left:3px solid var(--${a.tipo})">
    <i class="fa-solid ${a.icon}" style="color:var(--${a.tipo});font-size:1rem"></i><div style="font-size:.85rem;color:var(--text)">${a.msg}</div></div>`).join('');
}

// =============================================================
// 2. GESTÃO FINANCEIRA + MERENDA
// =============================================================
let chartConsumo = null;
function loadSecFinanceiro() {
  const repasses = dbGetAll('repasses_financeiros').sort((a, b) => b.data.localeCompare(a.data));
  const estoque = dbGetAll('estoque_merenda');
  const consumo = dbGetAll('consumo_merenda').sort((a, b) => a.data.localeCompare(b.data));

  const totalRecebido = repasses.filter(r => r.status === 'recebido').reduce((s, r) => s + r.valor, 0);
  const totalPendente = repasses.filter(r => r.status === 'pendente').reduce((s, r) => s + r.valor, 0);
  const criticos = estoque.filter(e => e.quantidade < e.minimo);
  const mediaRefeicoes = consumo.length > 0 ? (consumo.reduce((s, c) => s + c.refeicoes, 0) / consumo.length).toFixed(0) : '—';

  document.getElementById('sec-financeiro-stats').innerHTML = `
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Total Recebido</span><div class="stat-icon green"><i class="fa-solid fa-circle-check"></i></div></div>
      <div class="stat-num" style="color:var(--success);font-size:1.1rem">${formatCurrency(totalRecebido)}</div><div class="stat-desc">repasses confirmados</div></div>
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Pendente</span><div class="stat-icon yellow"><i class="fa-solid fa-clock"></i></div></div>
      <div class="stat-num" style="color:var(--warning);font-size:1.1rem">${formatCurrency(totalPendente)}</div><div class="stat-desc">aguardando repasse</div></div>
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Itens Críticos</span><div class="stat-icon ${criticos.length > 0 ? 'red' : 'green'}"><i class="fa-solid fa-triangle-exclamation"></i></div></div>
      <div class="stat-num" style="color:${criticos.length > 0 ? 'var(--danger)' : 'var(--success)'}">${criticos.length}</div><div class="stat-desc">abaixo do estoque mínimo</div></div>
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Média Refeições</span><div class="stat-icon blue"><i class="fa-solid fa-utensils"></i></div></div>
      <div class="stat-num">${mediaRefeicoes}</div><div class="stat-desc">refeições/dia</div></div>`;

  // Repasses table
  document.getElementById('sec-repasses-tbody').innerHTML = repasses.length ? repasses.map(r => `<tr>
    <td><span class="badge badge-outline">${esc(r.tipo)}</span></td><td style="max-width:250px">${esc(r.descricao)}</td><td>${formatDate(r.data)}</td>
    <td class="text-right" style="font-weight:700">${formatCurrency(r.valor)}</td>
    <td class="text-center"><span class="badge ${r.status === 'recebido' ? 'badge-green' : 'badge-yellow'}">${r.status === 'recebido' ? '✅ Recebido' : '⏳ Pendente'}</span></td>
    <td class="text-right"><button class="btn btn-sm btn-ghost" onclick="editRepasse('${r.id}')"><i class="fa-solid fa-pen"></i></button>
      <button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="showConfirm('Excluir repasse?', () => { dbDelete('repasses_financeiros','${r.id}'); loadSecFinanceiro(); })"><i class="fa-solid fa-trash"></i></button></td>
  </tr>`).join('') : '<tr><td colspan="6" class="text-center" style="padding:30px;color:var(--text-muted)">Nenhum repasse</td></tr>';

  // Merenda table
  const alertBadge = document.getElementById('sec-estoque-alerta');
  if (alertBadge) alertBadge.style.display = criticos.length > 0 ? '' : 'none';
  document.getElementById('sec-merenda-tbody').innerHTML = estoque.map(e => {
    const isCrit = e.quantidade < e.minimo;
    return `<tr class="${isCrit ? 'estoque-critico-row' : ''}">
      <td style="font-weight:600">${esc(e.item)}</td><td class="text-center" style="font-weight:700;color:${isCrit ? 'var(--danger)' : 'var(--text)'}">${esc(e.quantidade)}</td>
      <td>${esc(e.unidade)}</td><td class="text-center">${esc(e.minimo)}</td><td>${formatDate(e.ultimaEntrada)}</td><td>${esc(e.fornecedor || '—')}</td>
      <td class="text-center"><span class="badge ${isCrit ? 'badge-red' : 'badge-green'}">${isCrit ? '⚠️ Crítico' : '✅ OK'}</span></td>
      <td class="text-right"><button class="btn btn-sm btn-ghost" onclick="editMerenda('${e.id}')"><i class="fa-solid fa-pen"></i></button></td>
    </tr>`;
  }).join('');

  // Consumo chart
  const canvas = document.getElementById('chart-consumo');
  if (!canvas) return;
  if (chartConsumo) chartConsumo.destroy();
  const last14 = consumo.slice(-14);
  chartConsumo = new Chart(canvas, {
    type: 'bar',
    data: { labels: last14.map(c => { const d = new Date(c.data + 'T12:00'); return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); }),
      datasets: [{ label: 'Refeições', data: last14.map(c => c.refeicoes), backgroundColor: 'rgba(37,99,235,0.7)', borderRadius: 6, borderSkipped: false }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });
}

// CRUD Repasse
function openModalRepasse() { document.getElementById('repasse-id').value = ''; document.getElementById('repasse-tipo').value = 'PDDE'; document.getElementById('repasse-valor').value = '';
  document.getElementById('repasse-data').value = todayISO(); document.getElementById('repasse-status').value = 'pendente'; document.getElementById('repasse-descricao').value = '';
  document.getElementById('repasse-modal-title').textContent = 'Novo Repasse'; openModal('modal-repasse'); }
function editRepasse(id) { const r = dbFind('repasses_financeiros', id); if (!r) return;
  document.getElementById('repasse-id').value = r.id; document.getElementById('repasse-tipo').value = r.tipo; document.getElementById('repasse-valor').value = r.valor;
  document.getElementById('repasse-data').value = r.data; document.getElementById('repasse-status').value = r.status; document.getElementById('repasse-descricao').value = r.descricao || '';
  document.getElementById('repasse-modal-title').textContent = 'Editar Repasse'; openModal('modal-repasse'); }
function saveRepasse() { const id = document.getElementById('repasse-id').value; const data = { tipo: document.getElementById('repasse-tipo').value,
  valor: parseFloat(document.getElementById('repasse-valor').value) || 0, data: document.getElementById('repasse-data').value,
  status: document.getElementById('repasse-status').value, descricao: document.getElementById('repasse-descricao').value.trim() };
  if (!data.valor || !data.data) { toast('Preencha valor e data.', 'error'); return; }
  if (id) { dbUpdate('repasses_financeiros', id, data); toast('Repasse atualizado!', 'success'); }
  else { dbAdd('repasses_financeiros', { id: generateId('rf'), ...data }); toast('Repasse cadastrado!', 'success'); }
  closeModal('modal-repasse'); loadSecFinanceiro(); }

// CRUD Merenda
function openModalMerenda() { document.getElementById('merenda-id').value = ''; document.getElementById('merenda-item').value = '';
  document.getElementById('merenda-quantidade').value = ''; document.getElementById('merenda-unidade').value = 'pacote'; document.getElementById('merenda-minimo').value = '10';
  document.getElementById('merenda-entrada').value = todayISO(); document.getElementById('merenda-fornecedor').value = '';
  document.getElementById('merenda-modal-title').textContent = 'Novo Item de Merenda'; openModal('modal-merenda'); }
function editMerenda(id) { const e = dbFind('estoque_merenda', id); if (!e) return;
  document.getElementById('merenda-id').value = e.id; document.getElementById('merenda-item').value = e.item; document.getElementById('merenda-quantidade').value = e.quantidade;
  document.getElementById('merenda-unidade').value = e.unidade; document.getElementById('merenda-minimo').value = e.minimo;
  document.getElementById('merenda-entrada').value = e.ultimaEntrada || ''; document.getElementById('merenda-fornecedor').value = e.fornecedor || '';
  document.getElementById('merenda-modal-title').textContent = 'Editar Item'; openModal('modal-merenda'); }
function saveMerenda() { const id = document.getElementById('merenda-id').value; const data = { item: document.getElementById('merenda-item').value.trim(),
  quantidade: parseInt(document.getElementById('merenda-quantidade').value) || 0, unidade: document.getElementById('merenda-unidade').value,
  minimo: parseInt(document.getElementById('merenda-minimo').value) || 0, ultimaEntrada: document.getElementById('merenda-entrada').value,
  fornecedor: document.getElementById('merenda-fornecedor').value.trim() };
  if (!data.item) { toast('Preencha o nome do item.', 'error'); return; }
  if (id) { dbUpdate('estoque_merenda', id, data); toast('Item atualizado!', 'success'); }
  else { dbAdd('estoque_merenda', { id: generateId('em'), ...data }); toast('Item cadastrado!', 'success'); }
  closeModal('modal-merenda'); loadSecFinanceiro(); }

// =============================================================
// 3. AUDITORIA E CENSO ESCOLAR
// =============================================================
function loadSecAuditoria() {
  const profs = dbGetAll('professores').filter(p => p.ativo);
  const turmas = dbGetAll('turmas').filter(t => t.ativo);
  const alunos = dbGetAll('alunos').filter(a => a.ativo);
  const discs = dbGetAll('disciplinas').filter(d => d.ativo);
  const horarios = dbGetAll('horarios_aula');

  const turmasSemProf = turmas.filter(t => !t.professorId || !profs.find(p => p.id === t.professorId));
  document.getElementById('sec-auditoria-stats').innerHTML = `
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Professores Ativos</span><div class="stat-icon blue"><i class="fa-solid fa-chalkboard-user"></i></div></div>
      <div class="stat-num">${profs.length}</div><div class="stat-desc">na rede</div></div>
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Turmas</span><div class="stat-icon green"><i class="fa-solid fa-chalkboard"></i></div></div>
      <div class="stat-num">${turmas.length}</div><div class="stat-desc">ativas</div></div>
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Sem Professor</span><div class="stat-icon ${turmasSemProf.length > 0 ? 'red' : 'green'}"><i class="fa-solid fa-user-slash"></i></div></div>
      <div class="stat-num" style="color:${turmasSemProf.length > 0 ? 'var(--danger)' : 'var(--success)'}">${turmasSemProf.length}</div><div class="stat-desc">turmas</div></div>
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Total Alunos</span><div class="stat-icon purple"><i class="fa-solid fa-user-graduate"></i></div></div>
      <div class="stat-num">${alunos.length}</div><div class="stat-desc">matriculados</div></div>`;

  // Quadro de Lotação
  const CARGA_SEMANAL = 4; // aulas esperadas por semana por turma
  document.getElementById('sec-lotacao-tbody').innerHTML = profs.map(p => {
    const pDiscs = (p.disciplinas || []).map(did => dbFind('disciplinas', did)?.nome || did).join(', ');
    const pTurmas = (p.turmaIds || []).length;
    const aulasReg = horarios.filter(h => h.professorId === p.id).reduce((s, h) => s + (h.quantidadeAulas || 1), 0);
    const cargaPrev = pTurmas * CARGA_SEMANAL;
    const pct = cargaPrev > 0 ? ((aulasReg / cargaPrev) * 100).toFixed(0) : 0;
    const status = pct >= 80 ? '<span class="badge badge-green">✅ Regular</span>' : pct >= 40 ? '<span class="badge badge-yellow">⏳ Parcial</span>' : '<span class="badge badge-red">⚠️ Déficit</span>';
    return `<tr><td style="font-weight:600">${esc(p.nome)}</td><td>${esc(pDiscs) || '—'}</td><td class="text-center">${pTurmas}</td>
      <td class="text-center">${aulasReg}</td><td class="text-center">${cargaPrev}</td><td class="text-center">${status}</td></tr>`;
  }).join('');

  // Turmas sem professor
  const tspBody = document.getElementById('sec-turmas-sem-prof');
  tspBody.innerHTML = turmasSemProf.length ? turmasSemProf.map(t => `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:var(--r-sm);background:var(--danger-light);margin-bottom:6px">
    <i class="fa-solid fa-exclamation-triangle" style="color:var(--danger)"></i><span style="font-weight:600">${esc(t.nome)}</span><span style="color:var(--text-muted)">(${esc(t.turno)})</span></div>`).join('')
    : '<div style="text-align:center;padding:20px;color:var(--success)"><i class="fa-solid fa-circle-check"></i> Todas as turmas têm professor</div>';

  // Disciplinas com déficit
  const defBody = document.getElementById('sec-deficit-body');
  const discsSemProf = discs.filter(d => !profs.some(p => (p.disciplinas || []).includes(d.id)));
  defBody.innerHTML = discsSemProf.length ? discsSemProf.map(d => `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:var(--r-sm);background:var(--warning-light);margin-bottom:6px">
    <i class="fa-solid fa-book" style="color:var(--warning)"></i><span style="font-weight:600">${esc(d.nome)}</span><span style="color:var(--text-muted)">sem professor atribuído</span></div>`).join('')
    : '<div style="text-align:center;padding:20px;color:var(--success)"><i class="fa-solid fa-circle-check"></i> Todas as disciplinas cobertas</div>';
}

function gerarRelatorioCenso(formato) {
  const escola = dbGet('escola');
  const turmas = dbGetAll('turmas').filter(t => t.ativo);
  const alunos = dbGetAll('alunos').filter(a => a.ativo);
  const profs = dbGetAll('professores').filter(p => p.ativo);
  const discs = dbGetAll('disciplinas').filter(d => d.ativo);
  if (formato === 'csv') {
    let csv = 'Turma,Turno,Professor,Alunos\n';
    turmas.forEach(t => { const prof = dbFind('professores', t.professorId); const qtd = alunos.filter(a => a.turmaId === t.id).length;
      csv += `"${t.nome}","${t.turno}","${prof?.nome || 'Sem professor'}",${qtd}\n`; });
    csv += '\n\nAluno,Matrícula,CPF,Turma\n';
    alunos.forEach(a => { const t = dbFind('turmas', a.turmaId); csv += `"${a.nome}","${a.matricula}","${a.cpf || ''}","${t?.nome || ''}"\n`; });
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `censo_escolar_${todayISO()}.csv`; a.click(); URL.revokeObjectURL(url);
    toast('CSV exportado!', 'success'); return;
  }
  // PDF
  const w = window.open('', '_blank');
  w.document.write(`<html><head><title>Relatório Censo</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{color:#0f2347;border-bottom:2px solid #0f2347;padding-bottom:8px}
    h2{color:#1d3d7a;margin-top:24px}table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
    th{background:#f0f4f8;font-weight:700}.header{display:flex;justify-content:space-between;align-items:center}.selo{text-align:center;margin-top:30px;padding:15px;border:2px solid #0f2347;border-radius:8px}
    @media print{body{padding:15px}}</style></head><body>`);
  w.document.write(`<div class="header"><div><h1>${escola.nome}</h1><p>${escola.cidade} · Ano Letivo ${escola.anoLetivo || 2026}</p></div></div>`);
  w.document.write(`<div class="selo"><strong>RELATÓRIO CENSO ESCOLAR</strong><br>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>`);
  w.document.write(`<h2>Resumo</h2><table><tr><th>Turmas</th><th>Alunos</th><th>Professores</th><th>Disciplinas</th></tr><tr><td>${turmas.length}</td><td>${alunos.length}</td><td>${profs.length}</td><td>${discs.length}</td></tr></table>`);
  w.document.write(`<h2>Turmas</h2><table><tr><th>Turma</th><th>Turno</th><th>Professor</th><th>Alunos</th></tr>`);
  turmas.forEach(t => { const prof = dbFind('professores', t.professorId); const qtd = alunos.filter(a => a.turmaId === t.id).length;
    w.document.write(`<tr><td>${t.nome}</td><td>${t.turno}</td><td>${prof?.nome || '—'}</td><td>${qtd}</td></tr>`); });
  w.document.write(`</table><h2>Professores</h2><table><tr><th>Nome</th><th>Disciplinas</th><th>Turmas</th></tr>`);
  profs.forEach(p => { const ds = (p.disciplinas||[]).map(d => dbFind('disciplinas',d)?.nome||d).join(', ');
    w.document.write(`<tr><td>${p.nome}</td><td>${ds}</td><td>${(p.turmaIds||[]).length}</td></tr>`); });
  w.document.write(`</table><div style="margin-top:40px;display:flex;justify-content:space-around"><div style="text-align:center;width:200px"><hr><small>Diretor(a)</small></div><div style="text-align:center;width:200px"><hr><small>Secretário(a) de Educação</small></div></div>`);
  w.document.write(`<div style="text-align:center;margin-top:20px;font-size:11px;color:#999">SEMED · Secretaria Municipal de Educação · Viana — MA</div></body></html>`);
  w.document.close(); setTimeout(() => w.print(), 600); toast('Relatório gerado!', 'success');
}

// =============================================================
// 4. CIRCULARES E OFÍCIOS (SEMED)
// =============================================================
function loadSecCirculares() {
  const circs = dbGetAll('circulares').sort((a, b) => (b.dataPublicacao || '').localeCompare(a.dataPublicacao || ''));
  const pendentes = circs.filter(c => c.status === 'pendente');
  const confirmados = circs.filter(c => c.status === 'confirmado');

  document.getElementById('sec-circulares-stats').innerHTML = `
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Total</span><div class="stat-icon blue"><i class="fa-solid fa-scroll"></i></div></div>
      <div class="stat-num">${circs.length}</div><div class="stat-desc">circulares</div></div>
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Pendentes</span><div class="stat-icon red"><i class="fa-solid fa-clock"></i></div></div>
      <div class="stat-num" style="color:var(--danger)">${pendentes.length}</div><div class="stat-desc">sem confirmação</div></div>
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Confirmados</span><div class="stat-icon green"><i class="fa-solid fa-circle-check"></i></div></div>
      <div class="stat-num" style="color:var(--success)">${confirmados.length}</div><div class="stat-desc">com ciência</div></div>`;

  const pBadge = document.getElementById('sec-circ-pendentes');
  if (pBadge) pBadge.textContent = pendentes.length + ' pendente' + (pendentes.length !== 1 ? 's' : '');

  // Pendentes cards
  const pBody = document.getElementById('sec-circ-pendentes-body');
  pBody.innerHTML = pendentes.length ? pendentes.map(c => `<div class="circular-card pendente" style="margin-bottom:12px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
      <div><span class="badge badge-outline">${esc(c.numero)}</span> <span class="badge badge-yellow">${esc(TIPO_CIRCULAR[c.tipo] || c.tipo)}</span>
        <div style="font-weight:700;margin-top:6px">${esc(c.titulo)}</div>
        <div style="font-size:.82rem;color:var(--text-muted);margin-top:4px">Publicado: ${formatDate(c.dataPublicacao)} · Prazo: ${formatDate(c.prazoConfirmacao)}</div></div>
      <span class="badge badge-red">⏳ Pendente</span></div>
    <div style="font-size:.85rem;margin-top:8px;padding:10px;background:var(--surface-2);border-radius:var(--r-sm);max-height:80px;overflow:auto">${esc(c.corpo)}</div>
  </div>`).join('') : '<div style="text-align:center;padding:20px;color:var(--success)"><i class="fa-solid fa-circle-check"></i> Nenhuma pendente</div>';

  // Table
  document.getElementById('sec-circulares-tbody').innerHTML = circs.map(c => {
    const statusBadge = c.status === 'confirmado' ? `<span class="badge badge-green">✅ Ciente</span>` : `<span class="badge badge-red">⏳ Pendente</span>`;
    return `<tr><td style="font-weight:600">${esc(c.numero)}</td><td>${esc(c.titulo)}</td><td><span class="badge badge-outline">${esc(TIPO_CIRCULAR[c.tipo] || c.tipo)}</span></td>
      <td>${formatDate(c.dataPublicacao)}</td><td>${formatDate(c.prazoConfirmacao)}</td><td class="text-center">${statusBadge}</td>
      <td class="text-right"><button class="btn btn-sm btn-ghost" onclick="editCircular('${c.id}')"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="showConfirm('Excluir circular?', () => { dbDelete('circulares','${c.id}'); loadSecCirculares(); })"><i class="fa-solid fa-trash"></i></button></td></tr>`;
  }).join('');
}

function openModalCircular() { ['circular-id','circular-numero','circular-titulo','circular-corpo'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('circular-tipo').value = 'circular'; document.getElementById('circular-data').value = todayISO(); document.getElementById('circular-prazo').value = '';
  document.getElementById('circular-modal-title').textContent = 'Nova Circular'; openModal('modal-circular'); }
function editCircular(id) { const c = dbFind('circulares', id); if (!c) return;
  document.getElementById('circular-id').value = c.id; document.getElementById('circular-numero').value = c.numero; document.getElementById('circular-titulo').value = c.titulo;
  document.getElementById('circular-corpo').value = c.corpo; document.getElementById('circular-tipo').value = c.tipo;
  document.getElementById('circular-data').value = c.dataPublicacao || ''; document.getElementById('circular-prazo').value = c.prazoConfirmacao || '';
  document.getElementById('circular-modal-title').textContent = 'Editar Circular'; openModal('modal-circular'); }
function saveCircular() { const id = document.getElementById('circular-id').value;
  const data = { numero: document.getElementById('circular-numero').value.trim(), titulo: document.getElementById('circular-titulo').value.trim(),
    corpo: document.getElementById('circular-corpo').value.trim(), tipo: document.getElementById('circular-tipo').value,
    dataPublicacao: document.getElementById('circular-data').value, prazoConfirmacao: document.getElementById('circular-prazo').value, status: 'pendente', confirmadoPor: null, dataConfirmacao: null };
  if (!data.numero || !data.titulo || !data.corpo) { toast('Preencha número, título e conteúdo.', 'error'); return; }
  if (id) { const old = dbFind('circulares', id); if (old && old.status === 'confirmado') { data.status = old.status; data.confirmadoPor = old.confirmadoPor; data.dataConfirmacao = old.dataConfirmacao; }
    dbUpdate('circulares', id, data); toast('Circular atualizada!', 'success'); }
  else { dbAdd('circulares', { id: generateId('circ'), ...data }); toast('Circular publicada!', 'success'); }
  closeModal('modal-circular'); loadSecCirculares(); }

// =============================================================
// 5. DIRETOR: VER CIRCULARES + CONFIRMAR CIÊNCIA
// =============================================================
function loadDirCirculares() {
  const circs = dbGetAll('circulares').sort((a, b) => (b.dataPublicacao || '').localeCompare(a.dataPublicacao || ''));
  const pendentes = circs.filter(c => c.status === 'pendente');
  const badge = document.getElementById('dir-circ-pendentes-badge');
  if (badge) { badge.textContent = pendentes.length + ' pendentes'; badge.style.display = pendentes.length > 0 ? '' : 'none'; }

  const body = document.getElementById('dir-circulares-body');
  if (!circs.length) { body.innerHTML = buildEmptyState('Nenhuma circular recebida.'); return; }
  body.innerHTML = circs.map(c => {
    const isPend = c.status === 'pendente';
    return `<div class="circular-card ${isPend ? 'pendente' : 'confirmada'}" style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">
        <div><span class="badge badge-outline">${esc(c.numero)}</span> <span class="badge badge-outline">${esc(TIPO_CIRCULAR[c.tipo] || c.tipo)}</span>
          <div style="font-weight:700;margin-top:6px;font-size:.95rem">${esc(c.titulo)}</div>
          <div style="font-size:.8rem;color:var(--text-muted);margin-top:3px">Publicado: ${formatDate(c.dataPublicacao)} · Prazo: ${formatDate(c.prazoConfirmacao)}</div></div>
        ${isPend ? `<button class="btn btn-sm btn-success" onclick="confirmarCircular('${c.id}')"><i class="fa-solid fa-signature"></i> Confirmar Ciência</button>`
          : `<div style="text-align:right"><span class="badge badge-green">✅ Ciente</span><div style="font-size:.75rem;color:var(--text-muted);margin-top:3px">${c.confirmadoPor || ''}<br>${c.dataConfirmacao ? formatDateTime(c.dataConfirmacao) : ''}</div></div>`}
      </div>
      <div style="font-size:.85rem;margin-top:10px;padding:12px;background:var(--surface-2);border-radius:var(--r-sm);line-height:1.5">${esc(c.corpo)}</div>
    </div>`;
  }).join('');
}

function confirmarCircular(id) {
  const nome = SESSION?.name || 'Diretor(a)';
  showConfirm(`Confirmar ciência da circular como <strong>${nome}</strong>? Esta ação funciona como assinatura digital.`, () => {
    dbUpdate('circulares', id, { status: 'confirmado', confirmadoPor: nome, dataConfirmacao: new Date().toISOString() });
    toast('Ciência confirmada com sucesso!', 'success');
    loadDirCirculares();
    closeModal('modal-confirm');
  });
}

// ── Helper: showConfirm (reutiliza modal-confirm existente) ──
function showConfirm(msg, cb) {
  CONFIRM_CB = cb;
  document.getElementById('confirm-msg').innerHTML = msg;
  openModal('modal-confirm');
}

// =============================================================
// 6. GESTÃO DE ESCOLAS DA REDE
// =============================================================
const MODALIDADES_LABEL = { fundamental_i: 'Fund. I', fundamental_ii: 'Fund. II', eja: 'EJA', educacao_infantil: 'Ed. Infantil' };

function loadSecEscolas() {
  const escolas = dbGetAll('escolas_rede');
  const ativas = escolas.filter(e => e.ativa);
  const urbanas = ativas.filter(e => e.tipo === 'urbana');
  const rurais = ativas.filter(e => e.tipo === 'rural');
  const capTotal = ativas.reduce((s, e) => s + (e.capacidade || 0), 0);

  document.getElementById('sec-escolas-stats').innerHTML = `
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Total de Escolas</span><div class="stat-icon blue"><i class="fa-solid fa-school"></i></div></div>
      <div class="stat-num">${ativas.length}</div><div class="stat-desc">ativas na rede</div></div>
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Urbanas</span><div class="stat-icon green"><i class="fa-solid fa-city"></i></div></div>
      <div class="stat-num">${urbanas.length}</div><div class="stat-desc">zona urbana</div></div>
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Rurais</span><div class="stat-icon yellow"><i class="fa-solid fa-tree"></i></div></div>
      <div class="stat-num">${rurais.length}</div><div class="stat-desc">zona rural</div></div>
    <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Capacidade Total</span><div class="stat-icon purple"><i class="fa-solid fa-users"></i></div></div>
      <div class="stat-num">${capTotal.toLocaleString('pt-BR')}</div><div class="stat-desc">vagas na rede</div></div>`;

  renderEscolasGrid(escolas);
}

function renderEscolasGrid(escolas) {
  const grid = document.getElementById('sec-escolas-grid');
  if (!escolas.length) { grid.innerHTML = buildEmptyState('Nenhuma escola cadastrada.'); return; }

  grid.innerHTML = escolas.map(e => {
    const mods = (e.modalidades || []).map(m => MODALIDADES_LABEL[m] || m).join(' · ');
    const turnos = (e.turnosFuncionamento || []).join(', ');
    const tipoBadge = e.tipo === 'urbana'
      ? '<span class="badge badge-blue">🏙️ Urbana</span>'
      : '<span class="badge badge-green">🌾 Rural</span>';
    const statusBadge = e.ativa
      ? '<span class="badge badge-green">✅ Ativa</span>'
      : '<span class="badge badge-red">❌ Inativa</span>';

    return `<div class="escola-card ${e.ativa ? '' : 'inativa'}">
      <div class="escola-card-header">
        <div class="escola-card-icon"><i class="fa-solid fa-school"></i></div>
        <div style="flex:1;min-width:0">
          <div class="escola-card-nome">${esc(e.nome)}</div>
          <div class="escola-card-slug"><i class="fa-solid fa-link" style="font-size:.65rem"></i> ${esc(e.slug)}</div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0">${tipoBadge} ${statusBadge}</div>
      </div>
      <div class="escola-card-body">
        <div class="escola-card-info">
          <div><i class="fa-solid fa-map-marker-alt"></i> ${esc(e.endereco || '—')}, ${esc(e.cidade)}/${esc(e.estado)}</div>
          <div><i class="fa-solid fa-user-tie"></i> Dir.: ${esc(e.diretorNome || '—')}</div>
          <div><i class="fa-solid fa-phone"></i> ${esc(e.telefone || '—')}</div>
          <div><i class="fa-solid fa-graduation-cap"></i> ${mods || '—'}</div>
          <div><i class="fa-solid fa-clock"></i> Turnos: ${turnos || '—'}</div>
          <div><i class="fa-solid fa-users"></i> Capacidade: ${e.capacidade || '—'} alunos</div>
        </div>
        ${e.codigoINEP ? `<div style="margin-top:8px"><span class="badge badge-outline">INEP: ${e.codigoINEP}</span></div>` : ''}
      </div>
      <div class="escola-card-footer">
        <button class="btn btn-sm btn-ghost" onclick="editEscola('${e.id}')"><i class="fa-solid fa-pen"></i> Editar</button>
        <button class="btn btn-sm btn-ghost" style="color:${e.ativa ? 'var(--danger)' : 'var(--success)'}" onclick="toggleEscolaStatus('${e.id}', ${!e.ativa})">
          <i class="fa-solid fa-${e.ativa ? 'ban' : 'check-circle'}"></i> ${e.ativa ? 'Desativar' : 'Reativar'}
        </button>
      </div>
    </div>`;
  }).join('');
}

function filterEscolas() {
  const busca = (document.getElementById('sec-escolas-busca').value || '').toLowerCase();
  const tipo = document.getElementById('sec-escolas-filtro-tipo').value;
  const status = document.getElementById('sec-escolas-filtro-status').value;
  let escolas = dbGetAll('escolas_rede');
  if (busca) escolas = escolas.filter(e => e.nome.toLowerCase().includes(busca) || e.slug.toLowerCase().includes(busca));
  if (tipo) escolas = escolas.filter(e => e.tipo === tipo);
  if (status === 'ativa') escolas = escolas.filter(e => e.ativa);
  else if (status === 'inativa') escolas = escolas.filter(e => !e.ativa);
  renderEscolasGrid(escolas);
}

function gerarSlug(nome) {
  return nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '').replace(/(^-|-$)/g, '');
}

// Auto-gerar slug ao digitar nome
document.addEventListener('DOMContentLoaded', () => {
  const nomeInput = document.getElementById('escola-nome');
  const slugInput = document.getElementById('escola-slug');
  if (nomeInput && slugInput) {
    nomeInput.addEventListener('input', () => {
      if (!slugInput.dataset.manual) slugInput.value = gerarSlug(nomeInput.value);
    });
    slugInput.addEventListener('input', () => { slugInput.dataset.manual = '1'; });
  }
});

function openModalEscola() {
  document.getElementById('escola-id').value = '';
  ['escola-nome','escola-slug','escola-abreviado','escola-inep','escola-endereco','escola-telefone','escola-email','escola-diretor'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('escola-cidade').value = 'Viana';
  document.getElementById('escola-estado').value = 'MA';
  document.getElementById('escola-tipo').value = 'urbana';
  document.getElementById('escola-capacidade').value = '';
  ['escola-mod-fi','escola-mod-fii','escola-mod-eja','escola-mod-ei'].forEach(id => document.getElementById(id).checked = id === 'escola-mod-fi');
  ['escola-turno-m','escola-turno-t','escola-turno-n'].forEach(id => document.getElementById(id).checked = id !== 'escola-turno-n');
  document.getElementById('escola-modal-title').textContent = 'Nova Escola';
  const slugInput = document.getElementById('escola-slug'); if (slugInput) delete slugInput.dataset.manual;
  openModal('modal-escola');
}

function editEscola(id) {
  const e = dbFind('escolas_rede', id); if (!e) return;
  document.getElementById('escola-id').value = e.id;
  document.getElementById('escola-nome').value = e.nome;
  document.getElementById('escola-slug').value = e.slug;
  document.getElementById('escola-slug').dataset.manual = '1';
  document.getElementById('escola-abreviado').value = e.nomeAbreviado || '';
  document.getElementById('escola-inep').value = e.codigoINEP || '';
  document.getElementById('escola-endereco').value = e.endereco || '';
  document.getElementById('escola-cidade').value = e.cidade || 'Viana';
  document.getElementById('escola-estado').value = e.estado || 'MA';
  document.getElementById('escola-telefone').value = e.telefone || '';
  document.getElementById('escola-email').value = e.email || '';
  document.getElementById('escola-diretor').value = e.diretorNome || '';
  document.getElementById('escola-tipo').value = e.tipo || 'urbana';
  document.getElementById('escola-capacidade').value = e.capacidade || '';
  // Modalidades
  ['escola-mod-fi','escola-mod-fii','escola-mod-eja','escola-mod-ei'].forEach(cbId => {
    const cb = document.getElementById(cbId);
    cb.checked = (e.modalidades || []).includes(cb.value);
  });
  // Turnos
  ['escola-turno-m','escola-turno-t','escola-turno-n'].forEach(cbId => {
    const cb = document.getElementById(cbId);
    cb.checked = (e.turnosFuncionamento || []).includes(cb.value);
  });
  document.getElementById('escola-modal-title').textContent = 'Editar Escola';
  openModal('modal-escola');
}

function saveEscola() {
  const id = document.getElementById('escola-id').value;
  const nome = document.getElementById('escola-nome').value.trim();
  const slug = document.getElementById('escola-slug').value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!nome || !slug) { toast('Preencha nome e slug.', 'error'); return; }

  // Slug único
  const existing = dbGetAll('escolas_rede').find(e => e.slug === slug && e.id !== id);
  if (existing) { toast('Slug já em uso por outra escola!', 'error'); return; }

  const modalidades = [];
  ['escola-mod-fi','escola-mod-fii','escola-mod-eja','escola-mod-ei'].forEach(cbId => {
    const cb = document.getElementById(cbId); if (cb.checked) modalidades.push(cb.value);
  });
  const turnosFuncionamento = [];
  ['escola-turno-m','escola-turno-t','escola-turno-n'].forEach(cbId => {
    const cb = document.getElementById(cbId); if (cb.checked) turnosFuncionamento.push(cb.value);
  });

  const data = {
    nome, slug,
    nomeAbreviado: document.getElementById('escola-abreviado').value.trim() || nome,
    codigoINEP: document.getElementById('escola-inep').value.trim(),
    endereco: document.getElementById('escola-endereco').value.trim(),
    cidade: document.getElementById('escola-cidade').value.trim(),
    estado: document.getElementById('escola-estado').value.trim().toUpperCase(),
    telefone: document.getElementById('escola-telefone').value.trim(),
    email: document.getElementById('escola-email').value.trim(),
    diretorNome: document.getElementById('escola-diretor').value.trim(),
    tipo: document.getElementById('escola-tipo').value,
    modalidades, turnosFuncionamento,
    capacidade: parseInt(document.getElementById('escola-capacidade').value) || 0,
    ativa: true,
  };

  if (id) { dbUpdate('escolas_rede', id, data); toast('Escola atualizada!', 'success'); }
  else { data.criadoEm = todayISO(); dbAdd('escolas_rede', { id: generateId('esc'), ...data }); toast('Escola cadastrada!', 'success'); }
  closeModal('modal-escola'); loadSecEscolas();
}

function toggleEscolaStatus(id, novoStatus) {
  const acao = novoStatus ? 'reativar' : 'desativar';
  showConfirm(`Deseja ${acao} esta escola?`, () => {
    dbUpdate('escolas_rede', id, { ativa: novoStatus });
    toast(`Escola ${novoStatus ? 'reativada' : 'desativada'}!`, 'success');
    loadSecEscolas();
    closeModal('modal-confirm');
  });
}

function loadSecAlunos() {
  const search = (document.getElementById('sec-alunos-busca')?.value || '').toLowerCase();
  const filtroTurma = document.getElementById('sec-alunos-filtro-turma')?.value || '';
  const filtroEscola = document.getElementById('sec-alunos-filtro-escola')?.value || '';
  const filtroSerie = document.getElementById('sec-alunos-filtro-serie')?.value || '';
  const turmas = dbGetAll('turmas');
  const escolas = dbGetAll('escolas_rede');
  const tbody = document.getElementById('sec-alunos-tbody');
  const countEl = document.getElementById('sec-alunos-count');
  const statsEl = document.getElementById('sec-alunos-stats');

  const getSerie = (tNome) => {
    const parts = tNome.split(' ');
    return parts.length >= 2 ? parts[0] + ' ' + parts[1] : tNome;
  };

  // Fill filters (once)
  const escolaSel = document.getElementById('sec-alunos-filtro-escola');
  if (escolaSel && escolaSel.options.length <= 1) {
    escolas.filter(e => e.ativa).forEach(e => {
      escolaSel.innerHTML += `<option value="${esc(e.id)}">${esc(e.nomeAbreviado || e.nome)}</option>`;
    });
  }

  const serieSel = document.getElementById('sec-alunos-filtro-serie');
  if (serieSel && serieSel.options.length <= 1) {
    const series = [...new Set(turmas.map(t => getSerie(t.nome)))].sort();
    series.forEach(s => {
      serieSel.innerHTML += `<option value="${esc(s)}">${esc(s)}</option>`;
    });
  }

  const filtroSel = document.getElementById('sec-alunos-filtro-turma');
  if (filtroSel && filtroSel.options.length <= 1) {
    turmas.filter(t => t.ativo).forEach(t => {
      filtroSel.innerHTML += `<option value="${esc(t.id)}">${esc(t.nome)} (${turnoIcon(t.turno)} ${esc(t.turno)})</option>`;
    });
  }

  let alunos = dbGetAll('alunos').filter(a => a.ativo);
  
  if (filtroEscola) {
    const turmasEscolaIds = turmas.filter(t => t.escolaId === filtroEscola || (!t.escolaId && filtroEscola === 'esc01')).map(t => t.id);
    alunos = alunos.filter(a => turmasEscolaIds.includes(a.turmaId) || (a.escolaId === filtroEscola));
  }

  if (filtroSerie) {
    const turmasSerieIds = turmas.filter(t => getSerie(t.nome) === filtroSerie).map(t => t.id);
    alunos = alunos.filter(a => turmasSerieIds.includes(a.turmaId));
  }

  if (filtroTurma) alunos = alunos.filter(a => a.turmaId === filtroTurma);
  if (search) alunos = alunos.filter(a =>
    a.nome.toLowerCase().includes(search) ||
    a.matricula.includes(search) ||
    (a.cpf && a.cpf.includes(search)) ||
    (a.nomeMae && a.nomeMae.toLowerCase().includes(search)) ||
    (a.nomePai && a.nomePai.toLowerCase().includes(search))
  );

  // Stats
  const allAlunos = dbGetAll('alunos').filter(a => a.ativo);
  const comMae = allAlunos.filter(a => a.nomeMae).length;
  const comPai = allAlunos.filter(a => a.nomePai).length;
  const comTel = allAlunos.filter(a => a.telefone).length;
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Total de Alunos</span><div class="stat-icon blue"><i class="fa-solid fa-user-graduate"></i></div></div>
        <div class="stat-num">${allAlunos.length}</div><div class="stat-desc">matriculados na rede</div></div>
      <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Com Nome da Mãe</span><div class="stat-icon purple"><i class="fa-solid fa-person-dress"></i></div></div>
        <div class="stat-num">${comMae}</div><div class="stat-desc">${allAlunos.length > 0 ? ((comMae/allAlunos.length)*100).toFixed(0) : 0}% preenchido</div></div>
      <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Com Nome do Pai</span><div class="stat-icon green"><i class="fa-solid fa-person"></i></div></div>
        <div class="stat-num">${comPai}</div><div class="stat-desc">${allAlunos.length > 0 ? ((comPai/allAlunos.length)*100).toFixed(0) : 0}% preenchido</div></div>
      <div class="stat-card"><div class="stat-card-header"><span class="stat-card-label">Com Telefone</span><div class="stat-icon yellow"><i class="fa-solid fa-phone"></i></div></div>
        <div class="stat-num">${comTel}</div><div class="stat-desc">${allAlunos.length > 0 ? ((comTel/allAlunos.length)*100).toFixed(0) : 0}% preenchido</div></div>`;
  }

  if (countEl) countEl.textContent = `${alunos.length} aluno${alunos.length !== 1 ? 's' : ''}`;

  if (!alunos.length) {
    tbody.innerHTML = `<tr><td colspan="8">${buildEmptyState('Nenhum aluno encontrado.')}</td></tr>`;
    return;
  }

  tbody.innerHTML = alunos.map(a => {
    const turma = turmas.find(t => t.id === a.turmaId);
    const nasc = a.nascimento ? new Date(a.nascimento + 'T12:00').toLocaleDateString('pt-BR') : '—';
    return `<tr>
      <td style="font-weight:700">${esc(a.nome)}</td>
      <td style="color:var(--text-muted)">${esc(a.matricula)}</td>
      <td>${turma ? `<span class="badge badge-blue">${esc(turma.nome)}</span>` : '—'}</td>
      <td>${turma ? `${turnoIcon(turma.turno)} ${turma.turno}` : '—'}</td>
      <td style="font-size:.82rem">${esc(a.nomePai || '—')}</td>
      <td style="font-size:.82rem">${esc(a.nomeMae || '—')}</td>
      <td style="font-size:.82rem">${nasc}</td>
      <td class="text-right" style="display:flex;gap:6px;justify-content:flex-end">
        <button class="btn btn-sm btn-ghost" data-id="${a.id}" onclick="editAluno(this.dataset.id)"><i class="fa-solid fa-pen"></i></button>
      </td>
    </tr>`;
  }).join('');
}
