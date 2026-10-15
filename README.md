# HelpPaln — SaaS WhatsApp CRM com IA

Sistema SaaS multi-atendente de CRM com Inteligência Artificial integrado ao WhatsApp através da **Evolution API**, construído com código próprio em Node.js (TypeScript) e React (Vite).

---

## 🚀 Principais Módulos

1. **Agente de IA Configurável**:
   - Persona customizável (Nome do Bot, Nome da Empresa, Descrição do Negócio).
   - Tom de voz (Consultivo, Amigável, Comercial, Formal, Técnico, Personalizado).
   - Suporte a modelos OpenAI (`gpt-4o-mini`, `gpt-4o`, `gpt-3.5-turbo`) com motor heurístico local de fallback.
   - **Gatilhos de Transbordo Humano Inteligente**: detecção de palavras-chave ("humano", "atendente", "falar com pessoa") e transferência automática para operadores.

2. **Base de Conhecimento (FAQ / RAG)**:
   - Cadastro estruturado de informações, preços, serviços, horários e formas de pagamento.
   - Palavras-chave para correspondência direta e injeção contextual no prompt da IA.

3. **Simulador / Playground de Testes**:
   - Chat interativo estilo WhatsApp Web para testar o comportamento do assistente em tempo real.
   - Exibição de metadados de cada resposta (se acionou transbordo, modelo usado e fonte).

4. **Inbox WhatsApp Multi-Atendente**:
   - Visualização de conversas ao vivo.
   - Filtros por status: *Todos*, *⚠️ Transbordo Humano*, *🤖 Robô IA*, *👤 Atendente Humano*.
   - Botão para **Assumir Conversa (Pausar IA)** ou **Devolver para a IA** com 1 clique.
   - Envio de mensagens em tempo real para o WhatsApp do cliente.

5. **Funil de Vendas CRM (Kanban)**:
   - Gestão visual de oportunidades em colunas: *Novos Contatos*, *Em Atendimento*, *Qualificados*, *Proposta Enviada*, *Fechados / Clientes*.
   - Avanço de etapa com 1 clique e acesso direto à conversa.

6. **Conexão WhatsApp (Evolution API)**:
   - Integração com a **Evolution API** (v2.x).
   - Leitura de QR Code, verificação de status e webhook automático (`/api/webhook/evolution`).

---

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js, TypeScript, Express, OpenAI SDK, CORS, Dotenv, tsx.
- **Frontend**: React 19, TypeScript, Vite, Lucide Icons, Vanilla CSS com Design System moderno.
- **WhatsApp Gateway**: [Evolution API](https://evolution-api.com/).

---

## 📦 Como Executar o Projeto

### 1. Instalar as dependências
```bash
npm run install:all
```

### 2. Rodar em modo de desenvolvimento (Backend + Frontend)
```bash
npm run dev
```

* **Frontend**: `http://localhost:5173`
* **Backend API**: `http://localhost:3333`
* **Webhook Evolution**: `http://localhost:3333/api/webhook/evolution`

---

## 🐳 Executar a Evolution API Localmente (Docker)

Caso queira rodar sua própria instância da Evolution API localmente:

```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua_chave_secreta_aqui \
  atendai/evolution-api:v2.2.0
```
Cole a URL `http://localhost:8080` e a API Key no menu **Conexão WhatsApp** do painel HelpPaln.
