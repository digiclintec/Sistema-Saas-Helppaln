import OpenAI from 'openai';
import { db } from '../../storage/db.js';
import { AgentConfig, ChatMessage, KnowledgeItem } from '../../types/index.js';

export interface AgentResponseResult {
  text: string;
  triggeredHandoff: boolean;
  source: 'openai' | 'kb_match' | 'fallback';
  modelUsed?: string;
}

export class AgentService {
  /**
   * Verifica se a mensagem do cliente dispara gatilho de transbordo para atendente humano.
   */
  public checkHandoffTrigger(message: string, config: AgentConfig): boolean {
    if (!config.handoffKeywords || config.handoffKeywords.length === 0) return false;

    const normalized = message
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return config.handoffKeywords.some(kw => {
      const normalizedKw = kw
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return normalized.includes(normalizedKw);
    });
  }

  /**
   * Constrói o contexto das Perguntas Frequentes (FAQ/Base de Conhecimento).
   */
  public buildKnowledgeContext(items: KnowledgeItem[], userQuery: string): string {
    if (!items || items.length === 0) return 'Nenhuma informação específica cadastrada.';

    const qLower = userQuery.toLowerCase();

    // Filtra itens por relevância de palavras-chave ou inclui a base estruturada
    const relevantItems = items.filter(item => {
      const matchKeyword = item.keywords?.some(k => qLower.includes(k.toLowerCase()));
      const matchQuestion = item.question.toLowerCase().includes(qLower);
      return matchKeyword || matchQuestion;
    });

    const itemsToUse = relevantItems.length > 0 ? relevantItems : items;

    return itemsToUse.map(i => `[Categoria: ${i.category.toUpperCase()}]\nPergunta: ${i.question}\nResposta: ${i.answer}`).join('\n\n---\n\n');
  }

  /**
   * Monta o prompt de sistema com as diretrizes do negócio e persona.
   */
  public buildSystemPrompt(config: AgentConfig, knowledgeContext: string): string {
    const toneDescriptions: Record<string, string> = {
      amigavel: 'Seja extremamente acolhedor, use emojis simpáticos e linguagem calorosa e próxima.',
      formal: 'Utilize linguagem polida, profissional, sem gírias e com muita sobriedade.',
      vendedor: 'Foco em persuasão, destacar benefícios, conduzir o cliente para o próximo passo de compra ou agendamento.',
      consultivo: 'Ouça as necessidades com atenção, faça perguntas para entender o cenário e oriente com clareza.',
      tecnico: 'Respostas detalhadas, precisas e objetivas.',
      personalizado: 'Siga rigorosamente as instruções personalizadas abaixo.'
    };

    return `Você é "${config.botName}", assistente virtual oficial da empresa "${config.businessName}".
Sobre a empresa: ${config.businessDescription}

TOM DE VOZ DESEJADO:
${toneDescriptions[config.personalityTone] || toneDescriptions.consultivo}

DIRETRIZES GERAIS:
1. Responda em Português do Brasil com clareza.
2. Formate as mensagens para o WhatsApp: use *negrito* para pontos importantes e quebre parágrafos curtos. Não envie blocos gigantes de texto.
3. Baseie suas respostas EXCLUSIVAMENTE nas informações oficiais fornecidas na BASE DE CONHECIMENTO abaixo.
4. Se o usuário perguntar algo que não está na Base de Conhecimento, NÃO invente dados. Diga com educação que não possui essa informação precisa no momento e ofereça transferir para a equipe humana.
5. Se o cliente solicitar explicitamente falar com um atendente ou expressar insatisfação, informe que está transferindo o atendimento.

INSTRUÇÕES ESPECÍFICAS DA EMPRESA:
${config.customInstructions || 'Nenhuma instrução adicional.'}

BASE DE CONHECIMENTO OFICIAL (FAQ & REGRAS):
${knowledgeContext}`;
  }

  /**
   * Processa a mensagem do cliente e gera a resposta adequada.
   */
  public async generateResponse(
    conversationId: string,
    userMessage: string,
    history: ChatMessage[] = []
  ): Promise<AgentResponseResult> {
    const config = db.getAgentConfig();
    const knowledgeBase = db.getKnowledgeBase();

    // 1. Checa se o robô está pausado
    if (config.status === 'paused') {
      return {
        text: 'O atendimento automático está em pausa no momento. Um atendente responderá em breve.',
        triggeredHandoff: true,
        source: 'fallback'
      };
    }

    // 2. Checa gatilho de transbordo humano por palavra-chave
    if (this.checkHandoffTrigger(userMessage, config)) {
      return {
        text: config.handoffMessage,
        triggeredHandoff: true,
        source: 'kb_match'
      };
    }

    // 3. Monta o contexto da base de conhecimento
    const knowledgeContext = this.buildKnowledgeContext(knowledgeBase, userMessage);
    const systemPrompt = this.buildSystemPrompt(config, knowledgeContext);

    // 4. Se houver OpenAI API Key configurada, utiliza GPT
    const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY;
    if (apiKey && apiKey.trim().length > 5) {
      try {
        const openai = new OpenAI({ apiKey: apiKey.trim() });

        // Monta os últimos 6 diálogos para manter o fio da conversa
        const recentHistory = history.slice(-6).map(m => ({
          role: (m.sender === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
          content: m.content
        }));

        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
          { role: 'system', content: systemPrompt },
          ...recentHistory,
          { role: 'user', content: userMessage }
        ];

        const model = config.openaiModel || 'gpt-4o-mini';
        const completion = await openai.chat.completions.create({
          model,
          messages,
          temperature: 0.6,
          max_tokens: 500
        });

        const replyText = completion.choices[0]?.message?.content?.trim() || '';

        // Checagem se na resposta o bot disse que transferiu para humano
        const triggeredHandoff = this.checkHandoffTrigger(replyText, config);

        return {
          text: replyText,
          triggeredHandoff,
          source: 'openai',
          modelUsed: model
        };
      } catch (err: any) {
        console.error('Erro na chamada da OpenAI:', err?.message || err);
        // Fallback inteligente para a base de conhecimento local caso a API falhe
      }
    }

    // 5. Fallback Inteligente (Motor Heurístico de FAQ local)
    // Funciona mesmo sem API Key da OpenAI ou quando a cota estiver esgotada!
    const queryNormalized = userMessage
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const bestMatch = knowledgeBase.find(kb => {
      const qNorm = kb.question
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const keywordsNorm = kb.keywords.map(k =>
        k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      );

      return (
        queryNormalized.includes(qNorm) ||
        keywordsNorm.some(kw => queryNormalized.includes(kw))
      );
    });

    if (bestMatch) {
      return {
        text: `Olá! Sobre *${bestMatch.question}*:\n\n${bestMatch.answer}\n\n_Se precisar de mais alguma informação ou preferir falar com um especialista, basta digitar *atendente*._`,
        triggeredHandoff: false,
        source: 'kb_match'
      };
    }

    // Resposta padrão cordial com opções
    return {
      text: `Olá! Sou o *${config.botName}*, assistente virtual da *${config.businessName}*.\n\nRecebi sua mensagem: "${userMessage}".\n\nComo posso te ajudar hoje?\n• Digite *planos* para consultar opções e valores\n• Digite *horário* para nosso horário de atendimento\n• Digite *humano* a qualquer momento para falar com nossa equipe!`,
      triggeredHandoff: false,
      source: 'fallback'
    };
  }
}

export const agentService = new AgentService();
