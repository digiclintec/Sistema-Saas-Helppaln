export interface AgentConfig {
  botName: string;
  businessName: string;
  businessDescription: string;
  personalityTone: 'amigavel' | 'formal' | 'vendedor' | 'consultivo' | 'tecnico' | 'personalizado';
  customInstructions: string;
  openaiApiKey?: string;
  openaiModel: string;
  handoffKeywords: string[];
  handoffMessage: string;
  maxConsecutiveFailures: number;
  activeHoursOnly: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  outOfHoursMessage: string;
  status: 'active' | 'paused';
}

export interface KnowledgeItem {
  id: string;
  category: 'geral' | 'precos' | 'servicos' | 'horarios' | 'pagamentos' | 'duvidas';
  question: string;
  answer: string;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}

export type SenderType = 'user' | 'assistant' | 'human_agent' | 'system';
export type AssignedMode = 'ai' | 'human' | 'pending_handoff';
export type CrmStage = 'novo' | 'em_atendimento' | 'qualificado' | 'proposta' | 'fechado' | 'perdido';

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: SenderType;
  content: string;
  timestamp: string;
  senderName?: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  remoteJid: string;
  contactName: string;
  contactPhone: string;
  assignedMode: AssignedMode;
  status: 'open' | 'resolved' | 'closed';
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  tags: string[];
  notes?: string;
  crmStage: CrmStage;
  botConsecutiveFailures: number;
}

export interface EvolutionSettings {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
  webhookUrl: string;
  isConnected: boolean;
  batteryLevel?: number;
  qrCodeBase64?: string;
}

export interface DashboardStats {
  totalConversations: number;
  activeAiConversations: number;
  pendingHandoffs: number;
  totalMessagesToday: number;
  aiResolutionRate: number;
  faqItemsCount: number;
}
