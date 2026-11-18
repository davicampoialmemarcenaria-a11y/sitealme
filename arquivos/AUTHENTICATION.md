# Autenticação e Controle de Acesso — ALME

## 1. Objetivo

Este documento descreve os conceitos de autenticação e autorização utilizados na plataforma ALME.

O objetivo é estabelecer uma referência técnica para compreender como os usuários acessam o sistema e como as permissões são aplicadas às funcionalidades administrativas.

## 2. Infraestrutura de autenticação

A aplicação utiliza o Supabase como infraestrutura de backend.

O mecanismo de autenticação efetivamente utilizado deve ser confirmado na implementação do cliente Supabase e nos serviços responsáveis pelo login e gerenciamento de sessões.

## 3. Autenticação

O processo de autenticação deve contemplar:

1. Acesso à tela de login.
2. Envio das credenciais pelo usuário.
3. Validação pelo serviço de autenticação.
4. Retorno do resultado da autenticação.
5. Estabelecimento ou recuperação da sessão.
6. Liberação do acesso conforme as regras da aplicação.

O usuário não deve acessar funcionalidades administrativas sem uma sessão válida e as autorizações necessárias.

## 4. Sessões

As sessões são utilizadas para manter o estado de autenticação do usuário durante a navegação.

Devem ser observados:

- Recuperação de sessão ao atualizar a página.
- Atualização do estado de autenticação.
- Expiração de sessão.
- Encerramento de sessão.
- Tratamento de falhas de autenticação.
- Redirecionamento após logout.

Os mecanismos de armazenamento e renovação devem corresponder à configuração efetivamente utilizada pelo projeto.

## 5. Perfis de acesso

Os perfis funcionais conhecidos da plataforma incluem:

| Perfil | Área de atuação |
|---|---|
| Administrativo Geral | Administração geral |
| Comercial | Operações comerciais |
| Produção | Operações de produção |
| Financeiro | Operações financeiras |
| Homologado | Acesso autorizado conforme configuração |
| Parceiro | Acesso autorizado conforme configuração |

A existência de um perfil não significa acesso irrestrito a todos os recursos.

As permissões específicas devem ser verificadas nas regras de autorização da aplicação e nas políticas do banco de dados.

## 6. Autenticação x autorização

São conceitos diferentes:

**Autenticação:** confirma a identidade do usuário.

**Autorização:** determina quais recursos e operações o usuário pode acessar.

Um usuário autenticado não deve necessariamente possuir acesso a todos os módulos.

## 7. Proteção de rotas

As rotas administrativas devem respeitar o estado de autenticação e as permissões correspondentes.

O controle visual realizado pelo frontend deve ser complementado por verificações de autorização nas operações de backend.

Não é suficiente ocultar botões ou páginas para garantir a segurança dos dados.

## 8. Integração com o banco de dados

O controle de acesso aos dados deve ser realizado por mecanismos de segurança do Supabase e PostgreSQL, incluindo Row Level Security (RLS), quando aplicável.

As políticas devem considerar:

- Identidade do usuário autenticado.
- Perfil e permissões.
- Operação solicitada.
- Registro acessado.
- Regras específicas do módulo.

## 9. Encerramento de sessão

O encerramento da sessão deve invalidar o contexto autenticado conforme o mecanismo utilizado.

Após o logout, o usuário deverá ser direcionado para uma área pública ou tela de login.

## 10. Tratamento de erros

A aplicação deve tratar adequadamente situações como:

- Credenciais inválidas.
- Sessão expirada.
- Usuário sem autorização.
- Falha de conexão.
- Erro no serviço de autenticação.
- Falha ao recuperar informações do perfil.

Mensagens apresentadas ao usuário não devem expor detalhes técnicos ou informações sensíveis.

## 11. Manutenção

Alterações no processo de autenticação ou autorização devem ser testadas considerando todos os perfis de acesso.

É importante validar:

1. Login.
2. Logout.
3. Recuperação de sessão.
4. Navegação entre módulos.
5. Acesso autorizado.
6. Acesso não autorizado.
7. Persistência das permissões.
8. Comportamento após atualização da página.

---

**Projeto:** ALME Marcenaria  
**Documento:** Authentication  
**Localização:** `arquivos/AUTHENTICATION.md`