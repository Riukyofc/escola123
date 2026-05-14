'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dbGetAll } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { PageTransition, EmptyState, showToast } from '@/components/ui/DashboardUI';
import { saveDocument } from '@/lib/actions';
import { formatDateTime } from '@/lib/utils';

export default function DiretorMensagens() {
  useDataRefresh();
  const { session } = useAuth();
  const profs = dbGetAll<Record<string, unknown>>('professores').filter(p => p.ativo);
  const mensagens = dbGetAll<Record<string, unknown>>('mensagens');
  const [selProf, setSelProf] = useState('');
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMsgs = mensagens
    .filter(m => m.professorId === selProf)
    .sort((a, b) => String(a.dataCriacao || '').localeCompare(String(b.dataCriacao || '')));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs.length, selProf]);

  const handleSend = async () => {
    if (!msg.trim() || !selProf || !session) return;
    setSending(true);
    await saveDocument('mensagens', null, {
      professorId: selProf,
      remetente: 'diretor',
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

  const getLastMsg = (profId: string) => {
    const msgs = mensagens.filter(m => m.professorId === profId);
    if (msgs.length === 0) return 'Nenhuma mensagem';
    const last = msgs.sort((a, b) => String(b.dataCriacao || '').localeCompare(String(a.dataCriacao || '')))[0];
    return (last.texto as string || '').slice(0, 40);
  };

  return (
    <PageTransition>
      <div className="chat-container">
        <div className="chat-sidebar">
          <div className="chat-sidebar-header"><i className="fa-solid fa-comments" /> Professores</div>
          <div className="chat-sidebar-list">
            {profs.map(p => (
              <div key={p.id as string} className={`chat-contact ${selProf === p.id ? 'active' : ''}`} onClick={() => setSelProf(p.id as string)}>
                <div className="chat-contact-avatar" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                  {(p.nome as string).charAt(0)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="chat-contact-name">{p.nome as string}</div>
                  <div className="chat-contact-last">{getLastMsg(p.id as string)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-main">
          {selProf ? (
            <>
              <div className="chat-main-header">
                <div className="chat-contact-avatar" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', width: 32, height: 32, fontSize: '.75rem' }}>
                  {(profs.find(p => p.id === selProf)?.nome as string || 'P').charAt(0)}
                </div>
                {profs.find(p => p.id === selProf)?.nome as string}
              </div>
              <div className="chat-messages">
                {chatMsgs.length === 0 ? (
                  <EmptyState icon="fa-comments" title="Nenhuma mensagem ainda" desc="Envie a primeira mensagem" />
                ) : chatMsgs.map(m => (
                  <div key={m.id as string} className={`chat-message ${m.remetente === 'diretor' ? 'sent' : 'received'}`}>
                    <div>{m.texto as string}</div>
                    <div className="chat-message-time">{formatDateTime(m.dataCriacao as string)}</div>
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
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState icon="fa-hand-pointer" title="Selecione um professor" desc="Escolha um professor na lista para iniciar uma conversa" />
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
