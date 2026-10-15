import { Router, Request, Response } from 'express';
import { db } from '../storage/db.js';
import { agentService } from '../modules/ai/agentService.js';
import { evolutionService } from '../modules/evolution/evolutionService.js';
import { DashboardStats } from '../types/index.js';

export const apiRouter = Router();

// ==========================================
// 1. CONFIGURAÇÃO DO AGENTE DE IA
// ==========================================
apiRouter.get('/agent', (req: Request, res: Response) => {
  const config = db.getAgentConfig();
  res.json({ success: true, data: config });
});

apiRouter.put('/agent', (req: Request, res: Response) => {
  const updated = db.updateAgentConfig(req.body);
  res.json({ success: true, data: updated, message: 'Configurações do Agente de IA salvas com sucesso!' });
});

// ==========================================
// 2. BASE DE CONHECIMENTO (FAQ)
// ==========================================
apiRouter.get('/knowledge', (req: Request, res: Response) => {
  const items = db.getKnowledgeBase();
  res.json({ success: true, data: items });
});

apiRouter.post('/knowledge', (req: Request, res: Response) => {
  const { question, answer, category, keywords } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ success: false, error: 'Pergunta e resposta são obrigatórias.' });
  }

  const created = db.addKnowledgeItem({
    question,
    answer,
    category: category || 'geral',
    keywords: Array.isArray(keywords) ? keywords : []
  });

  res.status(201).json({ success: true, data: created, message: 'Item adicionado à Base de Conhecimento!' });
});

apiRouter.put('/knowledge/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = db.updateKnowledgeItem(id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Item não encontrado.' });
  }
  res.json({ success: true, data: updated, message: 'Item atualizado com sucesso!' });
});

apiRouter.delete('/knowledge/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteKnowledgeItem(id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Item não encontrado.' });
  }
  res.json({ success: true, message: 'Item removido da Base de Conhecimento.' });
});

// ==========================================
// 3. SIMULADOR / PLAYGROUND DE IA
// ==========================================
apiRouter.post('/ai/playground', async (req: Request, res: Response) => {
  const { message, history } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, error: 'A mensagem é obrigatória para o teste.' });
  }

  try {
    const result = await agentService.generateResponse('playground', message, history || []);
    res.json({
      success: true,
      data: {
        reply: result.text,
        triggeredHandoff: result.triggeredHandoff,
        source: result.source,
        modelUsed: result.modelUsed
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Erro ao simular resposta.' });
  }
});

// ==========================================
// 4. CONVERSAS & CHAT (WHATSAPP INBOX)
// ==========================================
apiRouter.get('/conversations', (req: Request, res: Response) => {
  const conversations = db.getConversations();
  res.json({ success: true, data: conversations });
});

apiRouter.get('/conversations/:id/messages', (req: Request, res: Response) => {
  const { id } = req.params;
  const messages = db.getMessages(id);
  res.json({ success: true, data: messages });
});

apiRouter.post('/conversations/:id/messages', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { text, agentName } = req.body;

  if (!text) {
    return res.status(400).json({ success: false, error: 'Texto da mensagem é obrigatório.' });
  }

  const message = await evolutionService.sendHumanReply(id, text, agentName || 'Atendente');
  if (!message) {
    return res.status(404).json({ success: false, error: 'Conversa não encontrada.' });
  }

  res.status(201).json({ success: true, data: message });
});

apiRouter.put('/conversations/:id/mode', (req: Request, res: Response) => {
  const { id } = req.params;
  const { mode } = req.body; // 'ai' | 'human' | 'pending_handoff'

  const updated = db.updateConversation(id, { assignedMode: mode });
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Conversa não encontrada.' });
  }

  res.json({
    success: true,
    data: updated,
    message: mode === 'ai' ? 'IA ativada para esta conversa!' : 'Atendimento assumido por humano.'
  });
});

apiRouter.put('/conversations/:id/stage', (req: Request, res: Response) => {
  const { id } = req.params;
  const { stage } = req.body;

  const updated = db.updateConversation(id, { crmStage: stage });
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Conversa não encontrada.' });
  }

  res.json({ success: true, data: updated, message: 'Etapa do CRM atualizada!' });
});

// ==========================================
// 5. INTEGRAÇÃO EVOLUTION API
// ==========================================
apiRouter.get('/evolution/settings', (req: Request, res: Response) => {
  const settings = db.getEvolutionSettings();
  res.json({ success: true, data: settings });
});

apiRouter.put('/evolution/settings', (req: Request, res: Response) => {
  const updated = db.updateEvolutionSettings(req.body);
  res.json({ success: true, data: updated, message: 'Configurações da Evolution API salvas!' });
});

apiRouter.get('/evolution/status', async (req: Request, res: Response) => {
  const status = await evolutionService.checkInstanceStatus();
  const settings = db.getEvolutionSettings();
  res.json({ success: true, data: { ...settings, ...status } });
});

// Endpoint de webhook para a Evolution API
apiRouter.post('/webhook/evolution', async (req: Request, res: Response) => {
  try {
    await evolutionService.handleWebhook(req.body);
    res.json({ status: 'received' });
  } catch (err: any) {
    console.error('[Webhook] Erro no processamento:', err);
    res.status(500).json({ status: 'error', error: err?.message });
  }
});

// ==========================================
// 6. DASHBOARD & MÉTRICAS
// ==========================================
apiRouter.get('/dashboard/stats', (req: Request, res: Response) => {
  const conversations = db.getConversations();
  const knowledgeBase = db.getKnowledgeBase();

  const activeAiConversations = conversations.filter(c => c.assignedMode === 'ai').length;
  const pendingHandoffs = conversations.filter(c => c.assignedMode === 'pending_handoff').length;
  
  const totalConversations = conversations.length;
  const aiResolvedEstimate = totalConversations > 0 
    ? Math.round(((totalConversations - pendingHandoffs) / totalConversations) * 100) 
    : 100;

  const stats: DashboardStats = {
    totalConversations,
    activeAiConversations,
    pendingHandoffs,
    totalMessagesToday: 28,
    aiResolutionRate: aiResolvedEstimate,
    faqItemsCount: knowledgeBase.length
  };

  res.json({ success: true, data: stats });
});
