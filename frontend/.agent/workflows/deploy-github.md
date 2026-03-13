---
description: Como subir alterações para o GitHub e fazer deploy
---
# Deploy via GitHub

// turbo-all

## Comandos Git Essenciais

### 1. Ver arquivos modificados
```bash
git status
```

### 2. Adicionar arquivos para commit
```bash
# Adicionar todos os arquivos modificados
git add .

# Ou adicionar arquivos específicos
git add src/pages/ManageTeam.tsx
```

### 3. Criar commit com mensagem
```bash
git commit -m "feat: descrição das alterações"
```

### 4. Enviar para o GitHub
```bash
git push origin main
```

## Fluxo Completo (Copiar e Colar)

```bash
git add .
git commit -m "fix: correções na gestão de equipe"
git push origin main
```

## Dica: Hospedar na Hostinger via GitHub

Se sua Hostinger estiver conectada ao GitHub:
1. Faça o push para o GitHub (comandos acima)
2. A Hostinger detecta automaticamente e faz o deploy
3. Se não for automático, vá no painel da Hostinger e clique em "Atualizar" ou "Pull"

## Verificar se está conectado
```bash
git remote -v
```
Deve mostrar a URL do seu repositório GitHub.
