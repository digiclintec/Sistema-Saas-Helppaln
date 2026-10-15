import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Trash2, Edit2, CheckCircle, Tag, HelpCircle, X } from 'lucide-react';
import { api } from '../services/api';
import { KnowledgeItem } from '../types';

export const KnowledgeBaseView: React.FC = () => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);

  // Form State
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState<KnowledgeItem['category']>('geral');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await api.getKnowledgeBase();
      setItems(data);
    } catch (err) {
      showToast('Erro ao carregar base de conhecimento.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const openNewModal = () => {
    setEditingItem(null);
    setQuestion('');
    setAnswer('');
    setCategory('geral');
    setKeywords([]);
    setKeywordInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: KnowledgeItem) => {
    setEditingItem(item);
    setQuestion(item.question);
    setAnswer(item.answer);
    setCategory(item.category);
    setKeywords(item.keywords || []);
    setKeywordInput('');
    setIsModalOpen(true);
  };

  const handleAddKeyword = () => {
    if (!keywordInput.trim()) return;
    const clean = keywordInput.trim().toLowerCase();
    if (!keywords.includes(clean)) {
      setKeywords([...keywords, clean]);
    }
    setKeywordInput('');
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    try {
      if (editingItem) {
        const updated = await api.updateKnowledgeItem(editingItem.id, {
          question,
          answer,
          category,
          keywords
        });
        setItems(items.map(i => (i.id === editingItem.id ? updated : i)));
        showToast('Item atualizado com sucesso!');
      } else {
        const created = await api.addKnowledgeItem({
          question,
          answer,
          category,
          keywords
        });
        setItems([created, ...items]);
        showToast('Nova pergunta adicionada à Base de Conhecimento!');
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast('Erro ao salvar item.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta resposta da IA?')) return;
    try {
      await api.deleteKnowledgeItem(id);
      setItems(items.filter(i => i.id !== id));
      showToast('Item excluído da base.');
    } catch (err) {
      showToast('Erro ao excluir item.');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'todos' || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase()) ||
      item.keywords.some(k => k.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories: { key: string; label: string }[] = [
    { key: 'todos', label: 'Todas as Categorias' },
    { key: 'geral', label: 'Geral & Sobre' },
    { key: 'precos', label: 'Planos & Preços' },
    { key: 'servicos', label: 'Serviços & Produtos' },
    { key: 'pagamentos', label: 'Formas de Pagamento' },
    { key: 'horarios', label: 'Horários & Endereço' },
    { key: 'duvidas', label: 'Dúvidas Frequentes' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {toast && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10B981',
          color: '#34D399',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.88rem'
        }}>
          <CheckCircle size={18} />
          {toast}
        </div>
      )}

      {/* Header com Busca e Botão Adicionar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: '1', minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', paddingLeft: '42px' }}
              placeholder="Buscar pergunta, resposta ou palavra-chave..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <button type="button" onClick={openNewModal} className="btn btn-primary">
          <Plus size={18} />
          Adicionar Informação / FAQ
        </button>
      </div>

      {/* Filtros de Categorias */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
        {categories.map(cat => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setSelectedCategory(cat.key)}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-xl)',
              background: selectedCategory === cat.key ? 'var(--primary-emerald)' : 'var(--bg-subtle)',
              color: selectedCategory === cat.key ? '#FFFFFF' : 'var(--text-muted)',
              border: selectedCategory === cat.key ? 'none' : '1px solid var(--border-light)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Lista de Cards da Base de Conhecimento */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)' }}>Carregando dados da IA...</div>
      ) : filteredItems.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-dim)' }}>
          <BookOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <h3 style={{ color: 'var(--text-main)', marginBottom: '6px' }}>Nenhuma resposta encontrada</h3>
          <p style={{ fontSize: '0.85rem' }}>Cadastre perguntas e respostas frequentes para treinar o seu Agente de IA.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredItems.map(item => (
            <div key={item.id} className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-ai" style={{ fontSize: '0.7rem' }}>
                    {item.category.toUpperCase()}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {item.question}
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    title="Editar"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="btn btn-danger"
                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    title="Excluir"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div style={{
                background: 'var(--bg-subtle)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                color: '#E2E8F0',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
                border: '1px solid var(--border-light)',
                marginBottom: '12px'
              }}>
                {item.answer}
              </div>

              {item.keywords && item.keywords.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Tag size={12} /> Palavras-chave:
                  </span>
                  {item.keywords.map(kw => (
                    <span key={kw} className="tag-pill" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Adicionar / Editar */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {editingItem ? 'Editar Informação da IA' : 'Nova Resposta para a IA'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Categoria</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                >
                  <option value="geral">Geral & Sobre</option>
                  <option value="precos">Planos & Preços</option>
                  <option value="servicos">Serviços & Produtos</option>
                  <option value="pagamentos">Formas de Pagamento</option>
                  <option value="horarios">Horários & Localização</option>
                  <option value="duvidas">Dúvidas Gerais</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Pergunta ou Tema da Dúvida</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Qual o valor do plano Pro? Como funciona o agendamento?"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Resposta Oficial da Empresa (Usada pela IA no WhatsApp)</label>
                <textarea
                  className="form-textarea"
                  rows={5}
                  placeholder="Instruções claras e diretas. Pode usar *negrito* para destacar palavras no WhatsApp."
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Palavras-chave de Reconhecimento</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: preco, quanto custa, valor"
                    value={keywordInput}
                    onChange={e => setKeywordInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyword();
                      }
                    }}
                  />
                  <button type="button" onClick={handleAddKeyword} className="btn btn-secondary">
                    Adicionar
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {keywords.map(kw => (
                    <span key={kw} className="tag-pill">
                      {kw}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '4px' }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Salvar Alterações' : 'Cadastrar Resposta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
