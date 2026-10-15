import { db } from '../../storage/db.js';
import { agentService } from '../ai/agentService.js';
import { ChatMessage, Conversation } from '../../types/index.js';

export class EvolutionService {
  /**
   * Envia uma mensagem de texto para o WhatsApp via Evolution API.
   */
  public async sendTextMessage(numberOrJid: string, text: string): Promise<boolean> {
    const settings = db.getEvolutionSettings();
    if (!settings.apiUrl || !settings.instanceName) {
      console.warn('[EvolutionService] API URL ou Instance Name não configurados.');
      return false;
    }

    const cleanNumber = numberOrJid.replace('@s.whatsapp.net', '');
    const endpoint = `${settings.apiUrl.replace(/\/+$/, '')}/message/sendText/${settings.instanceName}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: settings.apiKey || ''
        },
        body: JSON.stringify({
          number: cleanNumber,
          text: text,
          options: {
            delay: 1200,
            presence: 'composing'
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[EvolutionService] Erro ao enviar mensagem para ${cleanNumber}:`, errorText);
        return false;
      }

      return true;
    } catch (err: any) {
      console.error('[EvolutionService] Falha de conexão ao enviar mensagem:', err?.message || err);
      return false;
    }
  }

  /**
   * Processa webhook recebido da Evolution API.
   */
  public async handleWebhook(payload: any): Promise<void> {
    const event = payload?.event || payload?.type;
    console.log(`[EvolutionService] Webhook recebido: ${event}`);

    // Tratamento de atualização de conexão
    if (event === 'connection.update') {
      const state = payload?.data?.state;
      if (state === 'open') {
        db.updateEvolutionSettings({ isConnected: true, qrCodeBase64: undefined });
      } else if (state === 'close') {
        db.updateEvolutionSettings({ isConnected: false });
      }
      return;
    }

    // Tratamento de QR Code atualizado
    if (event === 'qrcode.updated') {
      const qrcode = payload?.data?.qrcode?.base64 || payload?.data?.base64;
      if (qrcode) {
        db.updateEvolutionSettings({ qrCodeBase64: qrcode, isConnected: false });
      }
      return;
    }

    // Tratamento de mensagens recebidas (messages.upsert)
    if (event === 'messages.upsert') {
      const data = payload?.data;
      if (!data) return;

      const key = data.key || {};
      const remoteJid = key.remoteJid;

      // Ignora mensagens enviadas pelo próprio bot ou de grupos WhatsApp (@g.us)
      if (key.fromMe || !remoteJid || remoteJid.includes('@g.us') || remoteJid.includes('status@broadcast')) {
        return;
      }

      // Extrai texto da mensagem
      const messageContent =
        data.message?.conversation ||
        data.message?.extendedTextMessage?.text ||
        data.message?.imageMessage?.caption ||
        '';

      if (!messageContent.trim()) return;

      const pushName = data.pushName || remoteJid.split('@')[0];

      // Busca ou cria a conversa no banco
      let conversation = db.getConversationByRemoteJid(remoteJid);
      if (!conversation) {
        conversation = db.createOrUpdateConversation({
          remoteJid,
          contactName: pushName,
          contactPhone: `+${remoteJid.split('@')[0]}`,
          assignedMode: 'ai',
          lastMessage: messageContent,
          crmStage: 'novo',
          tags: ['WhatsApp']
        });
      }

      // Salva a mensagem do cliente
      db.addMessage({
        conversationId: conversation.id,
        sender: 'user',
        content: messageContent,
        senderName: pushName,
        status: 'read'
      });

      // Se a conversa já estiver com atendente humano, apenas avisa na interface e não dispara IA
      if (conversation.assignedMode === 'human' || conversation.assignedMode === 'pending_handoff') {
        db.updateConversation(conversation.id, {
          unreadCount: (conversation.unreadCount || 0) + 1,
          lastMessage: messageContent,
          lastMessageTime: new Date().toISOString()
        });
        return;
      }

      // Se estiver em modo IA: gera resposta e envia
      const history = db.getMessages(conversation.id);
      const aiResponse = await agentService.generateResponse(
        conversation.id,
        messageContent,
        history
      );

      // Salva mensagem da IA no banco
      db.addMessage({
        conversationId: conversation.id,
        sender: 'assistant',
        content: aiResponse.text,
        senderName: db.getAgentConfig().botName,
        status: 'sent'
      });

      // Envia de volta para o WhatsApp
      await this.sendTextMessage(remoteJid, aiResponse.text);

      // Se acionou transbordo, atualiza estado da conversa para notificar atendente
      if (aiResponse.triggeredHandoff) {
        db.updateConversation(conversation.id, {
          assignedMode: 'pending_handoff',
          tags: Array.from(new Set([...conversation.tags, 'Transbordo Humano'])),
          lastMessage: aiResponse.text,
          lastMessageTime: new Date().toISOString()
        });
      } else {
        db.updateConversation(conversation.id, {
          lastMessage: aiResponse.text,
          lastMessageTime: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Resposta enviada por um atendente humano pelo painel web.
   */
  public async sendHumanReply(conversationId: string, text: string, agentName: string = 'Atendente'): Promise<ChatMessage | null> {
    const conversation = db.getConversationById(conversationId);
    if (!conversation) return null;

    // Registra a mensagem
    const message = db.addMessage({
      conversationId: conversation.id,
      sender: 'human_agent',
      content: text,
      senderName: agentName,
      status: 'sent'
    });

    // Envia via WhatsApp
    await this.sendTextMessage(conversation.remoteJid, text);

    // Automaticamente assume a conversa e pausa a IA para evitar interferência
    db.updateConversation(conversation.id, {
      assignedMode: 'human',
      lastMessage: text,
      lastMessageTime: message.timestamp
    });

    return message;
  }

  /**
   * Consulta status da instância e QR Code na Evolution API
   */
  public async checkInstanceStatus(): Promise<{ connected: boolean; qrCode?: string }> {
    const settings = db.getEvolutionSettings();
    if (!settings.apiUrl || !settings.instanceName) {
      return { connected: false };
    }

    try {
      const endpoint = `${settings.apiUrl.replace(/\/+$/, '')}/instance/connectionState/${settings.instanceName}`;
      const res = await fetch(endpoint, {
        headers: { apikey: settings.apiKey || '' }
      });

      if (res.ok) {
        const data = await res.json();
        const connected = data?.instance?.state === 'open';
        db.updateEvolutionSettings({ isConnected: connected });
        return { connected };
      }
    } catch (err: any) {
      console.warn('[EvolutionService] Não foi possível conectar à Evolution API:', err?.message || err);
    }

    return { connected: db.getEvolutionSettings().isConnected };
  }
}

export const evolutionService = new EvolutionService();
