import React, { useState } from 'react';
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  FlaskConical,
  MessageSquare,
  Columns,
  QrCode,
  Zap
} from 'lucide-react';

import { DashboardView } from './components/DashboardView';
import { AgentConfigView } from './components/AgentConfigView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { PlaygroundView } from './components/PlaygroundView';
import { InboxView } from './components/InboxView';
import { CrmKanbanView } from './components/CrmKanbanView';
import { EvolutionConfigView } from './components/EvolutionConfigView';
import { Conversation } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const handleOpenChat = (conv: Conversation) => {
    setSelectedConversation(conv);
    setActiveTab('inbox');
  };

  const navItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'agent', label: 'Agente de IA', icon: Bot, highlight: true },
    { id: 'knowledge', label: 'Base de Conhecimento', icon: BookOpen },
    { id: 'playground', label: 'Simulador / Testes', icon: FlaskConical },
    { id: 'inbox', label: 'Inbox WhatsApp', icon: MessageSquare },
    { id: 'kanban', label: 'Funil CRM', icon: Columns },
    { id: 'evolution', label: 'Conexão WhatsApp', icon: QrCode }
  ];

  const getPageInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Painel Geral', subtitle: 'Acompanhamento de atendimentos, IA e conversões em tempo real.' };
      case 'agent':
        return { title: 'Configuração do Agente de IA', subtitle: 'Defina a persona, tom de voz, regras do negócio e transbordo humano.' };
      case 'knowledge':
        return { title: 'Base de Conhecimento (FAQ)', subtitle: 'Cadastre perguntas e respostas para a IA responder com precisão.' };
      case 'playground':
        return { title: 'Simulador de IA em Tempo Real', subtitle: 'Converse com o robô e teste suas respostas antes de publicar no WhatsApp.' };
      case 'inbox':
        return { title: 'Central de Atendimento WhatsApp', subtitle: 'Gerencie conversas ao vivo, assuma chats ou deixe a IA responder.' };
      case 'kanban':
        return { title: 'CRM Kanban de Oportunidades', subtitle: 'Organize leads por etapas comerciais e gerencie vendas.' };
      case 'evolution':
        return { title: 'Integração Evolution API', subtitle: 'Conecte seu número de WhatsApp e configure instâncias e webhooks.' };
      default:
        return { title: 'HelpPaln SaaS', subtitle: 'Plataforma de WhatsApp com IA' };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="app-container">
      {/* Sidebar de Navegação */}
      <aside className="sidebar">
        <div className="brand-header">
          <div className="brand-icon-box">
            <Zap size={22} fill="white" />
          </div>
          <div>
            <div className="brand-title">HelpPaln</div>
            <div className="brand-badge">AtendeZap AI · SaaS</div>
          </div>
        </div>

        <nav className="nav-menu">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={19} color={isActive ? 'var(--primary-bright)' : 'currentColor'} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.highlight && !isActive && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-bright)' }} />
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="status-pill">
            <span className="status-dot"></span>
            <span>Motor de IA Ativo (GPT / FAQ)</span>
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '6px' }}>
            HelpPaln v1.0 · Multi-atendente
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="main-content">
        <header className="top-bar">
          <div className="page-title-box">
            <h1>{pageInfo.title}</h1>
            <p>{pageInfo.subtitle}</p>
          </div>

          <div className="top-actions">
            <button
              type="button"
              onClick={() => setActiveTab('playground')}
              className="btn btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.8rem' }}
            >
              <FlaskConical size={15} color="var(--primary-bright)" />
              Simular Chat
            </button>
          </div>
        </header>

        <div className="content-body">
          {activeTab === 'dashboard' && (
            <DashboardView onNavigate={setActiveTab} onOpenChat={handleOpenChat} />
          )}
          {activeTab === 'agent' && <AgentConfigView />}
          {activeTab === 'knowledge' && <KnowledgeBaseView />}
          {activeTab === 'playground' && <PlaygroundView />}
          {activeTab === 'inbox' && <InboxView initialConversation={selectedConversation} />}
          {activeTab === 'kanban' && <CrmKanbanView onOpenChat={handleOpenChat} />}
          {activeTab === 'evolution' && <EvolutionConfigView />}
        </div>
      </main>
    </div>
  );
};
