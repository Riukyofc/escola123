// =============================================================
// REPORTS.TS — PDF Report Generation via jsPDF
// =============================================================
'use client';

import { dbGetAll, dbFind, dbGet, getConfig } from './data';
import { formatDate, formatCurrency, getNotaAnual } from './utils';

// Dynamic import of jsPDF to avoid SSR issues
async function getJsPDF() {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  return { jsPDF, autoTable };
}

function addHeader(doc: any, title: string) {
  const escola = dbGet<Record<string, unknown>>('escola');
  const nomeEscola = (escola?.nome as string) || 'U.E. Professora Edith Nair Furtado da Silva';
  
  doc.setFillColor(15, 35, 71);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text(nomeEscola, 14, 12);
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text('SEMED · Viana — MA', 14, 18);
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text(title, 14, 24);
  
  // Reset colors
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
}

function addFooter(doc: any) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} — Página ${i}/${pageCount}`, 14, 287);
  }
}

// ─── BOLETIM INDIVIDUAL ───────────────────────────
export async function generateBoletim(alunoId: string) {
  const { jsPDF } = await getJsPDF();
  const doc = new jsPDF();
  const cfg = getConfig();
  
  const aluno = dbFind<Record<string, unknown>>('alunos', alunoId);
  if (!aluno) return;
  const turma = dbFind<Record<string, unknown>>('turmas', aluno.turmaId as string);
  const disciplinas = dbGetAll<Record<string, unknown>>('disciplinas').filter(d => d.ativo);
  const notas = dbGetAll<Record<string, unknown>>('notas').filter(n => n.alunoId === alunoId);
  
  addHeader(doc, 'BOLETIM ESCOLAR');
  
  let y = 36;
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text(`Aluno(a): ${aluno.nome}`, 14, y); y += 6;
  doc.setFont(undefined, 'normal');
  doc.text(`Matrícula: ${aluno.matricula} | Turma: ${turma?.nome || '—'} | Turno: ${turma?.turno || '—'}`, 14, y); y += 10;
  
  const tableData = disciplinas.map(d => {
    const nota = notas.find(n => n.disciplinaId === d.id);
    const b1 = nota?.b1 as number | null ?? null;
    const b2 = nota?.b2 as number | null ?? null;
    const b3 = nota?.b3 as number | null ?? null;
    const b4 = nota?.b4 as number | null ?? null;
    const anual = getNotaAnual(b1, b2, b3, b4);
    const situacao = anual === null ? 'Em andamento' : anual >= cfg.notaMinima ? 'Aprovado' : 'Reprovado';
    return [
      d.nome as string,
      b1 !== null ? String(b1.toFixed(1)) : '—',
      b2 !== null ? String(b2.toFixed(1)) : '—',
      b3 !== null ? String(b3.toFixed(1)) : '—',
      b4 !== null ? String(b4.toFixed(1)) : '—',
      anual !== null ? String(anual.toFixed(1)) : '—',
      situacao,
    ];
  });
  
  (doc as any).autoTable({
    startY: y,
    head: [['Disciplina', '1º Bim', '2º Bim', '3º Bim', '4º Bim', 'Média', 'Situação']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [15, 35, 71], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { fontStyle: 'bold' },
      5: { fontStyle: 'bold' },
    },
  });
  
  addFooter(doc);
  doc.save(`boletim_${(aluno.nome as string).replace(/\s+/g, '_')}.pdf`);
}

// ─── RELATÓRIO DE FREQUÊNCIA ──────────────────────
export async function generateRelatorioFrequencia(turmaId: string) {
  const { jsPDF } = await getJsPDF();
  const doc = new jsPDF();
  
  const turma = dbFind<Record<string, unknown>>('turmas', turmaId);
  const alunos = dbGetAll<Record<string, unknown>>('alunos').filter(a => a.ativo && a.turmaId === turmaId);
  const freq = dbGetAll<Record<string, unknown>>('frequencia').filter(f => f.turmaId === turmaId);
  
  addHeader(doc, `RELATÓRIO DE FREQUÊNCIA — ${turma?.nome || ''}`);
  
  const tableData = alunos.map(a => {
    let total = 0, presencas = 0;
    freq.forEach(f => {
      const aulas = (f.aulas as { alunoId: string; status: string }[]) || [];
      const aula = aulas.find(au => au.alunoId === a.id);
      if (aula) { total++; if (aula.status === 'presente') presencas++; }
    });
    const pct = total > 0 ? ((presencas / total) * 100).toFixed(0) + '%' : '—';
    return [a.nome as string, a.matricula as string, String(total), String(presencas), String(total - presencas), pct];
  });
  
  (doc as any).autoTable({
    startY: 36,
    head: [['Aluno', 'Matrícula', 'Total Aulas', 'Presenças', 'Faltas', 'Freq. %']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [15, 35, 71], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });
  
  addFooter(doc);
  doc.save(`frequencia_${(turma?.nome as string || 'turma').replace(/\s+/g, '_')}.pdf`);
}

// ─── RELATÓRIO FINANCEIRO ─────────────────────────
export async function generateRelatorioFinanceiro() {
  const { jsPDF } = await getJsPDF();
  const doc = new jsPDF();
  
  const repasses = dbGetAll<Record<string, unknown>>('repasses_financeiros');
  const total = repasses.reduce((s, r) => s + (Number(r.valor) || 0), 0);
  
  addHeader(doc, 'RELATÓRIO FINANCEIRO — REPASSES');
  
  let y = 36;
  doc.setFontSize(10);
  doc.text(`Total de repasses: ${repasses.length} | Valor total: ${formatCurrency(total)}`, 14, y);
  
  const tableData = repasses.map(r => [
    r.descricao as string || '—',
    r.fonte as string || '—',
    formatCurrency(Number(r.valor) || 0),
    formatDate(r.data as string),
  ]);
  
  (doc as any).autoTable({
    startY: y + 8,
    head: [['Descrição', 'Fonte', 'Valor', 'Data']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [15, 35, 71], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: { 2: { fontStyle: 'bold' } },
  });
  
  addFooter(doc);
  doc.save('relatorio_financeiro.pdf');
}

// ─── RELATÓRIO DE TURMA ───────────────────────────
export async function generateRelatorioTurma(turmaId: string) {
  const { jsPDF } = await getJsPDF();
  const doc = new jsPDF({ orientation: 'landscape' });
  const cfg = getConfig();
  
  const turma = dbFind<Record<string, unknown>>('turmas', turmaId);
  const alunos = dbGetAll<Record<string, unknown>>('alunos').filter(a => a.ativo && a.turmaId === turmaId);
  const disciplinas = dbGetAll<Record<string, unknown>>('disciplinas').filter(d => d.ativo);
  const notas = dbGetAll<Record<string, unknown>>('notas');
  
  addHeader(doc, `RELATÓRIO CONSOLIDADO — ${turma?.nome || ''}`);
  
  const headers = ['Aluno', ...disciplinas.map(d => d.nome as string), 'Média Geral', 'Situação'];
  const tableData = alunos.map(a => {
    const row: string[] = [a.nome as string];
    let totalMedia = 0, countMedia = 0;
    disciplinas.forEach(d => {
      const nota = notas.find(n => n.alunoId === a.id && n.disciplinaId === d.id);
      const anual = nota ? getNotaAnual(nota.b1 as number | null, nota.b2 as number | null, nota.b3 as number | null, nota.b4 as number | null) : null;
      row.push(anual !== null ? anual.toFixed(1) : '—');
      if (anual !== null) { totalMedia += anual; countMedia++; }
    });
    const mediaGeral = countMedia > 0 ? (totalMedia / countMedia).toFixed(1) : '—';
    const situacao = countMedia === 0 ? 'Pendente' : Number(mediaGeral) >= cfg.notaMinima ? 'Aprovado' : 'Reprovado';
    row.push(mediaGeral, situacao);
    return row;
  });
  
  (doc as any).autoTable({
    startY: 36,
    head: [headers],
    body: tableData,
    styles: { fontSize: 6, cellPadding: 3 },
    headStyles: { fillColor: [15, 35, 71], textColor: 255, fontStyle: 'bold', fontSize: 6 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });
  
  addFooter(doc);
  doc.save(`relatorio_${(turma?.nome as string || 'turma').replace(/\s+/g, '_')}.pdf`);
}
