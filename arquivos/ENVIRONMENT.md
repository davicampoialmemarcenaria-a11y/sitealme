# Configuração do Ambiente — ALME

## 1. Objetivo

Este documento apresenta os requisitos e procedimentos necessários para preparar o ambiente de desenvolvimento da plataforma ALME.

## 2. Requisitos

Para executar o projeto localmente, é necessário possuir:

- Node.js em versão compatível com as dependências do projeto.
- npm.
- Git.
- Editor de código (sendo preferível VSCODE).
- Acesso às configurações do projeto Supabase.

Recomenda-se utilizar a mesma versão do Node.js entre os ambientes de desenvolvimento.

## 3. Clonagem do projeto

Para obter o código-fonte:

```bash
git clone https://github.com/davicampoialmemarcenaria-a11y/sitealme.git
```

Acesse o diretório:

```bash
cd sitealme
```

## 4. Instalação das dependências

Execute:

```bash
npm ci
```

Esse comando instala as dependências utilizando o arquivo `package-lock.json`.

Caso seja necessário adicionar uma nova dependência:

```bash
npm install nome-do-pacote
```

## 5. Variáveis de ambiente

O projeto utiliza integração com Supabase.

As variáveis necessárias devem ser identificadas no código de inicialização do cliente Supabase.

Exemplo de configuração, caso esses sejam os nomes utilizados pelo projeto:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Os valores devem ser obtidos nas configurações do projeto Supabase.

**Importante:**

- Não inserir credenciais privadas diretamente no código.
- Não enviar arquivos `.env` ao GitHub.
- Não utilizar chaves administrativas no frontend.
- Não compartilhar tokens ou senhas.
- Manter as configurações de cada ambiente separadas.

## 6. Execução local

Para iniciar o ambiente de desenvolvimento:

```bash
npm run dev
```

O endereço local será apresentado no terminal.

Normalmente:

```text
http://localhost:5173
```

## 7. Scripts disponíveis

| Comando | Finalidade |
|---|---|
| `npm run dev` | Inicia o ambiente de desenvolvimento |
| `npm run build` | Gera a versão de produção |
| `npm run preview` | Visualiza a versão compilada |
| `npm run lint` | Executa a análise estática do código |

## 8. Estrutura de configuração

Os principais arquivos de configuração incluem:

- `package.json`: dependências e scripts.
- `package-lock.json`: versões e resolução das dependências.
- `vite.config.js`: configuração do Vite.
- `eslint.config.js`: regras de análise de código.
- `.gitignore`: arquivos que não devem ser versionados.
- Arquivos de ambiente: configurações locais.

## 9. Ambientes

Recomenda-se manter separados:

**Desenvolvimento:** utilizado para implementar e testar alterações.

**Produção:** ambiente publicado no domínio oficial da ALME.

As credenciais e configurações de produção não devem ser utilizadas indiscriminadamente durante o desenvolvimento.

## 10. Boas práticas

- Utilizar `npm ci` para instalações reproduzíveis.
- Manter o `package-lock.json` atualizado.
- Não versionar arquivos de ambiente.
- Não alterar dependências sem necessidade.
- Testar alterações antes de publicar.
- Manter as configurações documentadas.
- Evitar utilizar dados reais de clientes em testes.

---

**Projeto:** ALME Marcenaria  
**Documento:** Environment  
**Localização:** `arquivos/ENVIRONMENT.md`