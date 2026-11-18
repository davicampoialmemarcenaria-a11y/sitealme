# ALME | Plataforma Digital de Gestão e Operação

> Plataforma web desenvolvida para centralizar, organizar e integrar os processos comerciais, produtivos, administrativos e operacionais da ALME Marcenaria.

<p align="center">
  <img src="src/imgs/passarobranco.png" alt="ALME Marcenaria" width="180" />
</p>

<p align="center">
  <strong>Gestão, organização e confiança em cada etapa do projeto.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-ESM-F7DF1E?logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/Status-Em%20desenvolvimento-orange" />
</p>

---

## 1. Sobre o projeto

A Plataforma ALME é um sistema web desenvolvido para apoiar a gestão integrada das operações da ALME Marcenaria.

O objetivo é centralizar informações, padronizar processos, melhorar a comunicação entre departamentos e oferecer maior controle sobre o ciclo de vida dos projetos, desde o primeiro contato comercial até a conclusão da execução.

A aplicação foi concebida para atender às necessidades de diferentes áreas da empresa, oferecendo funcionalidades específicas conforme o perfil de acesso de cada usuário.

### Objetivos principais

- Centralizar informações comerciais e operacionais.
- Organizar a elaboração e o acompanhamento de orçamentos.
- Controlar versões e alterações de propostas comerciais.
- Integrar informações entre Comercial, Produção e Financeiro.
- Estruturar memoriais descritivos dos projetos.
- Gerenciar materiais e movimentações de estoque.
- Acompanhar projetos e cronogramas de execução.
- Administrar usuários e permissões.
- Disponibilizar conteúdos institucionais e projetos no ambiente público.
- Melhorar a rastreabilidade e a confiabilidade das informações.

## 2. Visão geral do sistema

A plataforma possui duas grandes áreas:

### 2.1. Ambiente público

Área institucional destinada à apresentação da empresa, divulgação de projetos, comunicação com visitantes e disponibilização de informações institucionais.

### 2.2. Ambiente administrativo

Área restrita destinada à operação interna da empresa, com funcionalidades organizadas por departamentos e níveis de acesso.

## 3. Módulos e funcionalidades

> A relação abaixo representa o escopo funcional conhecido do projeto. A disponibilidade de cada funcionalidade deve ser conferida na versão atualmente publicada.

### 3.1. Comercial

Responsável pela gestão das atividades comerciais e elaboração de propostas.

Funcionalidades:

- Gestão de orçamentos.
- Cadastro e edição de informações comerciais.
- Organização de ambientes e itens.
- Cálculo e composição de valores.
- Controle de versões de orçamento.
- Identificação dos responsáveis comerciais.
- Acompanhamento de propostas.
- Tabela de cores e classificação de MDF.
- Memorial descritivo.
- Vinculação de informações entre orçamento e memorial.

### 3.2. Produção

Área destinada ao acompanhamento das atividades relacionadas à execução dos projetos.

Funcionalidades:

- Gestão de projetos em produção.
- Organização das informações dos projetos.
- Acompanhamento de etapas.
- Registro de informações operacionais.
- Controle de cronogramas.
- Acompanhamento fotográfico, quando habilitado.

### 3.3. Financeiro

Área de apoio à gestão financeira e aos controles administrativos.

Funcionalidades:

- Organização de informações financeiras.
- Acompanhamento de dados relacionados aos projetos.
- Acesso aos controles administrativos autorizados.
- Gestão de estoque, conforme as permissões configuradas.

### 3.4. Estoque

Módulo responsável pelo controle das movimentações de materiais.

Funcionalidades:

- Cadastro de produtos.
- Consulta de saldo atual.
- Registro de entradas.
- Registro de saídas.
- Registro de devoluções.
- Histórico de movimentações.
- Identificação de itens e códigos.
- Consulta de movimentações relacionadas às obras.
- Exportação de relatórios.

### 3.5. Marketing

Área destinada à administração dos conteúdos institucionais.

Funcionalidades:

- Gerenciamento de notícias.
- Gerenciamento de projetos.
- Publicação e atualização de conteúdos.
- Controle de status de publicação.

### 3.6. Administração

Área de administração geral da plataforma.

Funcionalidades:

- Gestão de usuários.
- Administração de perfis e permissões.
- Controle de acesso aos módulos.
- Configurações administrativas.

### 3.7. Ambiente institucional

Funcionalidades públicas:

