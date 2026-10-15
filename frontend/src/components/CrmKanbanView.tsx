import React, { useState, useEffect } from 'react';
import { Columns, ArrowRight, UserCheck, Phone, MessageSquare } from 'lucide-react';
import { api } from '../services/api';
import { Conversation, CrmStage } from '../types';

interface CrmKanbanViewProps {
  onOpenChat: (conv: Conversation) => void;
}

export const CrmKanbanView: React.FC<CrmKanbanViewProps> = ({ onOpenChat }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Erro ao carregar CRM:', err);
    } finally {
      setLoading(false);
    }
  };

  const stages: { key: CrmStage; label: string; color: string }[] = [
    { key: 'novo', label: 'Novos Contatos', color: '#38BDF8' },
    { key: 'em_atendimento', label: 'Em Atendimento', color: '#FBBF24' },
    { key: 'qualificado', label: 'Qualificados / Oportunidade', color: '#A78BFA' },
    { key: 'proposta', label: 'Proposta Enviada', color: '#F472B6' },
    { key: 'fechado', label: 'Fechados / Clientes', color: '#34D399' }
  ];

  const moveStage = async (convId: string, nextStage: CrmStage) => {
    try {
      const updated = await api.updateConversationStage(convId, nextStage);
      setConversations(conversations.map(c => (c.id === updated.id ? updated : c)));
    } catch (err) {
      console.error('Erro ao mover lead:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Columns size={20} color="var(--primary-bright)" />
            Funil de Vendas do WhatsApp (CRM)
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
            Acompanhe a evolução de cada conversa desde o primeiro contato até o fechamento.
          </p>
        </div>
      </div>

      <div className="kanban-board">
        {stages.map((stage, idx) => {
          const stageConvs = conversations.filter(c => (c.crmStage || 'novo') === stage.key);
          const nextStage = stages[idx + 1]?.key;

          return (
            <div key={stage.key} className="kanban-column">
              <div className="kanban-column-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: stage.color }}></span>
                  {stage.label}
                </span>
                <span style={{
                  background: 'var(--bg-card)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  border: '1px solid var(--border-light)'
                }}>
                  {stageConvs.length}
                </span>
              </div>

              <div className="kanban-cards-list">
                {stageConvs.map(conv => (
                  <div key={conv.id} className="kanban-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {conv.contactName}
                      </span>
                      {conv.assignedMode === 'pending_handoff' ? (
                        <span className="badge badge-handoff" style={{ fontSize: '0.65rem' }}>Transbordo</span>
                      ) : conv.assignedMode === 'ai' ? (
                        <span className="badge badge-ai" style={{ fontSize: '0.65rem' }}>IA</span>
                      ) : (
                        <span className="badge badge-human" style={{ fontSize: '0.65rem' }}>Humano</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                      <Phone size={12} />
                      {conv.contactPhone}
                    </div>

                    <div style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      background: 'var(--bg-subtle)',
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '10px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      "{conv.lastMessage}"
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => onOpenChat(conv)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                      >
                        <MessageSquare size={12} />
                        Abrir Chat
                      </button>

                      {nextStage && (
                        <button
                          type="button"
                          onClick={() => moveStage(conv.id, nextStage)}
                          className="btn btn-primary"
                          style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                          title="Avançar etapa no funil"
                        >
                          Avançar
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {stageConvs.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                    Nenhum contato nesta etapa
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
