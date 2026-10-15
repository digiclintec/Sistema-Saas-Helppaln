import React, { useState, useEffect } from 'react';
import { QrCode, CheckCircle2, AlertCircle, Copy, RefreshCw, Save, Smartphone, ExternalLink, Shield } from 'lucide-react';
import { api } from '../services/api';
import { EvolutionSettings } from '../types';

export const EvolutionConfigView: React.FC = () => {
  const [settings, setSettings] = useState<EvolutionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getEvolutionSettings();
      setSettings(data);
    } catch (err) {
      setToast({ text: 'Erro ao carregar configurações da Evolution API.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      const updated = await api.updateEvolutionSettings(settings);
      setSettings(updated);
      setToast({ text: 'Configurações da Evolution API salvas!', type: 'success' });
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      setToast({ text: 'Erro ao salvar configurações.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const checkStatus = async () => {
    try {
      setChecking(true);
      const status = await api.getEvolutionStatus();
      setSettings(status);
      if (status.isConnected) {
        setToast({ text: 'WhatsApp conectado com sucesso!', type: 'success' });
      } else {
        setToast({ text: 'Instância desconectada ou aguardando QR Code.', type: 'error' });
      }
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      setToast({ text: 'Não foi possível conectar à Evolution API.', type: 'error' });
    } finally {
      setChecking(false);
    }
  };

  const copyWebhook = () => {
    if (!settings) return;
    navigator.clipboard.writeText(settings.webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading || !settings) {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>Carregando dados da Evolution API...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {toast && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${toast.type === 'success' ? '#10B981' : '#EF4444'}`,
          color: toast.type === 'success' ? '#34D399' : '#F87171',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.88rem'
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.text}
        </div>
      )}

      {/* Card de Status da Conexão */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-card), var(--bg-subtle))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-md)',
              background: settings.isConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${settings.isConnected ? '#10B981' : '#EF4444'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: settings.isConnected ? '#34D399' : '#F87171'
            }}>
              <Smartphone size={28} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  WhatsApp Evolution API
                </h3>
                <span className={`badge ${settings.isConnected ? 'badge-ai' : 'badge-handoff'}`}>
                  ● {settings.isConnected ? 'Conectado & Online' : 'Desconectado'}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Instância ativa: <strong>{settings.instanceName}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={checkStatus}
              disabled={checking}
              className="btn btn-secondary"
            >
              <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
              {checking ? 'Verificando...' : 'Verificar Status'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Formulário de Configuração */}
        <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-header">
            <div>
              <div className="card-title">
                <Shield size={18} color="var(--primary-bright)" />
                Parâmetros do Servidor Evolution
              </div>
              <div className="card-subtitle">Endereço e chave de autenticação da Evolution API</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">URL da Evolution API</label>
            <input
              type="text"
              className="form-input"
              value={settings.apiUrl}
              onChange={e => setSettings({ ...settings, apiUrl: e.target.value })}
              placeholder="Ex: http://localhost:8080 ou https://evolution.suaempresa.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">API Key Global (Global Token)</label>
            <input
              type="password"
              className="form-input"
              value={settings.apiKey}
              onChange={e => setSettings({ ...settings, apiKey: e.target.value })}
              placeholder="Sua chave apikey da Evolution API"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nome da Instância</label>
            <input
              type="text"
              className="form-input"
              value={settings.instanceName}
              onChange={e => setSettings({ ...settings, instanceName: e.target.value })}
              placeholder="Ex: helppaln_bot"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">URL do Webhook do Sistema (Cole na Evolution API)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                readOnly
                className="form-input"
                style={{ flex: 1, color: 'var(--primary-bright)', fontFamily: 'monospace', fontSize: '0.82rem' }}
                value={settings.webhookUrl}
              />
              <button
                type="button"
                onClick={copyWebhook}
                className="btn btn-secondary"
                title="Copiar URL"
              >
                {copied ? <CheckCircle2 size={16} color="#34D399" /> : <Copy size={16} />}
              </button>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Ative os eventos: <code>MESSAGES_UPSERT</code>, <code>CONNECTION_UPDATE</code> e <code>QRCODE_UPDATED</code>.
            </span>
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </form>

        {/* QR Code & Guia de Conexão */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <div className="card-title">
                <QrCode size={18} color="var(--primary-bright)" />
                Conectar Aparelho (QR Code)
              </div>
              <div className="card-subtitle">Escaneie com o WhatsApp do seu celular</div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
            {settings.isConnected ? (
              <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                <CheckCircle2 size={54} color="#34D399" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '6px' }}>Instância Conectada</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  O sistema está recebendo e enviando mensagens normalmente pelo WhatsApp.
                </p>
              </div>
            ) : settings.qrCodeBase64 ? (
              <div style={{ textAlign: 'center' }}>
                <img
                  src={settings.qrCodeBase64.startsWith('data:') ? settings.qrCodeBase64 : `data:image/png;base64,${settings.qrCodeBase64}`}
                  alt="WhatsApp QR Code"
                  style={{ width: '220px', height: '220px', borderRadius: 'var(--radius-md)', background: 'white', padding: '10px' }}
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '10px' }}>
                  Abra o WhatsApp &gt; Aparelhos conectados &gt; Conectar um aparelho
                </p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-dim)' }}>
                <QrCode size={54} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <h4 style={{ color: 'var(--text-main)', fontSize: '1rem', marginBottom: '6px' }}>
                  Pronto para Gerar QR Code
                </h4>
                <p style={{ fontSize: '0.82rem', marginBottom: '16px' }}>
                  Certifique-se de que sua Evolution API esteja em execução e clique abaixo para sincronizar.
                </p>
                <button type="button" onClick={checkStatus} className="btn btn-secondary">
                  <RefreshCw size={14} />
                  Obter QR Code
                </button>
              </div>
            )}
          </div>

          <div style={{
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            border: '1px solid var(--border-light)'
          }}>
            <strong>💡 Dica:</strong> A Evolution API é 100% open-source e pode ser executada facilmente com um único comando Docker:
            <code style={{ display: 'block', margin: '6px 0', padding: '6px 8px', background: 'var(--bg-input)', borderRadius: '4px', color: 'var(--primary-bright)' }}>
              docker run -d -p 8080:8080 atendai/evolution-api:v2.2.0
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
