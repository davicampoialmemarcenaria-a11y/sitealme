# Publicação e Deploy — ALME

## 1. Objetivo

Este documento descreve o procedimento de atualização e publicação da plataforma ALME.

O processo atual utiliza o ambiente local para desenvolvimento e validação, GitHub para versionamento do código e HostGator para hospedagem da aplicação.

## 2. Infraestrutura de publicação

| Serviço | Responsabilidade |
|---|---|
| Ambiente local | Desenvolvimento e testes |
| GitHub | Versionamento e armazenamento do código |
| Node.js e npm | Instalação e compilação |
| Vite | Geração do build |
| HostGator | Hospedagem da aplicação |
| Supabase | Serviços de backend e banco de dados |

## 3. Fluxo de publicação

O processo segue esta sequência:

1. Desenvolver ou corrigir a funcionalidade localmente.
2. Executar os testes necessários.
3. Verificar o código e corrigir erros.
4. Executar o build de produção.
5. Gerar um arquivo ZIP com os arquivos compilados.
6. Enviar as alterações do código-fonte ao GitHub.
7. Enviar o ZIP à HostGator.
8. Descompactar os arquivos no diretório do domínio.
9. Validar a aplicação publicada.

## 4. Preparação

Antes de iniciar a publicação:

- Verificar se as alterações foram concluídas.
- Confirmar se os testes locais foram realizados.
- Verificar se não existem erros de compilação.
- Confirmar as variáveis de ambiente de produção.
- Verificar se existe uma versão anterior disponível para recuperação.

## 5. Executar o build

Na raiz do projeto, executar:

```bash
npm run build
```

O Vite irá gerar os arquivos de produção no diretório:

```text
dist/
```

A pasta `dist` contém os arquivos compilados necessários para a publicação da aplicação frontend.

## 6. Validar o build

Antes de compactar os arquivos:

```bash
npm run preview
```

Verificar:

- Carregamento das páginas.
- Navegação entre rotas.
- Funcionamento das funcionalidades.
- Comunicação com o Supabase.
- Carregamento de imagens e recursos.
- Ausência de erros no console.

## 7. Gerar o arquivo ZIP

Após a validação, compactar o conteúdo da pasta `dist`.

O ZIP deve conter os arquivos compilados na raiz do pacote.

Exemplo de estrutura:

```text
alme-deploy.zip
│
├── index.html
├── assets/
│   ├── index-xxxxx.js
│   ├── index-xxxxx.css
│   └── ...
└── outros arquivos públicos
```

**Importante:** compactar o conteúdo de `dist`, e não a pasta `dist` inteira dentro do ZIP, salvo se o procedimento de extração da hospedagem exigir outra estrutura.

## 8. Versionamento no GitHub

Após as alterações e validações, atualizar o repositório.

Verificar:

```bash
git status
```

Adicionar as alterações:

```bash
git add .
```

Criar um commit:

```bash
git commit -m "feat: descricao da atualizacao"
```

Enviar para o GitHub:

```bash
git push
```

O código-fonte deve permanecer versionado no GitHub.

A pasta `dist` deve ser tratada como artefato de publicação, não como substituta do código-fonte.

## 9. Publicação na HostGator

### Etapa 1 — Acessar a hospedagem

Entrar no painel de hospedagem da HostGator.

### Etapa 2 — Localizar o diretório do domínio

Acessar o diretório correspondente ao domínio da aplicação.

Confirmar o diretório correto antes de substituir arquivos existentes.

### Etapa 3 — Preparar a atualização

Recomenda-se manter uma cópia da versão atualmente publicada antes de realizar a substituição.

### Etapa 4 — Enviar o ZIP

Enviar o arquivo ZIP gerado na etapa de build.

### Etapa 5 — Descompactar

Extrair o conteúdo do ZIP diretamente no diretório público do domínio.

Verificar se o arquivo `index.html` ficou na raiz correta.

### Etapa 6 — Verificar a publicação

Acessar o domínio e confirmar:

- A página inicial carrega corretamente.
- As rotas funcionam.
- As imagens aparecem.
- Os estilos estão carregados.
- O login funciona.
- A comunicação com o Supabase está operacional.
- As funcionalidades principais estão disponíveis.

## 10. Configuração de rotas

Como a aplicação utiliza React Router DOM, a hospedagem deve estar configurada para direcionar rotas da aplicação ao `index.html`, quando necessário.

Em hospedagens Apache, uma configuração comum utiliza `.htaccess`:

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

A configuração deve ser adaptada caso o projeto esteja publicado em um subdiretório.

## 11. Rollback — Retorno à versão anterior

Caso a atualização apresente problemas:

1. Interromper novas alterações.
2. Identificar o problema.
3. Recuperar os arquivos da versão anterior.
4. Restaurar os arquivos no diretório do domínio.
5. Limpar ou invalidar o cache, quando necessário.
6. Validar novamente a aplicação.

Recomenda-se manter cópias identificadas por data ou versão.

## 12. Cuidados importantes

- Nunca substituir arquivos de produção sem verificar o diretório.
- Não enviar arquivos `.env` ao pacote público.
- Não disponibilizar chaves privadas.
- Não publicar uma versão sem testar o build.
- Manter o código-fonte atualizado no GitHub.
- Manter cópia da versão anterior.
- Verificar as configurações de domínio e HTTPS.
- Confirmar se alterações no banco exigem migrações antes do frontend.

## 13. Checklist de publicação

- [ ] Desenvolvimento concluído.
- [ ] Testes locais realizados.
- [ ] Lint executado.
- [ ] Build executado.
- [ ] Build validado com preview.
- [ ] ZIP gerado.
- [ ] Código enviado ao GitHub.
- [ ] Backup da versão anterior realizado.
- [ ] ZIP enviado à HostGator.
- [ ] Arquivos extraídos no diretório correto.
- [ ] Rotas verificadas.
- [ ] Supabase verificado.
- [ ] Domínio validado.

---

**Projeto:** ALME Marcenaria  
**Documento:** Deployment  
**Localização:** `arquivos/DEPLOYMENT.md`