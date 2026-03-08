# 🏢 GTP Smart IA - CRM Imobiliário Inteligente

Um sistema completo de **CRM imobiliário** com inteligência artificial, organizando seu código em **Frontend React** e **Backend Python** separados e bem estruturados.

> **📌 Arquitetura:** Two-tier stack com React (frontend) + Python (automações)

---

## 🎯 Visão Rápida

```
┌────────────────────────────────────────────────────────────┐
│                    GTP Smart IA                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  📱 Frontend (React)           🐍 Backend (Python)         │
│  ├─ UI/UX                      ├─ Automações              │
│  ├─ Clientes/Leads             ├─ Jobs Agendados          │
│  ├─ Agenda & Disparos          ├─ Alertas                 │
│  ├─ Gerenciamento de Equipe    └─ Manutenção Sistema      │
│  └─ Configurações                                         │
│                                                            │
│  🔗 Ambos syncronizam via Supabase Database               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 📂 Estrutura do Projeto

```
GTP Project/
├── 📱 frontend/              # Aplicação React
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── .env.local            # Credenciais (NÃO commitar!)
│   ├── .env.example          # Template
│   └── README.md             # Instruções do Frontend
│
├── 🐍 backend/               # Motor Python de Automações
│   ├── main.py               # Entry point
│   ├── requirements.txt       # Dependências Python
│   ├── .env.local            # Credenciais (NÃO commitar!)
│   ├── .env.example          # Template
│   ├── shared/               # Módulos compartilhados
│   ├── components/           # Componentes de automação
│   └── README.md             # Instruções do Backend
│
└── Este arquivo (README.md)
```

---

## 🚀 Como Começar

### 1️⃣ Frontend (React)

```bash
# Entrar na pasta
cd frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Edite .env.local com suas credenciais do Supabase

# Iniciar servidor
npm run dev
# 🌐 Acessa em http://localhost:8080
```

👉 [Ver README do Frontend](./frontend/README.md)

---

### 2️⃣ Backend (Python)

```bash
# Entrar na pasta
cd backend

# Criar virtual environment
python -m venv venv

# Ativar (Windows)
venv\Scripts\activate
# Ativar (Linux/Mac)
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
# Edite .env.local com suas credenciais do Supabase

