import { AgentConfig, KnowledgeItem, Conversation, ChatMessage, EvolutionSettings, DashboardStats } from '../types';

const API_BASE = '/api';

export const api = {
  // Agent Config
  async getAgentConfig(): Promise<AgentConfig> {
    const res = await fetch(`${API_BASE}/agent`);
    const json = await res.json();
    return json.data;
  },

  async updateAgentConfig(config: Partial<AgentConfig>): Promise<AgentConfig> {
    const res = await fetch(`${API_BASE}/agent`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const json = await res.json();
    return json.data;
  },

  // Knowledge Base (FAQ)
  async getKnowledgeBase(): Promise<KnowledgeItem[]> {
    const res = await fetch(`${API_BASE}/knowledge`);
    const json = await res.json();
    return json.data;
  },

  async addKnowledgeItem(item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeItem> {
    const res = await fetch(`${API_BASE}/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const json = await res.json();
    return json.data;
  },

  async updateKnowledgeItem(id: string, item: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
    const res = await fetch(`${API_BASE}/knowledge/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const json = await res.json();
    return json.data;
  },

  async deleteKnowledgeItem(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/knowledge/${id}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    return json.success;
  },

  // AI Playground Simulator
  async testAiAgent(message: string, history?: { sender: string; content: string }[]): Promise<{
    reply: string;
    triggeredHandoff: boolean;
    source: 'openai' | 'kb_match' | 'fallback';
    modelUsed?: string;
  }> {
    const res = await fetch(`${API_BASE}/ai/playground`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    });
    const json = await res.json();
    return json.data;
  },

  // Conversations & Chat
  async getConversations(): Promise<Conversation[]> {
    const res = await fetch(`${API_BASE}/conversations`);
    const json = await res.json();
    return json.data;
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`);
    const json = await res.json();
    return json.data;
  },

  async sendHumanMessage(conversationId: string, text: string, agentName?: string): Promise<ChatMessage> {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, agentName })
    });
    const json = await res.json();
    return json.data;
  },

  async switchConversationMode(conversationId: string, mode: 'ai' | 'human' | 'pending_handoff'): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/mode`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    const json = await res.json();
    return json.data;
  },

  async updateConversationStage(conversationId: string, stage: string): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/stage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage })
    });
    const json = await res.json();
    return json.data;
  },

  // Evolution Settings
  async getEvolutionSettings(): Promise<EvolutionSettings> {
    const res = await fetch(`${API_BASE}/evolution/settings`);
    const json = await res.json();
    return json.data;
  },

  async updateEvolutionSettings(settings: Partial<EvolutionSettings>): Promise<EvolutionSettings> {
    const res = await fetch(`${API_BASE}/evolution/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    const json = await res.json();
    return json.data;
  },

  async getEvolutionStatus(): Promise<EvolutionSettings> {
    const res = await fetch(`${API_BASE}/evolution/status`);
    const json = await res.json();
    return json.data;
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    const json = await res.json();
    return json.data;
  }
};
