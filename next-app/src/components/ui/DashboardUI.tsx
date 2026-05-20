'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ═══════ ANIMATION VARIANTS ═══════ */
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

/* ═══════ ANIMATED PAGE WRAPPER ═══════ */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════ MODAL ═══════ */
interface ModalProps {
  id: string;
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  iconColor?: string;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, icon, iconColor, size = 'md', children, footer }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay open"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className={`modal-box ${size}`}
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <div className="modal-header">
              <div className="modal-title">
                {icon && <i className={`fa-solid ${icon}`} style={{ color: iconColor || 'var(--secondary)', marginRight: 8 }} />}
                {title}
              </div>
              <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════ PANEL CARD ═══════ */
interface PanelCardProps {
  title: string;
  icon?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PanelCard({ title, icon, actions, children, className }: PanelCardProps) {
  return (
    <motion.div className={cn('panel-card', className)} {...fadeInUp}>
      <div className="panel-card-header">
        <div className="panel-card-title">
          {icon && <i className={`fa-solid ${icon}`} />} {title}
        </div>
        {actions}
      </div>
      <div className="panel-card-body">{children}</div>
    </motion.div>
  );
}

/* ═══════ STAT CARD ═══════ */
interface StatCardProps {
  label: string;
  value: string | number;
  desc?: string;
  icon: string;
  color: string;
  valueColor?: string;
}

export function StatCard({ label, value, desc, icon, color }: StatCardProps) {
  return (
    <motion.div className="stat-card" {...fadeInUp}>
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className={`stat-icon ${color}`}>
          <i className={`fa-solid ${icon}`} />
        </div>
      </div>
      <div className="stat-num">{value}</div>
      {desc && <div className="stat-desc">{desc}</div>}
    </motion.div>
  );
}

/* ═══════ EMPTY STATE ═══════ */
interface EmptyStateProps {
  icon?: string;
  title: string;
  desc?: string;
}

export function EmptyState({ icon = 'fa-folder-open', title, desc }: EmptyStateProps) {
  return (
    <motion.div className="empty-state" {...fadeInUp}>
      <div className="empty-state-icon"><i className={`fa-solid ${icon}`} /></div>
      <div className="empty-state-title">{title}</div>
      {desc && <div className="empty-state-desc">{desc}</div>}
    </motion.div>
  );
}

/* ═══════ WELCOME BANNER ═══════ */
interface WelcomeBannerProps {
  tag: string;
  tagIcon: string;
  name: string;
  sub: string;
  avatar: string;
  stats?: { label: string; value: string | number }[];
  gradient?: string;
}

export function WelcomeBanner({ tag, tagIcon, name, sub, avatar, stats, gradient }: WelcomeBannerProps) {
  return (
    <motion.div
      className="welcome-banner"
      style={gradient ? { background: gradient } : undefined}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="wb-content">
        <div className="wb-tag"><i className={`fa-solid ${tagIcon}`} /> {tag}</div>
        <div className="wb-title">{name}</div>
        <div className="wb-sub">{sub}</div>
        {stats && (
          <motion.div className="wb-stats" variants={staggerContainer} initial="initial" animate="animate">
            {stats.map(s => (
              <motion.div key={s.label} className="wb-stat" variants={fadeInUp}>
                <span className="wb-stat-num">{s.value}</span>
                <span className="wb-stat-label">{s.label}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      <div className="wb-avatar">{avatar}</div>
    </motion.div>
  );
}

/* ═══════ BADGE ═══════ */
interface BadgeProps {
  children: ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'outline';
}

export function Badge({ children, color = 'blue' }: BadgeProps) {
  return <span className={`badge badge-${color}`}>{children}</span>;
}

/* ═══════ TOAST SYSTEM ═══════ */
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastId = 0;
let toastSetter: React.Dispatch<React.SetStateAction<Toast[]>> | null = null;

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  if (!toastSetter) return;
  const id = ++toastId;
  toastSetter(prev => [...prev, { id, message, type }]);
  setTimeout(() => {
    toastSetter?.(prev => prev.filter(t => t.id !== id));
  }, 3500);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  useEffect(() => {
    toastSetter = setToasts;
  }, []);

  const icons: Record<string, string> = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };

  return (
    <div id="toast-container">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            className={`toast ${t.type}`}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <i className={`fa-solid ${icons[t.type]}`} />
            <span>{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ═══════ CONFIRM DIALOG ═══════ */
let confirmResolver: ((v: boolean) => void) | null = null;
let confirmSetter: React.Dispatch<React.SetStateAction<{ open: boolean; msg: string }>> | null = null;

export function confirm(msg: string): Promise<boolean> {
  return new Promise(resolve => {
    confirmResolver = resolve;
    confirmSetter?.({ open: true, msg });
  });
}

export function ConfirmDialog() {
  const [state, setState] = useState({ open: false, msg: '' });
  
  useEffect(() => {
    confirmSetter = setState;
  }, []);

  const handle = (v: boolean) => {
    confirmResolver?.(v);
    setState({ open: false, msg: '' });
  };

  return (
    <Modal id="confirm" open={state.open} onClose={() => handle(false)} title="Confirmar Ação" icon="fa-triangle-exclamation" iconColor="var(--danger)" size="sm"
      footer={<>
        <button className="btn btn-ghost" onClick={() => handle(false)}>Cancelar</button>
        <button className="btn btn-danger" onClick={() => handle(true)}><i className="fa-solid fa-trash-can" /> Confirmar</button>
      </>}
    >
      <p style={{ color: 'var(--text-secondary)', fontSize: '.9rem', lineHeight: 1.6 }}>{state.msg}</p>
    </Modal>
  );
}

