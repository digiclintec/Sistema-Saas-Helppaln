import fs from 'fs';
import path from 'path';
import { AgentConfig, KnowledgeItem, Conversation, ChatMessage, EvolutionSettings } from '../types/index.js';

interface DatabaseSchema {
  agentConfig: AgentConfig;
  knowledgeBase: KnowledgeItem[];
  conversations: Conversation[];
  messages: ChatMessage[];
  evolutionSettings: EvolutionSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

const DEFAULT_AGENT_CONFIG: AgentConfig = {
  botName: 'HelpZap IA',
  businessName: 'HelpPaln Soluções',
  businessDescription: 'Plataforma líder em soluções e atendimento inteligente para pequenas e médias empresas.',
  personalityTone: 'consultivo',
  customInstructions: `Você é o assistente virtual oficial da HelpPaln. 
Seu papel é recepcionar os clientes com cordialidade, tirar dúvidas sobre planos, serviços e agendamentos.
Seja sempre objetivo, educado e use formatações adequadas para WhatsApp (*negrito*, tópicos curtos e emojis moderados).
Caso o cliente faça uma pergunta específica para a qual você não tenha resposta confirmada na Base de Conhecimento, não invente informações; diga que vai consultar a equipe e pergunte se deseja falar com um atendente humano.`,
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  handoffKeywords: [
    'humano',
    'atendente',
    'falar com alguém',
    'pessoa',
    'especialista',
    'suporte humano',
    'sair do robô',
    'gerente'
  ],
  handoffMessage: 'Entendido! Estou transferindo o seu atendimento para um de nossos especialistas humanos. Por favor, aguarde alguns instantes que logo alguém da equipe irá responder.',
  maxConsecutiveFailures: 2,
  activeHoursOnly: false,
  workingHoursStart: '08:00',
  workingHoursEnd: '18:00',
  outOfHoursMessage: 'Olá! Nosso horário de atendimento com equipe humana é de segunda a sexta, das 08h às 18h. Posso tentar te ajudar por aqui com a nossa inteligência artificial enquanto isso! O que você procura?',
  status: 'active'
};

const DEFAULT_KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    id: 'kb_1',
    category: 'geral',
    question: 'O que é a HelpPaln?',
    answer: 'A HelpPaln é uma plataforma completa que automatiza atendimentos pelo WhatsApp usando Inteligência Artificial, CRM visual e distribuição de conversas para múltiplos atendentes.',
    keywords: ['sobre', 'empresa', 'helppaln', 'o que faz', 'como funciona'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kb_2',
    category: 'precos',
    question: 'Quais são os planos e valores disponíveis?',
    answer: 'Temos 3 planos principais:\n\n*1. Plano Start:* R$ 97/mês (1 número de WhatsApp, 2 atendentes, IA básica)\n*2. Plano Pro:* R$ 197/mês (2 números, 5 atendentes, IA completa com FAQ e CRM)\n*3. Plano Enterprise:* Sob consulta (números ilimitados, IA personalizada, suporte prioritário)\n\nTodos os planos têm 7 dias de garantia incondicional!',
    keywords: ['preço', 'valor', 'planos', 'custo', 'mensalidade', 'quanto custa'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kb_3',
    category: 'pagamentos',
    question: 'Quais são as formas de pagamento aceitas?',
    answer: 'Aceitamos Pix com ativação imediata, cartão de crédito em até 12x e boleto bancário para faturas anuais.',
    keywords: ['pix', 'cartao', 'boleto', 'pagamento', 'como pagar'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kb_4',
    category: 'horarios',
    question: 'Qual é o horário de atendimento?',
    answer: 'Nosso assistente de IA funciona 24 horas por dia, 7 dias por semana! A equipe humana atende de segunda a sexta, das 08:00 às 18:00.',
    keywords: ['horario', 'funcionamento', 'horas', 'quando atendem', 'aberto'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kb_5',
    category: 'servicos',
    question: 'Como funciona a integração com o WhatsApp?',
    answer: 'A conexão é feita em menos de 1 minuto através da leitura de um QR Code direto na nossa tela, exatamente igual ao WhatsApp Web. Você não perde suas conversas antigas.',
    keywords: ['whatsapp', 'qrcode', 'conectar', 'integracao', 'numero'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1',
    remoteJid: '5511987654321@s.whatsapp.net',
    contactName: 'Carlos Eduardo Ramos',
    contactPhone: '+55 (11) 98765-4321',
    assignedMode: 'ai',
    status: 'open',
    unreadCount: 0,
    lastMessage: 'Perfeito, vou verificar o plano Pro! Como faço para assinar?',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    tags: ['Lead Quente', 'Interesse Plano Pro'],
    crmStage: 'proposta',
    botConsecutiveFailures: 0
  },
  {
    id: 'conv_2',
    remoteJid: '5521976543210@s.whatsapp.net',
    contactName: 'Dra. Mariana Vasconcelos',
    contactPhone: '+55 (21) 97654-3210',
    assignedMode: 'pending_handoff',
    status: 'open',
    unreadCount: 2,
    lastMessage: 'Gostaria de falar com um atendente humano para tirar uma dúvida sobre contrato corporativo.',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    tags: ['Urgente', 'Transbordo Humano', 'Clínica'],
    crmStage: 'qualificado',
    botConsecutiveFailures: 0
  },
  {
    id: 'conv_3',
    remoteJid: '5531998877665@s.whatsapp.net',
    contactName: 'Felipe Albuquerque',
    contactPhone: '+55 (31) 99887-7665',
    assignedMode: 'human',
    status: 'open',
    unreadCount: 0,
    lastMessage: 'Atendimento assumido pelo especialista Roberto.',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    tags: ['Em Negociação'],
    crmStage: 'em_atendimento',
    botConsecutiveFailures: 0
  }
];

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_1',
    conversationId: 'conv_1',
    sender: 'user',
    content: 'Olá, gostaria de saber os valores dos planos de vocês.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    id: 'msg_2',
    conversationId: 'conv_1',
    sender: 'assistant',
    content: 'Olá, Carlos! É um prazer falar com você. 😊\n\nNós temos 3 planos pensados para o tamanho do seu negócio:\n\n*1. Plano Start:* R$ 97/mês (1 WhatsApp, 2 atendentes)\n*2. Plano Pro:* R$ 197/mês (2 WhatsApps, 5 atendentes, IA completa com CRM)\n*3. Plano Enterprise:* Sob consulta\n\nQual desses melhor atende o volume da sua empresa?',
    timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString()
  },
  {
    id: 'msg_3',
    conversationId: 'conv_1',
    sender: 'user',
    content: 'Perfeito, vou verificar o plano Pro! Como faço para assinar?',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString()
  },
  {
    id: 'msg_4',
    conversationId: 'conv_2',
    sender: 'user',
    content: 'Boa tarde, preciso de uma proposta customizada para 4 filiais.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  },
  {
    id: 'msg_5',
    conversationId: 'conv_2',
    sender: 'user',
    content: 'Gostaria de falar com um atendente humano para tirar uma dúvida sobre contrato corporativo.',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString()
  },
  {
    id: 'msg_6',
    conversationId: 'conv_2',
    sender: 'assistant',
    content: 'Entendido, Dra. Mariana! Estou transferindo o seu atendimento para um de nossos especialistas corporativos. Por favor, aguarde alguns instantes que logo alguém da equipe irá responder.',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString()
  }
];

const DEFAULT_EVOLUTION_SETTINGS: EvolutionSettings = {
  apiUrl: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
  apiKey: process.env.EVOLUTION_API_KEY || '',
  instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'helppaln_bot',
  webhookUrl: 'http://localhost:3333/api/webhook/evolution',
  isConnected: false
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
      }
    } catch (err) {
      console.error('Error loading database file, initializing defaults:', err);
    }

    const initialData: DatabaseSchema = {
      agentConfig: DEFAULT_AGENT_CONFIG,
      knowledgeBase: DEFAULT_KNOWLEDGE_BASE,
      conversations: DEFAULT_CONVERSATIONS,
      messages: DEFAULT_MESSAGES,
      evolutionSettings: DEFAULT_EVOLUTION_SETTINGS
    };

    this.saveData(initialData);
    return initialData;
  }

