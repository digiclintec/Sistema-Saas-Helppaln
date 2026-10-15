import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Bot, User, Send, CheckCheck, RefreshCw, AlertTriangle, ArrowRightLeft, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { Conversation, ChatMessage } from '../types';

interface InboxViewProps {
  initialConversation?: Conversation | null;
}

export const InboxView: React.FC<InboxViewProps> = ({ initialConversation }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(initialConversation || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [filterMode, setFilterMode] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputReply, setInputReply] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.id);
    }
  }, [selectedConv?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
      if (!selectedConv && data.length > 0) {
        setSelectedConv(data[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const msgs = await api.getMessages(convId);
      setMessages(msgs);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !inputReply.trim() || sending) return;

    try {
      setSending(true);
      const newMsg = await api.sendHumanMessage(selectedConv.id, inputReply.trim(), 'Especialista');
      setMessages(prev => [...prev, newMsg]);
      setInputReply('');
      // Atualiza modo localmente para humano
      setSelectedConv(prev => (prev ? { ...prev, assignedMode: 'human' } : null));
      loadConversations();
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setSending(false);
    }
  };

  const handleSwitchMode = async (mode: 'ai' | 'human') => {
    if (!selectedConv) return;
    try {
      const updated = await api.switchConversationMode(selectedConv.id, mode);
      setSelectedConv(updated);
      setConversations(conversations.map(c => (c.id === updated.id ? updated : c)));
    } catch (err) {
      console.error('Erro ao trocar modo:', err);
    }
  };

  const handleStageChange = async (stage: string) => {
    if (!selectedConv) return;
    try {
      const updated = await api.updateConversationStage(selectedConv.id, stage);
      setSelectedConv(updated);
      setConversations(conversations.map(c => (c.id === updated.id ? updated : c)));
    } catch (err) {
      console.error('Erro ao mudar etapa do CRM:', err);
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (filterMode === 'todos') return true;
    if (filterMode === 'ai') return c.assignedMode === 'ai';
    if (filterMode === 'pending_handoff') return c.assignedMode === 'pending_handoff';
    if (filterMode === 'human') return c.assignedMode === 'human';
    return true;
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', height: 'calc(100vh - 180px)' }}>
      {/* Coluna da Esquerda: Lista de Conversas */}
      <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="var(--primary-bright)" />
              Atendimentos WhatsApp
            </h3>
            <button
              type="button"
              onClick={loadConversations}
              style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              title="Atualizar conversas"
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Filtros de Status */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { key: 'todos', label: 'Todos' },
              { key: 'pending_handoff', label: '⚠️ Transbordo' },
              { key: 'ai', label: '🤖 Robô IA' },
              { key: 'human', label: '👤 Humano' }
            ].map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilterMode(f.key)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: filterMode === f.key ? 'var(--primary-emerald)' : 'var(--bg-subtle)',
                  color: filterMode === f.key ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Contatos */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredConversations.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              Nenhuma conversa encontrada neste filtro.
            </div>
          ) : (
            filteredConversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  background: selectedConv?.id === conv.id ? 'var(--bg-subtle)' : 'transparent',
                  borderLeft: selectedConv?.id === conv.id ? '3px solid var(--primary-bright)' : '3px solid transparent',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    {conv.contactName}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '8px' }}>
                  {conv.lastMessage}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {conv.contactPhone}
                  </span>

                  {conv.assignedMode === 'pending_handoff' && (
                    <span className="badge badge-handoff" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                      Transbordo
                    </span>
                  )}
                  {conv.assignedMode === 'ai' && (
                    <span className="badge badge-ai" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                      IA Ativa
                    </span>
                  )}
                  {conv.assignedMode === 'human' && (
                    <span className="badge badge-human" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                      Humano
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Coluna da Direita: Janela de Chat Ativo */}
      {selectedConv ? (
        <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header da Conversa */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-sidebar)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {selectedConv.contactName}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {selectedConv.contactPhone}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Status atual: <strong>{selectedConv.assignedMode === 'ai' ? 'Robô de IA respondendo' : selectedConv.assignedMode === 'pending_handoff' ? 'Cliente solicitou atendente humano' : 'Em atendimento com humano'}</strong>
              </div>
            </div>

            {/* Ações de Controle de Modo & CRM */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <select
                className="form-select"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                value={selectedConv.crmStage}
                onChange={e => handleStageChange(e.target.value)}
              >
                <option value="novo">Etapa: Novo Lead</option>
                <option value="em_atendimento">Etapa: Em Atendimento</option>
                <option value="qualificado">Etapa: Qualificado</option>
                <option value="proposta">Etapa: Proposta Enviada</option>
                <option value="fechado">Etapa: Fechado / Cliente</option>
              </select>

              {selectedConv.assignedMode === 'ai' ? (
                <button
                  type="button"
                  onClick={() => handleSwitchMode('human')}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.8rem', borderColor: '#F59E0B', color: '#FBBF24' }}
                >
                  <ArrowRightLeft size={14} />
                  Assumir (Pausar IA)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSwitchMode('ai')}
                  className="btn btn-primary"
                  style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                >
                  <Bot size={14} />
                  Devolver para a IA
                </button>
              )}
            </div>
          </div>

          {/* Banner de Aviso de Transbordo Humano */}
          {selectedConv.assignedMode === 'pending_handoff' && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.15)',
              borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#FBBF24',
              fontSize: '0.82rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={16} />
                <span><strong>Atenção:</strong> O cliente acionou o gatilho de atendimento humano. A IA está aguardando você responder.</span>
              </div>
              <button
                type="button"
                onClick={() => handleSwitchMode('human')}
                className="btn btn-primary"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                Assumir Agora
              </button>
            </div>
          )}

          {/* Área de Mensagens */}
          <div className="whatsapp-messages" style={{ flex: 1, height: 'auto' }}>
            {messages.map(msg => (
              <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: '2px' }}>
                  {msg.sender === 'user' ? selectedConv.contactName : msg.sender === 'assistant' ? '🤖 HelpZap IA' : '👤 Especialista'}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                <div className="chat-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de Envio de Mensagem */}
          <form className="whatsapp-footer" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="whatsapp-input"
              placeholder="Responder cliente pelo WhatsApp como atendente humano..."
              value={inputReply}
              onChange={e => setInputReply(e.target.value)}
              disabled={sending}
            />
            <button type="submit" disabled={sending || !inputReply.trim()} className="btn btn-primary" style={{ padding: '10px 18px' }}>
              <Send size={18} />
              {sending ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        </div>
      ) : (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
          Selecione uma conversa para visualizar o atendimento
        </div>
      )}
    </div>
  );
};
