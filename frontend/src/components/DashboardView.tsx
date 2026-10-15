import React, { useState, useEffect } from 'react';
import { MessageSquare, Bot, AlertTriangle, BookOpen, TrendingUp, Users, ArrowUpRight, Zap, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, Conversation } from '../types';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenChat: (conv: Conversation) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenChat }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsData, convsData] = await Promise.all([
        api.getDashboardStats(),
        api.getConversations()
      ]);
      setStats(statsData);
      setConversations(convsData.slice(0, 5));
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Cards de Métricas Principais */}
      <div className="grid-4">
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontWeight: 600 }}>Total de Conversas</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA' }}>
              <MessageSquare size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {stats?.totalConversations || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Contatos no WhatsApp
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontWeight: 600 }}>Em Atendimento por IA</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399' }}>
              <Bot size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34D399', letterSpacing: '-0.02em' }}>
            {stats?.activeAiConversations || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {stats?.aiResolutionRate || 92}% taxa de resolução automática
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontWeight: 600 }}>Transbordo Humano</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FBBF24' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FBBF24', letterSpacing: '-0.02em' }}>
            {stats?.pendingHandoffs || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Aguardando equipe humana
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontWeight: 600 }}>Base de Conhecimento</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C084FC' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {stats?.faqItemsCount || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Perguntas & Regras cadastradas
          </div>
        </div>
      </div>

      {/* Ações Rápidas & Banner de Boas-vindas */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(7, 94, 84, 0.3), var(--bg-card))', border: '1px solid rgba(18, 140, 126, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="badge badge-ai" style={{ marginBottom: '8px' }}>
              <Zap size={12} /> Sistema Operacional
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
              HelpPaln · AtendeZap AI pronto para operar
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '650px' }}>
              Configure a persona do seu Agente de IA, adicione as perguntas mais frequentes do seu negócio e faça testes em tempo real no simulador antes de conectar ao WhatsApp.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => onNavigate('playground')} className="btn btn-primary">
              <Bot size={16} />
              Testar no Simulador
            </button>
            <button type="button" onClick={() => onNavigate('knowledge')} className="btn btn-secondary">
              <BookOpen size={16} />
              Gerenciar FAQ
            </button>
          </div>
        </div>
      </div>

      {/* Últimas Conversas Recentes */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <MessageSquare size={18} color="var(--primary-bright)" />
              Últimos Atendimentos
            </div>
            <div className="card-subtitle">Conversas recentes recebidas via WhatsApp</div>
          </div>
          <button type="button" onClick={() => onNavigate('inbox')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
            Ver Todas
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => onOpenChat(conv)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: 'var(--primary-bright)',
                  border: '1px solid var(--border-light)'
                }}>
                  {conv.contactName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    {conv.contactName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {conv.lastMessage}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                {conv.assignedMode === 'pending_handoff' ? (
                  <span className="badge badge-handoff">Transbordo</span>
                ) : conv.assignedMode === 'ai' ? (
                  <span className="badge badge-ai">IA Ativa</span>
                ) : (
                  <span className="badge badge-human">Humano</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