- Página inicial.
- Apresentação institucional.
- Projetos.
- Notícias.
- Contato.
- Dúvidas frequentes.
- Conteúdo direcionado ao mercado internacional.
- Suporte a diferentes idiomas.

## 4. Tecnologias utilizadas

### Frontend

| Tecnologia | Finalidade |
|---|---|
| React 19 | Construção da interface |
| Vite 8 | Desenvolvimento e build |
| JavaScript ES Modules | Lógica da aplicação |
| React Router DOM 7 | Gerenciamento de rotas |
| Bootstrap 5 | Componentes e estrutura visual |
| Sass | Estilização modular |
| Framer Motion | Animações e transições |
| React Icons | Biblioteca de ícones |
| Swiper | Carrosséis e apresentações |
| i18next | Internacionalização |
| React Helmet Async | Gerenciamento de metadados |
| React Hot Toast | Notificações |

### Backend e infraestrutura

| Tecnologia e Segurança | Finalidade |
|---|---|
| Supabase | Serviços de backend e persistência |
| PostgreSQL | Banco de dados relacional |
| Supabase Auth | Autenticação, caso habilitada na configuração |
| Supabase Storage | Armazenamento de arquivos, caso utilizado |
| Supabase Row Level Security | Controle de acesso aos dados, conforme políticas configuradas |

### Ferramentas de desenvolvimento

- Node.js
- npm
- Git
- GitHub
- ESLint

## 5. Arquitetura da aplicação

A aplicação utiliza uma arquitetura frontend baseada em React, com serviços externos fornecidos pelo Supabase.

Fluxo conceitual:

```text
USUÁRIO
   |
   v
INTERFACE REACT
   |
   +---- Ambiente público
   |
   +---- Ambiente administrativo
              |
              v
        REACT ROUTER
              |
              v
       COMPONENTES E PÁGINAS
              |
              v
       CAMADA DE SERVIÇOS
              |
              v
          SUPABASE
              |
       +------+------+
       |             |
       v             v
   PostgreSQL     Storage
```

### Princípios arquiteturais

- Separação entre interface e acesso aos dados.
- Organização por módulos funcionais.
- Reutilização de componentes.
- Centralização de integrações externas.
- Controle de acesso por perfil.
- Separação entre ambiente público e administrativo.
- Organização dos estilos em arquivos Sass.

## 6. Estrutura do projeto

Estrutura geral identificada no repositório:

