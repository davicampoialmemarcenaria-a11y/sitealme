# Segurança da Aplicação — ALME

## 1. Objetivo

Este documento estabelece as diretrizes técnicas de segurança da plataforma ALME.

A aplicação utiliza o Supabase como infraestrutura de backend, incluindo serviços relacionados ao banco de dados e autenticação, conforme os recursos efetivamente habilitados.

A segurança da plataforma depende da configuração correta desses serviços e da implementação adequada das regras de acesso.

## 2. Responsabilidade da segurança

O Supabase disponibiliza recursos de segurança, mas sua utilização não garante automaticamente que a aplicação esteja protegida.

É necessário configurar e validar:

- Autenticação.
- Autorização.
- Row Level Security (RLS).
- Políticas de acesso.
- Proteção de credenciais.
- Permissões de armazenamento.
- Regras de leitura e escrita.

## 3. Segurança do banco de dados

O banco PostgreSQL deve proteger os dados de acordo com as permissões estabelecidas.

As tabelas que contêm informações protegidas devem possuir políticas RLS adequadas.

As políticas devem considerar:

- Usuário autenticado.
- Perfil do usuário.
- Permissões específicas.
- Operação solicitada.
- Relacionamentos entre registros.

Não se deve confiar exclusivamente nas verificações realizadas pela interface React.

## 4. Proteção de credenciais

As credenciais devem ser armazenadas de forma segura.

Regras obrigatórias:

- Não inserir senhas diretamente no código.
- Não publicar tokens privados no GitHub.
- Não disponibilizar chaves administrativas no frontend.
- Não compartilhar arquivos `.env`.
- Não registrar credenciais em logs.
- Não expor informações sensíveis em mensagens de erro.

Chaves públicas utilizadas no frontend devem possuir permissões limitadas pelas políticas de segurança do Supabase.

## 5. Controle de acesso

O acesso às funcionalidades administrativas deve respeitar os perfis e as permissões configuradas.

A aplicação não deve permitir que um usuário execute operações não autorizadas apenas por alterar a interface ou manipular requisições.

As validações devem ocorrer também na camada de backend e banco de dados.

## 6. Segurança de arquivos

Caso sejam utilizados recursos de armazenamento do Supabase, os buckets e as políticas de acesso devem ser configurados conforme a sensibilidade dos arquivos.

Documentos privados não devem ficar disponíveis publicamente sem autorização.

## 7. Proteção de dados

As informações comerciais, financeiras e operacionais devem ser tratadas de forma responsável.

Recomendações:

- Restringir acessos desnecessários.
- Evitar exposição de dados em logs.
- Não utilizar dados reais em testes sem necessidade.
- Remover informações sensíveis de relatórios públicos.
- Revisar permissões periodicamente.

## 8. Dependências

As dependências do projeto devem ser mantidas atualizadas.

Recomenda-se executar periodicamente:

```bash
npm audit
```

Vulnerabilidades identificadas devem ser avaliadas antes de qualquer atualização automática.

## 9. Backups e recuperação

O projeto deve possuir uma estratégia de backup para os dados armazenados no Supabase.

É importante documentar:

- Periodicidade dos backups.
- Retenção.
- Responsáveis.
- Procedimento de recuperação.
- Testes de restauração.

A existência de backups deve ser confirmada nas configurações e no plano contratado do serviço.

## 10. Resposta a incidentes

Em caso de suspeita de vulnerabilidade ou acesso indevido:

1. Identificar o problema.
2. Avaliar os recursos afetados.
3. Revogar ou rotacionar credenciais comprometidas.
4. Revisar políticas e permissões.
5. Avaliar a exposição de dados.
6. Aplicar a correção.
7. Registrar o incidente.
8. Validar a segurança após a correção.

## 11. Revisões periódicas

A segurança deve ser revisada sempre que ocorrer:

- Alteração de permissões.
- Criação de novas tabelas.
- Alteração de políticas RLS.
- Implementação de novas funcionalidades.
- Integração com serviços externos.
- Mudança na autenticação.
- Atualização de dependências.

## 12. Considerações finais

A segurança é uma responsabilidade compartilhada entre a implementação da aplicação, as configurações do Supabase e os procedimentos operacionais.

Nenhuma funcionalidade deve ser considerada segura apenas porque existe uma verificação visual de permissão no frontend.

---

**Projeto:** ALME Marcenaria  
**Documento:** Security  
**Localização:** `arquivos/SECURITY.md`