  private saveData(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database file:', err);
    }
  }

  // Agent Config
  getAgentConfig(): AgentConfig {
    return this.data.agentConfig;
  }

  updateAgentConfig(newConfig: Partial<AgentConfig>): AgentConfig {
    this.data.agentConfig = {
      ...this.data.agentConfig,
      ...newConfig
    };
    this.saveData(this.data);
    return this.data.agentConfig;
  }

  // Knowledge Base
  getKnowledgeBase(): KnowledgeItem[] {
    return this.data.knowledgeBase;
  }

  addKnowledgeItem(item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeItem {
    const newItem: KnowledgeItem = {
      id: `kb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.knowledgeBase.push(newItem);
    this.saveData(this.data);
    return newItem;
  }

  updateKnowledgeItem(id: string, updates: Partial<KnowledgeItem>): KnowledgeItem | null {
    const index = this.data.knowledgeBase.findIndex(item => item.id === id);
    if (index === -1) return null;

    this.data.knowledgeBase[index] = {
      ...this.data.knowledgeBase[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveData(this.data);
    return this.data.knowledgeBase[index];
  }

  deleteKnowledgeItem(id: string): boolean {
    const initialLen = this.data.knowledgeBase.length;
    this.data.knowledgeBase = this.data.knowledgeBase.filter(item => item.id !== id);
    if (this.data.knowledgeBase.length !== initialLen) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // Conversations
  getConversations(): Conversation[] {
    return this.data.conversations.sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  }

  getConversationById(id: string): Conversation | undefined {
    return this.data.conversations.find(c => c.id === id);
  }

  getConversationByRemoteJid(remoteJid: string): Conversation | undefined {
    return this.data.conversations.find(c => c.remoteJid === remoteJid);
  }

  createOrUpdateConversation(conv: Partial<Conversation> & { remoteJid: string }): Conversation {
    const existing = this.getConversationByRemoteJid(conv.remoteJid);
    if (existing) {
      const updated = {
        ...existing,
        ...conv
      };
      const idx = this.data.conversations.findIndex(c => c.id === existing.id);
      this.data.conversations[idx] = updated;
      this.saveData(this.data);
      return updated;
    }

    const newConv: Conversation = {
      id: `conv_${Date.now()}`,
      remoteJid: conv.remoteJid,
      contactName: conv.contactName || conv.remoteJid.split('@')[0],
      contactPhone: conv.contactPhone || conv.remoteJid.split('@')[0],
      assignedMode: conv.assignedMode || 'ai',
      status: 'open',
      unreadCount: 0,
      lastMessage: conv.lastMessage || '',
      lastMessageTime: new Date().toISOString(),
      tags: conv.tags || ['Novo Lead'],
      crmStage: conv.crmStage || 'novo',
      botConsecutiveFailures: 0,
      ...conv
    };
    this.data.conversations.push(newConv);
    this.saveData(this.data);
    return newConv;
  }

  updateConversation(id: string, updates: Partial<Conversation>): Conversation | null {
    const index = this.data.conversations.findIndex(c => c.id === id);
    if (index === -1) return null;

    this.data.conversations[index] = {
      ...this.data.conversations[index],
      ...updates
    };
    this.saveData(this.data);
    return this.data.conversations[index];
  }

  // Messages
  getMessages(conversationId: string): ChatMessage[] {
    return this.data.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  addMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...msg
    };
    this.data.messages.push(newMsg);

    // Update conversation lastMessage
    const conv = this.getConversationById(msg.conversationId);
    if (conv) {
      conv.lastMessage = msg.content;
      conv.lastMessageTime = newMsg.timestamp;
      this.saveData(this.data);
    }

    return newMsg;
  }

  // Evolution Settings
  getEvolutionSettings(): EvolutionSettings {
    return this.data.evolutionSettings;
  }

  updateEvolutionSettings(settings: Partial<EvolutionSettings>): EvolutionSettings {
    this.data.evolutionSettings = {
      ...this.data.evolutionSettings,
      ...settings
    };
    this.saveData(this.data);
    return this.data.evolutionSettings;
  }
}

export const db = new Database();
