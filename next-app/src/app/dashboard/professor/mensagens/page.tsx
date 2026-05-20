'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dbGetAllEscola } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { PageTransition, EmptyState, showToast } from '@/components/ui/DashboardUI';
import { saveDocument } from '@/lib/actions';
import { formatDateTime } from '@/lib/utils';

export default function ProfMensagens() {
  useDataRefresh();
  const { session } = useAuth();
  const mensagens = dbGetAllEscola<Record<string, unknown>>('mensagens');
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Professor sees their own messages with the director
  const profId = session?.userData?.professorId || session?.userData?.uid || '';
  const chatMsgs = mensagens
    .filter(m => m.professorId === profId)
    .sort((a, b) => String(a.dataCriacao || '').localeCompare(String(b.dataCriacao || '')));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs.length]);

  const handleSend = async () => {
    if (!msg.trim() || !session) return;
    setSending(true);
    await saveDocument('mensagens', null, {
      professorId: profId,
      remetente: 'professor',
      remetenteNome: session.name,
      texto: msg.trim(),
      dataCriacao: new Date().toISOString(),
    });
    setMsg('');
    setSending(false);
    showToast('Mensagem enviada!', 'success');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <PageTransition>
      <div className="chat-container" style={{ height: 'calc(100vh - 180px)' }}>
        <div className="chat-main" style={{ width: '100%' }}>
          <div className="chat-main-header">
            <div className="chat-contact-avatar" style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', width: 32, height: 32, fontSize: '.75rem' }}>D</div>
            Direção da Escola
          </div>
          <div className="chat-messages">
            {chatMsgs.length === 0 ? (
              <EmptyState icon="fa-comments" title="Nenhuma mensagem" desc="Envie uma mensagem para a direção" />
            ) : chatMsgs.map(m => (
              <div key={m.id as string} className={`chat-message ${m.remetente === 'professor' ? 'sent' : 'received'}`}>
                <div>{m.texto as string}</div>
                <div className="chat-message-time">{m.remetenteNome as string} · {formatDateTime(m.dataCriacao as string)}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input-bar">
            <input className="chat-input" value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={handleKeyDown} placeholder="Digite sua mensagem..." />
            <button className="chat-send-btn" onClick={handleSend} disabled={sending}>
              <i className={`fa-solid ${sending ? 'fa-spinner spin' : 'fa-paper-plane'}`} />
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