```text
sitealme/
│
├── public/
│   └── Arquivos públicos e recursos estáticos
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   ├── ...
│   └── main.jsx
│
├── supabase/
│   └── Configurações e recursos do Supabase
│
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

> A árvore é ilustrativa. Os diretórios internos e arquivos devem ser ajustados à estrutura real do repositório.

## 7. Pré-requisitos

Antes de iniciar o desenvolvimento, certifique-se de possuir:

- Node.js em versão compatível com Vite 8.
- npm.
- Git.
- Editor de código, preferencialmente Visual Studio Code.
- Acesso ao projeto Supabase.
- Credenciais de desenvolvimento necessárias.

Recomendação: utilize uma versão LTS do Node.js compatível com a versão do Vite instalada e padronize-a entre os desenvolvedores.

## 8. Instalação e configuração

### 8.1. Clonar o repositório

```bash
git clone https://github.com/davicampoialmemarcenaria-a11y/sitealme.git
```

Acesse o diretório:

```bash
cd sitealme
```

### 8.2. Instalar dependências

```bash
npm ci
```

O comando utiliza o `package-lock.json` para instalar as versões registradas no projeto.

### 8.3. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto.

Exemplo de configuração:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Preencha os valores utilizando as credenciais públicas apropriadas do projeto Supabase.

**Importante:**

- Nunca armazene senhas administrativas no frontend.
- Nunca disponibilize chaves `service_role` em variáveis `VITE_`.
- Nunca envie arquivos `.env` com credenciais ao GitHub.
- As políticas RLS devem proteger os dados no banco, independentemente das permissões exibidas na interface.

Os nomes das variáveis acima devem ser confirmados no código de inicialização do Supabase antes da adoção definitiva deste exemplo.

### 8.4. Iniciar o ambiente de desenvolvimento

```bash
npm run dev
```

O Vite disponibilizará o endereço local no terminal, normalmente:

```text
http://localhost:5173
```

### 8.5. Gerar build de produção

```bash
npm run build
```

Os arquivos compilados serão gerados no diretório:

```text
dist/
```

### 8.6. Visualizar a versão de produção localmente

```bash
npm run preview
```

### 8.7. Executar análise de código

```bash
npm run lint
```

## 9. Banco de dados e Supabase

O Supabase é utilizado como infraestrutura de backend da aplicação.

A estrutura de dados deve ser documentada a partir do schema efetivamente existente no projeto.

### Componentes que devem ser documentados

- Tabelas.
- Colunas e tipos de dados.
- Chaves primárias.
- Chaves estrangeiras.
- Relacionamentos.
- Índices.
- Views.
- Functions.
- Triggers.
- Políticas de Row Level Security.
- Buckets de armazenamento.
- Regras de acesso.

### Migrações

Toda alteração estrutural do banco deve possuir histórico versionado.

Estrutura recomendada:

```text
supabase/
├── migrations/
│   ├── 20260101000000_initial_schema.sql
│   ├── 20260102000000_user_permissions.sql
│   └── ...
├── seed.sql
└── config.toml
```

Os arquivos acima representam uma estrutura recomendada, não uma declaração de que todos já existem.

### Regras fundamentais

1. Alterações no banco devem ser registradas em migrações.
2. Não utilizar alterações manuais sem histórico.
3. Validar relacionamentos antes de remover registros.
4. Proteger dados sensíveis com políticas de segurança.
5. Manter backups e procedimentos de recuperação.
6. Testar alterações em ambiente separado antes da produção.

## 10. Autenticação e controle de acesso

A plataforma possui perfis de acesso relacionados às atividades da empresa.

Perfis funcionais conhecidos:

| Perfil | Responsabilidade |
|---|---|
| Administrativo Geral | Administração geral |
| Comercial | Operações comerciais |
| Produção | Operações de produção |
| Financeiro | Operações financeiras |
| Homologado | Acesso conforme autorização |
| Parceiro | Acesso conforme autorização |

A autorização efetiva deve ser validada em conjunto com as regras de acesso do frontend e do banco de dados.

### Recomendações de segurança

- Validar sessões autenticadas.
- Controlar o acesso às rotas administrativas.
- Validar permissões nas operações de leitura e escrita.
- Utilizar RLS no PostgreSQL.
- Evitar confiar exclusivamente em verificações realizadas no React.
- Não expor informações sensíveis no console ou nas mensagens de erro.

## 11. Internacionalização

A aplicação utiliza i18next e react-i18next.

A internacionalização deve contemplar:

- Textos da interface.
- Mensagens de validação.
- Notificações.
- Conteúdos institucionais.
- Formatos de data.
- Formatos monetários.
- Textos de navegação.

Novos textos devem utilizar o sistema de tradução, evitando strings fixas quando a funcionalidade exigir suporte multilíngue.

## 12. Padrões de desenvolvimento

### Organização de componentes

- Priorizar componentes reutilizáveis.
- Separar regras de negócio da apresentação.
- Evitar componentes excessivamente extensos.
- Utilizar hooks para lógica compartilhada quando apropriado.
- Manter serviços de integração separados das páginas.

### Estilização

- Utilizar Sass para organização dos estilos.
- Reaproveitar variáveis globais.
- Evitar duplicação de regras CSS.
- Preservar consistência visual entre módulos.
- Priorizar responsividade.

### Manipulação de dados

- Centralizar consultas e operações de banco nos serviços apropriados.
- Tratar estados de carregamento.
- Tratar erros de comunicação.
- Validar informações antes de salvar.
- Evitar duplicidade de registros.
- Garantir integridade nas operações relacionadas.

## 13. Git e versionamento

O repositório utiliza Git para controle de versão.

### Convenção recomendada de branches

```text
main
develop
feature/nome-da-funcionalidade
fix/nome-do-problema
hotfix/nome-da-correcao
docs/nome-da-documentacao
```

### Convenção recomendada de commits

Adotar Conventional Commits:

```text
feat: adiciona módulo de memorial descritivo
fix: corrige persistência de versões do orçamento
docs: atualiza documentação do projeto
refactor: reorganiza serviços comerciais
style: ajusta responsividade da interface
perf: otimiza consultas de estoque
test: adiciona testes de permissões
chore: atualiza dependências
```

### Fluxo recomendado

1. Atualizar a branch de desenvolvimento.
2. Criar uma branch específica.
3. Implementar a alteração.
4. Executar lint e testes.
5. Validar o build.
6. Abrir Pull Request.
7. Revisar as alterações.
8. Integrar à branch principal após aprovação.

## 14. Testes e qualidade

A qualidade do sistema deve ser validada antes de cada publicação.

### Verificações disponíveis

```bash
npm run lint
npm run build
```

### Testes recomendados

- Autenticação.
- Permissões por perfil.
- Navegação entre rotas.
- Cadastro e edição de registros.
- Exclusão de registros.
- Persistência no Supabase.
- Integridade de versões de orçamento.
- Movimentações de estoque.
- Cálculos financeiros.
- Responsividade.
- Internacionalização.
- Tratamento de erros.

A existência de scripts de lint e build não significa que a aplicação já possua cobertura automatizada de testes.

## 15. Deploy e publicação

O processo de publicação deve contemplar:

1. Validação do código.
2. Execução dos testes.
3. Geração do build.
4. Configuração das variáveis de ambiente.
5. Publicação dos arquivos estáticos.
6. Configuração de domínio e HTTPS.
7. Configuração de fallback para rotas do React Router.
8. Verificação das integrações com Supabase.
9. Testes de funcionamento em produção.

### Configurações importantes

- Definir o provedor de hospedagem.
- Configurar variáveis por ambiente.
- Configurar domínio.
- Configurar HTTPS.
- Configurar regras de cache.
- Configurar redirecionamento de rotas.
- Definir estratégia de rollback.
- Documentar o responsável pela publicação.

## 16. Segurança

A segurança deve ser tratada como responsabilidade de toda a arquitetura.

### Diretrizes

- Não versionar credenciais.
- Não expor chaves privadas.
- Habilitar RLS nas tabelas que armazenam informações protegidas.
- Restringir operações de acordo com os perfis.
- Validar dados recebidos.
- Proteger arquivos e documentos.
- Revisar permissões periodicamente.
- Manter dependências atualizadas.
- Registrar e monitorar erros relevantes.
- Realizar backups periódicos.

## 17. Solução de problemas

| Problema | Verificação inicial |
|---|---|
| Aplicação não inicia | Verificar Node.js e dependências |
| Erro ao instalar pacotes | Executar `npm ci` |
| Erro de conexão Supabase | Conferir variáveis de ambiente |
| Dados não aparecem | Verificar consultas e políticas RLS |
| Acesso negado | Conferir sessão e permissões |
| Página não encontrada após atualização | Verificar fallback do servidor |
| Build falha | Executar `npm run build` e analisar erros |
| Erro de lint | Executar `npm run lint` |

## 18. Manutenção

Toda manutenção deve seguir um processo controlado:

- Identificar o problema.
- Reproduzir o comportamento.
- Identificar a origem.
- Avaliar os impactos.
- Implementar a correção.
- Testar os cenários relacionados.
- Atualizar a documentação.
- Registrar a alteração no Git.

Alterações em banco de dados, permissões e processos financeiros devem receber atenção especial, pois podem afetar dados já existentes.

## 19. Documentação complementar

A documentação técnica completa deverá ser organizada em:

```text
docs/
├── README.md
├── ARCHITECTURE.md
├── DATABASE.md
├── AUTHENTICATION.md
├── PERMISSIONS.md
├── ENVIRONMENT.md
├── DEPLOYMENT.md
├── DEVELOPMENT.md
├── TESTING.md
├── MODULES/
│   ├── COMERCIAL.md
│   ├── ORCAMENTOS.md
│   ├── MEMORIAL.md
│   ├── PRODUCAO.md
│   ├── FINANCEIRO.md
│   ├── ESTOQUE.md
│   ├── MARKETING.md
│   └── ADMINISTRACAO.md
└── RUNBOOK.md
```

## 20. Contribuição

Toda contribuição deve respeitar a arquitetura, os padrões de desenvolvimento e as regras de segurança da aplicação.

Antes de enviar alterações:

1. Verifique o código existente.
2. Evite modificar funcionalidades não relacionadas.
3. Execute as verificações disponíveis.
4. Documente alterações relevantes.
5. Informe eventuais mudanças no banco.
6. Não inclua credenciais ou dados reais de clientes.

## 21. Licença e propriedade intelectual

Este projeto é destinado às operações e à infraestrutura digital da ALME Marcenaria.

A utilização, reprodução, distribuição ou modificação do código deve respeitar as autorizações de seus responsáveis.

A licença formal do repositório deve ser definida e publicada em arquivo `LICENSE`.

---

<p align="center">
  <strong>ALME Marcenaria</strong><br/>
  Gestão e confiança acima de tudo.
</p>

<p align="center">
  Plataforma de gestão e operação desenvolvida para conectar pessoas, processos e projetos.
</p>
