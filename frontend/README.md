# 🏠 GTP Smart IA - Frontend (React)

Sistema de CRM imobiliário inteligente - Aplicação Frontend.

> **📌 Nota:** Este é o **Frontend** do projeto. Para a arquitetura completa, veja [../ARCHITECTURE.md](../ARCHITECTURE.md)

## 🚀 Quick Start

```bash
# 1. Instale as dependências
npm install

# 2. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais Supabase

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em **http://localhost:8080**

---

## 📋 Tecnologias

- **React 18** - UI Framework
- **TypeScript** - Type safety
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Componentes acessíveis
- **React Router** - Navegação
- **React Query** - Cache e estado assíncrono
- **Supabase** - Backend (Auth + Database)
- **Zod** - Validação de dados
- **React Hook Form** - Gerenciamento de formulários

---

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React reutilizáveis
│   ├── auth/           # Componentes de autenticação
│   ├── layout/         # Layout da aplicação
│   ├── modals/         # Componentes modais
│   ├── chat/           # Chat
│   ├── ui/             # Componentes shadcn/ui
│   └── ...
├── pages/              # Páginas principais
│   ├── Painel/         # Dashboard
│   ├── Clientes/       # Clientes/Leads
│   ├── Imoveis/        # Imóveis
│   ├── Agenda/         # Agenda
│   ├── Disparos/       # Disparos de mensagens
│   ├── GestaoEquipe/   # Gerenciamento de equipe
│   ├── Configuracoes/  # Configurações
│   └── ...
├── hooks/              # Custom React hooks
├── lib/                # Utilitários e configurações
│   ├── supabase.ts     # Cliente Supabase
│   ├── database.types.ts # TypeScript types do BD
│   └── utils.ts        # Funções auxiliares
├── utils/              # Funções de negócio
├── App.tsx             # Root component
├── main.tsx            # Entry point
├── index.css           # Estilos globais
└── vite-env.d.ts       # Type definitions do Vite
```

---

## 📌 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

**Não commite `.env.local` no Git!** Use `.env.example` como template.

---

## 🎯 Comandos Disponíveis

```bash
npm run dev              # Servidor de desenvolvimento (com HMR)
npm run build            # Build para produção
npm run build:dev        # Build em modo desenvolvimento
npm run preview          # Preview do build
npm run lint             # Verificar erros ESLint
npm run test             # Rodar testes (Vitest)
npm run test:watch       # Rodar testes em watch mode
```

---

## 🔑 Configuração Supabase

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **Settings → API**
4. Copie e cole no `.env.local`:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon` key → `VITE_SUPABASE_ANON_KEY`

---

## 🐛 Troubleshooting

### Tela Branca ao Iniciar
- Verifique se `.env.local` está preenchido corretamente
- Abra DevTools (F12) → Console para ver erros
- Certifique-se de que o Supabase project existe e é acessível

### Estilo não está carregando
```bash
npm run dev  # Às vezes requer reload
```

### Dependências desatualizadas
```bash
npm install
npm run dev
```

---

## 🛠️ Desenvolvimento

### Criar Novo Componente
```typescript
// src/components/MeuComponente.tsx
export function MeuComponente() {
  return <div>Hello</div>;
}
```

### Criar Novo Hook
```typescript
// src/hooks/useMeuHook.ts
import { useState } from 'react';

export function useMeuHook() {
  const [state, setState] = useState(null);
  return { state, setState };
}
```

### Criar Nova Página
```typescript
// src/pages/Minha Pagina/index.tsx
export default function MinhaPageina() {
  return <div>Conteúdo da página</div>;
}
```

---

## 📚 Recursos Úteis

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [React Router](https://reactrouter.com)
- [React Query](https://tanstack.com/query/latest)

---

## 🤝 Arquitetura Completa

Para entender a integração com o **Backend Python**, consulte:
📄 [ARCHITECTURE.md](../ARCHITECTURE.md)

---

## 📝 Licença

© 2025 GTP Smart IA. Todos os direitos reservados.