# Iniciar motor de automações
python main.py
```

👉 [Ver README do Backend](./backend/README.md)

---

## 🏗️ Arquitetura Detalhada

Este é um projeto **full-stack separado em duas aplicações independentes**:

```
GTP Smart IA/
├── frontend/           # React + TypeScript (SPA)
└── backend/            # Python (Automações + Jobs)
```

### 🎨 Frontend (`/frontend`)

#### Tecnologias
- **React 18** com TypeScript
- **Vite** (bundler ultrarrápido)
- **Tailwind CSS** + **shadcn/ui** (componentes)
- **React Router** (navegação)
- **React Query** (cache/estado)
- **Supabase** (autenticação + BDD)

#### Responsabilidades
- ✅ Interface do usuário interativa
- ✅ Gerenciamento de leads/clientes
- ✅ Agenda e disparos
- ✅ Autenticação via Supabase
- ✅ Consumir APIs do backend

#### Estrutura
```
frontend/
├── src/
│   ├── components/      # Componentes React reutilizáveis
│   ├── pages/          # Páginas principais
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilitários e conexões (Supabase, etc)
│   ├── utils/          # Funções auxiliares
│   ├── App.tsx         # Root component
│   └── main.tsx        # Entry point
├── package.json
├── vite.config.ts
├── .env.local          # Variáveis locais (NÃO commitar!)
├── .env.example        # Template para .env.local
└── README.md
```

### 🐍 Backend (`/backend`)

#### Tecnologias
- **Python 3.9+**
- **APScheduler** (jobs agendados)
- **Supabase Admin SDK** (BDD)
- **Python-dotenv** (variáveis de ambiente)

#### Responsabilidades
- ✅ Automações agendadas (disparos, verificações)
- ✅ Gerenciamento de corretores/brokers
- ✅ Gestão de clientes estagnados
- ✅ Alertas de erro
- ✅ Manutenção do sistema

#### Estrutura
```
backend/
├── main.py                      # Entry point do motor
├── requirements.txt             # Dependências Python
├── .env.local                   # Variáveis locais
├── .env.example                 # Template para .env.local
├── automation.log              # Logs de execução
├── shared/
│   └── python/
│       ├── config.py           # Configurações globais
│       ├── database.py         # Conexão Supabase
│       └── system_maintenance.py
├── components/
│   ├── GestaoCorretores/
│   │   └── python/
│   │       └── broker_manager.py
│   ├── GestaoEstagnados/
│   │   └── python/
│   │       └── stalled_clients_manager.py
│   ├── DisparadorMensagens/
│   │   └── python/
│   │       └── message_dispatcher.py
│   └── AlertasErro/
│       └── python/
│           └── error_alerts.py
└── README.md
```

### 🔗 Integração Frontend ↔ Backend

#### Fluxo de Dados
```
┌──────────────────────┐
│   Frontend React     │
│  (http://localhost)  │
├──────────────────────┤
│ ✅ UI Components     │
│ ✅ User Interactions │
│ ✅ Supabase Auth     │
└──────────┬───────────┘
           │
           │ HTTP/REST API (futuro)
           │ ou direto Supabase
           ▼
┌──────────────────────┐
│  Supabase Backend    │
│  (Database)          │
├──────────────────────┤
│ ✅ Users             │
│ ✅ Clients/Leads     │
│ ✅ Properties        │
│ ✅ Automations       │
└──────────┬───────────┘
           │
           │ Reads/Writes
           │
┌──────────▼───────────┐
│  Python Engine       │
│  (Automações)        │
├──────────────────────┤
│ ✅ APScheduler Jobs  │
│ ✅ Message Dispatch  │
│ ✅ Broker Mgmt       │
│ ✅ Error Alerts      │
└──────────────────────┘
```

---

## 🔐 Variáveis de Ambiente

### Frontend (`frontend/.env.local`)
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_sua-chave-publica
```

### Backend (`backend/.env.local`)
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SECRET_KEY=sb_secret_sua-chave-privada
```

⚠️ **IMPORTANTE:** Nunca commite arquivos `.env.local` no Git!

---

## 📦 Scripts Úteis

### Frontend
```bash
npm run dev         # Dev server
npm run build       # Build produção
npm run lint        # ESLint
npm run test        # Vitest uma vez
npm run test:watch  # Vitest em watch
```

### Backend
```bash
python main.py      # Rodar engine
python -m pytest    # Testes (quando implementado)
```

---

## 🚀 Deploy

### Frontend
- **Vercel** (recomendado para Vite/React)
- **Netlify**
- **GitHub Pages**

### Backend
- **Railway**
- **Render**
- **Heroku** (com APScheduler)

👉 [Ver README do Backend](./src/pages/Desenvolvedor/MotorPython/README.md)

---

## 🔑 Configuração Supabase

### Obter Credenciais

1. Acesse [supabase.com](https://supabase.com)
2. Selecione seu projeto
3. Vá em **Settings → API**

### Frontend (.env.local)
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...  # Chave PÚBLICA
```

### Backend (.env.local)
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...  # Chave SECRETA
```

⚠️ **IMPORTANTE:**
- Frontend usa chave **ANON** (pública)
- Backend usa chave **SECRET** (privada)
- Nunca comitar `.env.local` no Git!

---

## 📊 Tecnologias

### Frontend
- ⚛️ React 18 + TypeScript
- ⚡ Vite (bundler rápido)
- 🎨 Tailwind CSS + shadcn/ui
- 🔄 React Query
- 🔐 Supabase Auth

### Backend
- 🐍 Python 3.9+
- ⏰ APScheduler (jobs agendados)
- 🔗 Supabase SDK
- 📝 Logging com rotação
- 🌍 python-dotenv

---

## 🎯 Principais Funcionalidades

✅ **Gerenciamento de Clientes** - CRM completo para leads  
✅ **Agenda Inteligente** - Planejamento de reuniões e follow-ups  
✅ **Disparos Automáticos** - WhatsApp, Email e SMS  
✅ **Gestão de Equipe** - Distribuição de clientes entre corretores  
✅ **Imóveis** - Catálogo e gerenciamento de propriedades  
✅ **Alertas** - Notificações em tempo real  
✅ **Automações** - Jobs agendados inteligentes  
✅ **Relatórios** - Dashboard com métricas chave  

---

## 📖 Documentação

| Documento | Descrição |
|-----------|-----------|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Arquitetura completa do projeto |
| **[README.md](./README.md)** | Instruções do Frontend |
| **[Backend README](./src/pages/Desenvolvedor/MotorPython/README.md)** | Instruções do Backend |
| **[.env.example](./.env.example)** | Template Frontend |
| **[Backend .env.example](./src/pages/Desenvolvedor/MotorPython/.env.example)** | Template Backend |

---

## 💡 Dicas

### Desenvolvimento Local
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd src/pages/Desenvolvedor/MotorPython
python main.py
```

### Verificar Logs
```bash
# Backend logs em tempo real
tail -f src/pages/Desenvolvedor/MotorPython/automation.log

# Frontend - Abrir DevTools (F12)
```

### Problemas Comuns

#### Tela Branca no Frontend
- Verifique `.env.local` com credenciais Supabase
- Abra DevTools (F12) → Console para ver erros

#### Backend não connect ao Supabase
- Confirme que `.env.local` existe no backend
- Verifique que está usando a chave **SECRET**, não a ANON

#### Módulos Python não encontrados
```bash
source venv/bin/activate  # ou venv\Scripts\activate
pip install -r requirements.txt
```

---

## 🚀 Próximos Passos

- [ ] Implementar testes automáticos
- [ ] Criar API REST para ambos
- [ ] Dockerizar as aplicações
- [ ] Setup de CI/CD com GitHub Actions
- [ ] Deploy em produção (Vercel + Railway)
- [ ] Monitoramento e alertas

---

## 📞 Suporte

Dúvidas? Consulte:
- 📖 [ARCHITECTURE.md](./ARCHITECTURE.md) - Entender a estrutura
- 🔧 [Frontend README](./README.md) - Problemas com React
- 🐍 [Backend README](./src/pages/Desenvolvedor/MotorPython/README.md) - Problemas com Python
- 📚 [Supabase Docs](https://supabase.com/docs)

---

## 📝 Licença

© 2025 GTP Smart IA. Todos os direitos reservados.

---

**Boa sorte! 🚀**
