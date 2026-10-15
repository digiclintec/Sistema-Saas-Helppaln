import React, { useState, useEffect } from 'react';
import { Bot, Save, Sparkles, Key, Users, Clock, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import { AgentConfig } from '../types';

export const AgentConfigView: React.FC = () => {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await api.getAgentConfig();
      setConfig(data);
    } catch (err: any) {
      setMessage({ text: 'Erro ao carregar configurações do agente.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    try {
      setSaving(true);
      const updated = await api.updateAgentConfig(config);
      setConfig(updated);
      setMessage({ text: 'Configurações do Agente de IA salvas com sucesso!', type: 'success' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ text: 'Erro ao salvar configurações.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = () => {
    if (!config || !newKeyword.trim()) return;
    const clean = newKeyword.trim().toLowerCase();
    if (!config.handoffKeywords.includes(clean)) {
      setConfig({
        ...config,
        handoffKeywords: [...config.handoffKeywords, clean]
      });
    }
    setNewKeyword('');
  };

  const removeKeyword = (kwToRemove: string) => {
    if (!config) return;
    setConfig({
      ...config,
      handoffKeywords: config.handoffKeywords.filter(k => k !== kwToRemove)
    });
  };

  if (loading || !config) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        Carregando configurações do Agente de IA...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {message && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${message.type === 'success' ? '#10B981' : '#EF4444'}`,
          color: message.type === 'success' ? '#34D399' : '#F87171',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.9rem'
        }}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Identidade e Persona */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Bot size={20} color="var(--primary-bright)" />
              Identidade & Persona do Agente
            </div>
            <div className="card-subtitle">Defina o nome, a empresa e como o robô deve se comportar perante os clientes.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Status do Robô:</span>
            <button
              type="button"
              onClick={() => setConfig({ ...config, status: config.status === 'active' ? 'paused' : 'active' })}
              className={`badge ${config.status === 'active' ? 'badge-ai' : 'badge-handoff'}`}
              style={{ cursor: 'pointer', border: 'none', padding: '6px 14px' }}
            >
              ● {config.status === 'active' ? 'Ativo (Respondendo)' : 'Pausado'}
            </button>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Nome do Assistente Virtual</label>
            <input
              type="text"
              className="form-input"
              value={config.botName}
              onChange={e => setConfig({ ...config, botName: e.target.value })}
              placeholder="Ex: HelpZap IA, Assistente Virtual"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nome da Sua Empresa / Marca</label>
            <input
              type="text"
              className="form-input"
              value={config.businessName}
              onChange={e => setConfig({ ...config, businessName: e.target.value })}
              placeholder="Ex: HelpPaln Soluções"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Breve Descrição do Negócio</label>
          <input
            type="text"
            className="form-input"
            value={config.businessDescription}
            onChange={e => setConfig({ ...config, businessDescription: e.target.value })}
            placeholder="Ex: Clínica odontológica especializada em implantes e estética dental em SP."
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Tom de Voz</label>
            <select
              className="form-select"
              value={config.personalityTone}
              onChange={e => setConfig({ ...config, personalityTone: e.target.value as any })}
            >
              <option value="consultivo">Consultivo (Ouve, entende o cenário e sugere)</option>
              <option value="amigavel">Amigável & Caloroso (Emojis simpáticos e tom acolhedor)</option>
              <option value="vendedor">Comercial / Vendedor (Focado em fechar negócios)</option>
              <option value="formal">Formal & Executivo (Polido e sóbrio)</option>
              <option value="tecnico">Técnico & Preciso (Direto ao ponto)</option>
              <option value="personalizado">Personalizado (Segue as instruções livres)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Modelo de IA (OpenAI)</label>
            <select
              className="form-select"
              value={config.openaiModel}
              onChange={e => setConfig({ ...config, openaiModel: e.target.value })}
            >
              <option value="gpt-4o-mini">GPT-4o Mini (Recomendado - Ultra rápido e econômico)</option>
              <option value="gpt-4o">GPT-4o (Máxima inteligência e raciocínio complexo)</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Chave de API OpenAI (Opcional - usa chave do servidor se vazia)</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showApiKey ? 'text' : 'password'}
              className="form-input"
              style={{ width: '100%', paddingRight: '45px' }}
              value={config.openaiApiKey || ''}
              onChange={e => setConfig({ ...config, openaiApiKey: e.target.value })}
              placeholder="sk-proj-..."
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer'
              }}
            >
              {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Caso não queira usar a OpenAI, o sistema possui um motor heurístico local baseado na Base de Conhecimento.
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">
            <Sparkles size={16} color="var(--primary-bright)" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Instruções Específicas / Prompt do Negócio
          </label>
          <textarea
            className="form-textarea"
            rows={5}
            value={config.customInstructions}
            onChange={e => setConfig({ ...config, customInstructions: e.target.value })}
            placeholder="Ex: Nunca dê descontos maiores que 10%. Peça sempre o nome completo do cliente ao iniciar o contato..."
          />
        </div>
      </div>

      {/* Regras de Transbordo Humano */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Users size={20} color="var(--status-handoff)" />
              Transbordo Humano Inteligente
            </div>
            <div className="card-subtitle">
              Quando o cliente solicitar ou o robô identificar necessidade, a conversa é repassada para um atendente humano.
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Palavras-chave que disparam a transferência imediata</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              className="form-input"
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addKeyword();
                }
              }}
              placeholder="Digite uma palavra ou frase (ex: atendente, cancelar, falar com gerente) e pressione Enter"
            />
            <button type="button" onClick={addKeyword} className="btn btn-secondary">
              Adicionar
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {config.handoffKeywords.map(kw => (
              <span key={kw} className="tag-pill" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                {kw}
                <button
                  type="button"
                  onClick={() => removeKeyword(kw)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FBBF24',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    marginLeft: '4px'
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Mensagem enviada ao transferir para atendimento humano</label>
          <textarea
            className="form-textarea"
            rows={3}
            value={config.handoffMessage}
            onChange={e => setConfig({ ...config, handoffMessage: e.target.value })}
            placeholder="Ex: Entendido! Estou transferindo seu atendimento para a nossa equipe agora mesmo..."
            required
          />
        </div>
      </div>

      {/* Botão de Salvar Flutuante/Fixo */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
        <button type="submit" disabled={saving} className="btn btn-primary" style={{ minWidth: '180px' }}>
          <Save size={18} />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
};
