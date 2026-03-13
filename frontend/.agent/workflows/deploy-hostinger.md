---
description: Como fazer deploy do projeto na Hostinger
---
# Deploy na Hostinger

// turbo-all

## 1. Build do Projeto

Execute o comando de build para gerar os arquivos estáticos:

```bash
npm run build
```

Isso cria a pasta `dist/` com os arquivos prontos para produção.

## 2. Upload para Hostinger

### Via Gerenciador de Arquivos (Recomendado)

1. Acesse o painel da Hostinger
2. Vá em **Gerenciador de Arquivos**
3. Navegue até `public_html/` (ou subpasta do seu domínio)
4. **Delete** os arquivos antigos (exceto `.htaccess` se existir)
5. Faça **upload** de todo o **conteúdo** da pasta `dist/`
   - NÃO faça upload da pasta `dist/` inteira
   - Faça upload dos arquivos **dentro** de `dist/`

### Via FTP (Alternativa)

1. Use um cliente FTP (FileZilla, WinSCP)
2. Conecte com as credenciais FTP da Hostinger
3. Envie o conteúdo de `dist/` para `public_html/`

## 3. Configurar Redirecionamento SPA

Crie um arquivo `.htaccess` na raiz (`public_html/`) com:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## 4. Variáveis de Ambiente

As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` são embutidas no build.
Certifique-se de que o `.env` está correto **antes** de rodar `npm run build`.

## 5. Testar

Acesse seu domínio e verifique se o app carrega corretamente.
