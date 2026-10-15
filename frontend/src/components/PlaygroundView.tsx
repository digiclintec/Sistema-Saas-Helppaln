import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Sparkles, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

interface MockMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  time: string;
  metadata?: {
    source: 'openai' | 'kb_match' | 'fallback';
    triggeredHandoff: boolean;
    modelUsed?: string;
  };
}

export const PlaygroundView: React.FC = () => {
  const [messages, setMessages] = useState<MockMessage[]>([
    {
      id: 'init_1',
      sender: 'assistant',
      content: 'Olá! Sou o assistente virtual da HelpPaln. Como posso te ajudar hoje no WhatsApp?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: MockMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.map(m => ({ sender: m.sender, content: m.content }));
      const res = await api.testAiAgent(text, historyPayload);

      const botMsg: MockMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        content: res.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metadata: {
          source: res.source,
          triggeredHandoff: res.triggeredHandoff,
          modelUsed: res.modelUsed
        }
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: MockMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        content: 'Desculpe, ocorreu uma instabilidade ao conectar com o serviço de IA. Verifique sua chave ou tente novamente.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metadata: { source: 'fallback', triggeredHandoff: false }
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: `init_${Date.now()}`,
        sender: 'assistant',
        content: 'Olá! Sou o assistente virtual da HelpPaln. Como posso te ajudar hoje no WhatsApp?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const quickPrompts = [
    'Quais são os planos e preços?',
    'Qual o horário de atendimento?',
    'Como conectar meu WhatsApp?',
    'Quero falar com um atendente humano agora'
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }}>
      {/* Box do Chat Simulador */}
      <div className="whatsapp-chat-box">
        <div className="whatsapp-header">
          <div className="whatsapp-contact">
            <div className="whatsapp-avatar">
              <Bot size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#E9EDEF' }}>
                Simulador de Atendimento (WhatsApp)
              </div>
              <div style={{ fontSize: '0.75rem', color: '#8696A0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="status-dot"></span>
                IA Ativa · Resposta em tempo real
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            title="Limpar Conversa"
          >
            <Trash2 size={15} />
            Limpar
          </button>
        </div>

        <div className="whatsapp-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              <div className="chat-time">{msg.time}</div>

              {msg.metadata && (
                <div style={{
                  marginTop: '6px',
                  paddingTop: '6px',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.7rem'
                }}>
                  {msg.metadata.triggeredHandoff ? (
                    <span style={{ color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                      <AlertCircle size={12} />
                      Transbordo Humano Acionado
                    </span>
                  ) : (
                    <span style={{ color: '#34D399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} />
                      Respondido via {msg.metadata.source === 'openai' ? `OpenAI (${msg.metadata.modelUsed})` : 'Base de Conhecimento'}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="chat-bubble assistant" style={{ fontStyle: 'italic', color: '#8696A0' }}>
              Digitando...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form
          className="whatsapp-footer"
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            className="whatsapp-input"
            placeholder="Digite uma mensagem como se fosse um cliente..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} className="btn btn-primary" style={{ padding: '10px 16px' }}>
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Painel Lateral com Sugestões & Raciocínio da IA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Sparkles size={18} color="var(--primary-bright)" />
                Testes Rápidos de Prompt
              </div>
              <div className="card-subtitle">Clique para simular mensagens comuns de clientes</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', textAlign: 'left', fontSize: '0.82rem', padding: '10px 14px' }}
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <ShieldCheck size={18} color="var(--primary-emerald)" />
                Como a IA Responde
              </div>
              <div className="card-subtitle">Critérios de triagem e inteligência</div>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-bright)', marginTop: '7px' }}></div>
              <div>
                <strong>Busca Contextual (FAQ):</strong> A IA pesquisa na Base de Conhecimento antes de responder, garantindo respostas alinhadas às regras da empresa.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-handoff)', marginTop: '7px' }}></div>
              <div>
                <strong>Gatilho de Transbordo:</strong> Se o cliente digitar "humano", "atendente" ou se a IA não souber a resposta, o atendimento é automaticamente transferido para a fila humana.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-emerald)', marginTop: '7px' }}></div>
              <div>
                <strong>Formatação WhatsApp:</strong> Respostas com *negrito*, listas e parágrafos curtos para melhor legibilidade no celular.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
