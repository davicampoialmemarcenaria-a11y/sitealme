# Arquitetura do Sistema — ALME

## 1. Visão geral

A plataforma ALME é uma aplicação web desenvolvida para centralizar e gerenciar os processos comerciais, produtivos, financeiros e administrativos da ALME Marcenaria.

O sistema possui uma interface desenvolvida em React, utiliza Vite como ferramenta de desenvolvimento e build e integra serviços de backend e banco de dados por meio do Supabase.

A arquitetura busca manter a aplicação organizada por módulos, permitindo evolução independente das funcionalidades e manutenção estruturada do código.

## 2. Tecnologias principais

| Tecnologia | Responsabilidade |
|---|---|
| React | Construção da interface |
| Vite | Ambiente de desenvolvimento e build |
| JavaScript | Lógica da aplicação |
| React Router DOM | Navegação e gerenciamento de rotas |
| Bootstrap | Componentes e estrutura visual |
| Sass | Organização dos estilos |
| Supabase | Serviços de backend, persistência e segurança |
| PostgreSQL | Banco de dados relacional |
| Framer Motion | Animações |
| i18next | Internacionalização |
| Swiper | Carrosséis e apresentações |
| React Icons | Ícones da interface |

## 3. Arquitetura conceitual

A aplicação segue uma organização baseada em camadas:

1. Interface: apresentação visual e interação com usuários.
2. Páginas: organização das funcionalidades por área.
3. Componentes: elementos reutilizáveis da interface.
4. Serviços: comunicação com serviços externos e operações de dados.
5. Backend: serviços disponibilizados pelo Supabase.
6. Banco de dados: persistência das informações.

## 4. Fluxo de comunicação

O fluxo conceitual da aplicação é:

```text
USUÁRIO
   |
   v
APLICAÇÃO REACT
   |
   v
ROTAS E PÁGINAS
   |
   v
COMPONENTES
   |
   v
SERVIÇOS DA APLICAÇÃO
   |
   v
SUPABASE
   |
   v
POSTGRESQL
```

A utilização de serviços específicos, Storage, autenticação e outras funcionalidades do Supabase deve ser considerada conforme sua implementação efetiva no projeto.

## 5. Organização funcional

A aplicação é organizada em duas grandes áreas.

### 5.1. Ambiente público

Responsável pela apresentação institucional da ALME e disponibilização de informações para visitantes.

### 5.2. Ambiente administrativo

Responsável pelas operações internas da empresa.

Os módulos funcionais conhecidos incluem:

- Comercial;
- Produção;
- Financeiro;
- Estoque;
- Marketing;
- Administração.

Cada módulo possui responsabilidades específicas e pode compartilhar informações com outras áreas da plataforma.

## 6. Integração entre módulos

A arquitetura permite a comunicação entre diferentes áreas da empresa.

Exemplo de fluxo operacional:

```text
COMERCIAL
    |
    v
ORÇAMENTO
    |
    v
APROVAÇÃO
    |
    v
MEMORIAL DESCRITIVO
    |
    v
PRODUÇÃO
    |
    v
ACOMPANHAMENTO
```

As integrações devem preservar a consistência dos dados e respeitar as regras de negócio de cada módulo.

## 7. Padrões arquiteturais

Recomenda-se manter os seguintes princípios:

- Separação entre interface e regras de negócio.
- Reutilização de componentes.
- Centralização de operações de dados nos serviços apropriados.
- Organização modular das funcionalidades.
- Padronização dos estilos.
- Tratamento consistente de erros.
- Controle de acesso nas operações protegidas.
- Evitar duplicação de regras de negócio.

## 8. Evolução da arquitetura

Toda alteração estrutural deve considerar:

1. Impacto nas funcionalidades existentes.
2. Dependências entre módulos.
3. Compatibilidade com o banco de dados.
4. Permissões dos usuários.
5. Responsividade da interface.
6. Necessidade de atualização da documentação.

## 9. Considerações

Este documento apresenta a arquitetura conceitual da plataforma.

Os caminhos reais dos componentes, serviços, páginas e integrações devem ser mantidos atualizados conforme a evolução do código-fonte.

Qualquer mudança significativa na arquitetura deverá ser refletida nesta documentação.

---

**Projeto:** ALME Marcenaria  
**Documento:** Architecture  
**Localização:** `arquivos/ARCHITECTURE.md`