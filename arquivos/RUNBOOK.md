# Manual Operacional — ALME

## 1. Objetivo

Este documento apresenta procedimentos operacionais para diagnóstico, manutenção e resolução de problemas relacionados à plataforma ALME.

O objetivo é padronizar as ações necessárias para identificar falhas e restabelecer o funcionamento da aplicação.

## 2. Ambientes

A plataforma possui dois ambientes operacionais principais:

**Desenvolvimento local**

Utilizado para implementar, testar e validar alterações.

**Produção**

Aplicação publicada no domínio oficial, hospedada na HostGator e integrada ao Supabase.

## 3. Inicialização local

Para iniciar o projeto:

```bash
npm ci
npm run dev
```

O endereço de desenvolvimento será apresentado no terminal.

## 4. Problemas comuns

### 4.1. Aplicação não inicia

Possíveis causas:

- Dependências não instaladas.
- Versão incompatível do Node.js.
- Erro no código.
- Configuração incorreta.

Procedimento:

1. Verificar a versão do Node.js.
2. Executar `npm ci`.
3. Executar `npm run dev`.
4. Analisar as mensagens do terminal.
5. Corrigir os erros identificados.

### 4.2. Erro de conexão com Supabase

Possíveis causas:

- Variáveis de ambiente ausentes.
- URL incorreta.
- Chave pública incorreta.
- Falha de comunicação.
- Configuração de acesso.

Procedimento:

1. Conferir as variáveis de ambiente.
2. Verificar o projeto Supabase.
3. Conferir a conexão.
4. Verificar mensagens de erro.
5. Validar as permissões e políticas aplicáveis.

### 4.3. Dados não aparecem

Possíveis causas:

- Consulta incorreta.
- Filtros aplicados.
- Dados inexistentes.
- Falta de autorização.
- Política RLS bloqueando a operação.

Procedimento:

1. Verificar os parâmetros da consulta.
2. Conferir os dados no banco.
3. Verificar o usuário autenticado.
4. Revisar as políticas RLS.
5. Analisar o retorno da operação.

### 4.4. Usuário não consegue acessar um módulo

Possíveis causas:

- Sessão expirada.
- Perfil incorreto.
- Permissão não configurada.
- Restrição de rota.
- Política de banco de dados.

Procedimento:

1. Verificar a sessão.
2. Confirmar o perfil do usuário.
3. Conferir as permissões.
4. Verificar as regras da rota.
5. Validar a autorização no backend.

### 4.5. Build apresenta erros

Executar:

```bash
npm run build
```

Analisar a mensagem apresentada.

Verificar especialmente:

- Imports incorretos.
- Variáveis não declaradas.
- Erros de sintaxe.
- Dependências ausentes.
- Componentes duplicados.
- Referências inexistentes.

### 4.6. Página não abre após atualização

Possível causa:

- Configuração incorreta de redirecionamento de rotas na hospedagem.

Procedimento:

1. Conferir a configuração `.htaccess`.
2. Verificar se o `index.html` está na raiz correta.
3. Verificar se os arquivos compilados foram extraídos corretamente.
4. Testar a rota novamente.

## 5. Problemas em produção

Quando a aplicação apresentar falhas no domínio:

1. Identificar a página ou funcionalidade afetada.
2. Verificar se o problema ocorre também localmente.
3. Verificar o console do navegador.
4. Verificar a comunicação com Supabase.
5. Verificar os arquivos publicados.
6. Identificar se a falha está relacionada à última atualização.

Não realizar alterações diretamente em produção sem identificar a causa do problema.

## 6. Procedimento de recuperação

Caso uma publicação comprometa o funcionamento:

1. Interromper novas atualizações.
2. Identificar a versão publicada.
3. Recuperar o backup dos arquivos anteriores.
4. Restaurar os arquivos na HostGator.
5. Verificar o carregamento da aplicação.
6. Testar autenticação e funcionalidades principais.
7. Registrar o ocorrido.

Se o problema envolver dados ou estrutura do banco, a recuperação deve seguir o procedimento específico do Supabase.

## 7. Manutenção preventiva

Recomenda-se:

- Verificar periodicamente o funcionamento do domínio.
- Conferir a disponibilidade do Supabase.
- Manter dependências atualizadas.
- Executar testes antes de publicar.
- Manter cópias das versões anteriores.
- Verificar erros recorrentes.
- Revisar permissões.
- Acompanhar a integridade dos dados.

## 8. Registro de incidentes

Todo problema relevante deve ser registrado com:

| Informação | Descrição |
|---|---|
| Data | Quando ocorreu |
| Módulo | Área afetada |
| Problema | Descrição da falha |
| Impacto | Consequências |
| Causa | Origem identificada |
| Solução | Procedimento realizado |
| Responsável | Quem realizou a correção |

## 9. Boas práticas operacionais

- Não realizar correções sem identificar a causa.
- Não modificar o banco diretamente sem avaliar os impactos.
- Não compartilhar credenciais.
- Não sobrescrever arquivos de produção sem backup.
- Não publicar builds sem validação.
- Registrar correções importantes.
- Atualizar a documentação quando os procedimentos mudarem.

## 10. Referências

Para procedimentos específicos, consultar:

- `ARCHITECTURE.md`
- `AUTHENTICATION.md`
- `ENVIRONMENT.md`
- `DEPLOYMENT.md`
- `SECURITY.md`
- `TESTING.md`

---

**Projeto:** ALME Marcenaria  
**Documento:** Runbook  
**Localização:** `arquivos/RUNBOOK.md`