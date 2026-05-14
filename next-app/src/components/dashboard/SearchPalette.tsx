'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { dbGetAll } from '@/lib/data';

interface NavItem {
  path: string;
  icon: string;
  label: string;
  sub: string;
}

interface SearchResult {
  type: 'nav' | 'aluno' | 'professor' | 'turma';
  icon: string;
  label: string;
  sub: string;
  path: string;
}

interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
  navItems: NavItem[];
}

export default function SearchPalette({ open, onClose, navItems }: SearchPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const results = useMemo((): SearchResult[] => {
    const q = query.toLowerCase().trim();
    if (!q) {
      // Show nav items as default
      return navItems.map(n => ({
        type: 'nav' as const,
        icon: n.icon,
        label: n.label,
        sub: n.sub,
        path: n.path,
      }));
    }

    const items: SearchResult[] = [];

    // Search nav items
    navItems.forEach(n => {
      if (n.label.toLowerCase().includes(q) || n.sub.toLowerCase().includes(q)) {
        items.push({ type: 'nav', icon: n.icon, label: n.label, sub: n.sub, path: n.path });
      }
    });

    // Search alunos
    const alunos = dbGetAll<Record<string, unknown>>('alunos').filter(a => a.ativo);
    alunos.forEach(a => {
      const nome = String(a.nome || '').toLowerCase();
      const mat = String(a.matricula || '').toLowerCase();
      if (nome.includes(q) || mat.includes(q)) {
        items.push({
          type: 'aluno',
          icon: 'fa-user-graduate',
          label: a.nome as string,
          sub: `Matrícula: ${a.matricula}`,
          path: '/dashboard/diretor/alunos',
        });
      }
    });

    // Search professores
    const profs = dbGetAll<Record<string, unknown>>('professores').filter(p => p.ativo);
    profs.forEach(p => {
      const nome = String(p.nome || '').toLowerCase();
      if (nome.includes(q)) {
        items.push({
          type: 'professor',
          icon: 'fa-chalkboard-user',
          label: p.nome as string,
          sub: p.email as string || '',
          path: '/dashboard/diretor/professores',
        });
      }
    });

    // Search turmas
    const turmas = dbGetAll<Record<string, unknown>>('turmas').filter(t => t.ativo);
    turmas.forEach(t => {
      const nome = String(t.nome || '').toLowerCase();
      if (nome.includes(q)) {
        items.push({
          type: 'turma',
          icon: 'fa-chalkboard',
          label: t.nome as string,
          sub: `Turno: ${t.turno}`,
          path: '/dashboard/diretor/turmas',
        });
      }
    });

    return items.slice(0, 12);
  }, [query, navItems]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        router.push(results[selectedIndex].path);
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, selectedIndex, router, onClose]);

  const typeLabels: Record<string, string> = {
    nav: 'Navegação',
    aluno: 'Aluno',
    professor: 'Professor',
    turma: 'Turma',
  };

  const typeColors: Record<string, string> = {
    nav: 'var(--secondary)',
    aluno: 'var(--success)',
    professor: 'var(--info)',
    turma: 'var(--purple)',
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="search-palette-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className="search-palette"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <div className="search-palette-input-wrap">
              <i className="fa-solid fa-magnifying-glass search-palette-icon" />
              <input
                ref={inputRef}
                className="search-palette-input"
                placeholder="Buscar alunos, turmas, professores, páginas..."
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                autoComplete="off"
              />
              <kbd className="search-palette-kbd">ESC</kbd>
            </div>

            <div className="search-palette-results">
              {results.length === 0 ? (
                <div className="search-palette-empty">
                  <i className="fa-solid fa-ghost" />
                  <span>Nenhum resultado encontrado</span>
                </div>
              ) : (
                results.map((r, i) => (
                  <div
                    key={`${r.type}-${r.label}-${i}`}
                    className={`search-palette-item ${i === selectedIndex ? 'selected' : ''}`}
                    onClick={() => { router.push(r.path); onClose(); }}
                    onMouseEnter={() => setSelectedIndex(i)}
                  >
                    <div className="search-palette-item-icon" style={{ background: `${typeColors[r.type]}18`, color: typeColors[r.type] }}>
                      <i className={`fa-solid ${r.icon}`} />
                    </div>
                    <div className="search-palette-item-info">
                      <div className="search-palette-item-label">{r.label}</div>
                      <div className="search-palette-item-sub">{r.sub}</div>
                    </div>
                    <span className="search-palette-item-type" style={{ color: typeColors[r.type] }}>
                      {typeLabels[r.type]}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="search-palette-footer">
              <span><kbd>↑↓</kbd> Navegar</span>
              <span><kbd>↵</kbd> Abrir</span>
              <span><kbd>ESC</kbd> Fechar</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
