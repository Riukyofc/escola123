// =============================================================
// UTILS.TS — Helper functions migradas de data.js
// =============================================================

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length <= 10 ? 'T12:00:00' : ''));
  return d.toLocaleDateString('pt-BR');
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatCurrency(v: number): string {
  return 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getNotaAnual(b1: number | null, b2: number | null, b3: number | null, b4: number | null): number | null {
  if (b4 === null || b4 === undefined) return null;
  const notas = [b1, b2, b3, b4].map(n => parseFloat(String(n)) || 0);
  return +(notas.reduce((a, b) => a + b, 0) / 4).toFixed(1);
}

export function isAprovado(notaAnual: number | null, notaMinima: number = 5.0): boolean | null {
  if (notaAnual === null) return null;
  return notaAnual >= notaMinima;
}

export function getGreeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export function turnoIcon(turno: string): string {
  const map: Record<string, string> = { 'manhã': '🌅', 'tarde': '☀️', 'noite': '🌙' };
  return map[turno] || '📅';
}

export function generateId(prefix: string = 'id'): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
