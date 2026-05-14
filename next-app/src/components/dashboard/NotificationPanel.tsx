'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dbGetAll } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { formatDateTime } from '@/lib/utils';

interface Notification {
  id: string;
  tipo: 'nota' | 'aviso' | 'frequencia' | 'sistema' | 'mensagem';
  titulo: string;
  descricao: string;
  dataCriacao: string;
  lida: boolean;
  link?: string;
}

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

const NOTIF_ICONS: Record<string, string> = {
  nota: 'fa-chart-bar',
  aviso: 'fa-bullhorn',
  frequencia: 'fa-calendar-check',
  sistema: 'fa-gear',
  mensagem: 'fa-comments',
};

const NOTIF_COLORS: Record<string, string> = {
  nota: 'var(--secondary)',
  aviso: 'var(--warning)',
  frequencia: 'var(--success)',
  sistema: 'var(--purple)',
  mensagem: 'var(--info)',
};

export default function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  useDataRefresh();
  const panelRef = useRef<HTMLDivElement>(null);

  // Generate notifications from existing data
  const avisos = dbGetAll<Record<string, unknown>>('avisos').filter(a => a.ativo);

  // Build notification list from avisos
  const notifications: Notification[] = avisos
    .sort((a, b) => String(b.dataCriacao || '').localeCompare(String(a.dataCriacao || '')))
    .slice(0, 10)
    .map(a => ({
      id: a.id as string,
      tipo: a.tipo === 'urgente' ? 'aviso' : 'sistema',
      titulo: a.titulo as string,
      descricao: (a.corpo as string || '').slice(0, 80) + ((a.corpo as string || '').length > 80 ? '...' : ''),
      dataCriacao: a.dataCriacao as string,
      lida: false,
      link: undefined,
    }));

  const unreadCount = notifications.filter(n => !n.lida).length;

  // Update badge count
  useEffect(() => {
    const badge = document.getElementById('notif-badge');
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = String(unreadCount > 9 ? '9+' : unreadCount);
        badge.classList.add('active');
      } else {
        badge.textContent = '';
        badge.classList.remove('active');
      }
    }
  }, [unreadCount]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid immediate close
    const timer = setTimeout(() => document.addEventListener('click', handler), 100);
    return () => { clearTimeout(timer); document.removeEventListener('click', handler); };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          className="notif-panel"
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="notif-panel-header">
            <div className="notif-panel-title">
              <i className="fa-solid fa-bell" />
              Notificações
              {unreadCount > 0 && <span className="notif-count">{unreadCount}</span>}
            </div>
          </div>

          <div className="notif-panel-body">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <i className="fa-solid fa-bell-slash" />
                <span>Nenhuma notificação</span>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`notif-item ${n.lida ? 'read' : ''}`}>
                  <div className="notif-item-icon" style={{ background: `${NOTIF_COLORS[n.tipo]}15`, color: NOTIF_COLORS[n.tipo] }}>
                    <i className={`fa-solid ${NOTIF_ICONS[n.tipo]}`} />
                  </div>
                  <div className="notif-item-content">
                    <div className="notif-item-title">{n.titulo}</div>
                    <div className="notif-item-desc">{n.descricao}</div>
                    <div className="notif-item-time">
                      <i className="fa-solid fa-clock" /> {formatDateTime(n.dataCriacao)}
                    </div>
                  </div>
                  {!n.lida && <div className="notif-item-dot" />}
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
