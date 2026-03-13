# 🐍 GTP Smart IA - Backend Python (Automações)

Motor de automações inteligente para o CRM - Aplicação Backend.

> **📌 Nota:** Este é o **Backend** do projeto. Para a arquitetura completa, veja [../../ARCHITECTURE.md](../../ARCHITECTURE.md)

## 🚀 Quick Start

```bash
# 1. Criar virtual environment
python -m venv venv

# 2. Ativar virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 3. Instalar dependências
pip install -r requirements.txt

# 4. Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais Supabase

# 5. Iniciar o motor
python main.py
```

---

## 📋 Tecnologias

- **Python 3.9+** - Linguagem
- **APScheduler** - Agendamento de tarefas
- **Supabase** - Cliente do banco de dados
- **python-dotenv** - Variáveis de ambiente
- **Logging** - Sistema de logs com rotação

---

## 📁 Estrutura

```
├── main.py                           # Entry point do motor
├── requirements.txt                  # Dependências Python
├── .env.local                        # Variáveis de ambiente (NÃO commitar)
├── .env.example                      # Template para .env.local
├── automation.log                    # Log de execução
│
├── shared/
│   └── python/
│       ├── config.py                 # Configurações globais
│       ├── database.py               # Conexão com Supabase
│       └── system_maintenance.py     # Manutenção do sistema
│
└── components/
    ├── GestaoCorretores/
    │   └── python/
    │       └── broker_manager.py      # Gerenciamento de corretores
    ├── GestaoEstagnados/
    │   └── python/
    │       └── stalled_clients_manager.py  # Gestão de clientes estagnados
    ├── DisparadorMensagens/
    │   └── python/
    │       └── message_dispatcher.py   # Disparo de mensagens
    └── AlertasErro/
        └── python/
            └── error_alerts.py         # Sistema de alertas de erro
```

---

## 🔑 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do backend:

```env
# Supabase Admin (Backend)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SECRET_KEY=sb_secret_sua-chave-secreta-aqui
```

⚠️ **IMPORTANTE:** 
- **NUNCA commite `.env.local`** no Git
- A chave secreta (secret key) é **apenas para backend**
- Use `.env.example` como template

---

## 🎯 Funcionalidades

### ✅ Jobs Agendados
- **Gerenciamento de Corretores**: Distribuição e atualização de status
- **Gestão de Clientes Estagnados**: Monitoramento e redistribuição automática
- **Disparador de Mensagens**: Envio automático de mensagens
- **Alertas de Erro**: Notificação de falhas no sistema
- **Manutenção do Sistema**: Limpeza e otimização de dados

### ⚙️ Scheduler
- APScheduler com jobs em background
- Sincronização de intervalos do banco de dados
- Hot-reload de configurações sem restart
- Detecção automática de transições de status

---

## 📊 Request/Response Flow

```
┌─────────────────────────────┐
│   APScheduler (Background)  │
│   - Triggers jobs           │
│   - Lê configurações (DB)   │
│   - Ajusta intervalos       │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│   GestaoCorretores          │
│   - Distribui leads         │
│   - Atualiza status         │
│   - Log no Supabase         │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│   DisparadorMensagens       │
│   - Envia WhatsApp/Email    │
│   - Rastreia entregas       │
│   - Log de disparo          │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│   Supabase Database         │
│   - Grava eventos           │
│   - Atualiza estatísticas   │
│   - Archiva históricos      │
└─────────────────────────────┘
```

---

## 🏃 Rodando o Motor

### Modo Normal
```bash
python main.py
```

### Com Logs Detalhados
```bash
python main.py --log-level DEBUG
```

### Testar Configuração
```bash
python -c "from shared.python import database; print(database.supabase.auth.get_session())"
```

---

## 🧪 Testes (Coming Soon)

```bash
# Quando implementado:
python -m pytest
python -m pytest -v          # Verbose
python -m pytest --cov       # Com coverage
```

---

## 📝 Logging

Todas as execuções são registradas em:
- **Console** (stdout em tempo real)
- **automation.log** (arquivo com rotação automática)

Formato:
```
2026-03-08 14:23:45,123 - PythonEngine - INFO - [TRIGGER] [14:23:45] Job [message_dispatch] DISPARADO
2026-03-08 14:23:46,456 - PythonEngine - INFO - [SUCCESS] [14:23:46] Job [message_dispatch] FINALIZADO
```

---

## 🔧 Configuração de Intervalos

Os jobs rodam com base em intervalos configuráveis no Supabase:

| Job | Campo DB | Padrão | Mín |
|-----|----------|--------|-----|
| `broker_management` | `broker_management.interval_minutes` | 1 min | 1 min |
| `stalled_clients_distribution` | `stalled_clients_dist.interval_minutes` | 1 min | 1 min |
| `message_dispatch` | `message_dispatch.interval_minutes` | 1 min | 1 min |

Para alterar, atualize no Supabase e o scheduler irá sincronizar automaticamente.

---

## 🐛 Troubleshooting

### Erro ao Conectar ao Supabase
```
Missing Supabase environment variables
```
**Solução:** Verifique `.env.local` e confirme que URL e chave estão corretas.

### Job Não Dispara
1. Verifique o status no database: `automation_status = 'RUNNING'`
2. Confirme o intervalo: `interval_minutes > 0`
3. Veja logs em `automation.log`

### Python Module Not Found
```bash
pip install -r requirements.txt
```

### Ativar Virtual Environment Falhou
- Windows: `venv\Scripts\activate`
- Linux/Mac: `source venv/bin/activate`

---

## 📚 Recursos

- [APScheduler Docs](https://apscheduler.readthedocs.io/)
- [Supabase Python SDK](https://github.com/supabase/supabase-py)
- [Python Logging](https://docs.python.org/3/library/logging.html)
- [Python dotenv](https://pypi.org/project/python-dotenv/)

---

## 🤝 Integração com Frontend

O Backend Python roda **independentemente** do Frontend React:
- Frontend acessa dados via Supabase
- Backend atualiza dados no Supabase
- Ambos sincronizam pelo banco de dados

Para entender a arquitetura completa:
📄 [ARCHITECTURE.md](../../ARCHITECTURE.md)

---

## 📝 Próximas Melhorias

- [ ] Tests com pytest
- [ ] Docker container
- [ ] Health check endpoints
- [ ] Métricas de performance
- [ ] Dashboard de monitoramento
- [ ] API REST para controle remoto

---

## 📝 Licença

© 2025 GTP Smart IA. Todos os direitos reservados.
