# Testes e Validação — ALME

## 1. Objetivo

Este documento estabelece os procedimentos de testes e validação da plataforma ALME antes da publicação de alterações.

Os testes são realizados no ambiente local de desenvolvimento, permitindo identificar problemas antes que as modificações sejam disponibilizadas em produção.

## 2. Ambiente de testes

O ambiente local é utilizado para:

- Implementação de funcionalidades.
- Correção de problemas.
- Validação visual.
- Testes de navegação.
- Testes de integração.
- Verificação de operações no Supabase.
- Validação de regras de negócio.

## 3. Preparação

Antes de iniciar os testes:

1. Atualizar o código-fonte.
2. Instalar dependências, quando necessário.
3. Conferir as variáveis de ambiente.
4. Iniciar a aplicação.

Instalação:

```bash
npm ci
```

Inicialização:

```bash
npm run dev
```

## 4. Testes funcionais

Cada alteração deve ser testada considerando sua finalidade e os possíveis impactos nas funcionalidades existentes.

### 4.1. Navegação

- Verificar acesso às páginas.
- Testar links e botões.
- Validar rotas.
- Verificar redirecionamentos.
- Atualizar páginas diretamente pelo navegador.

### 4.2. Autenticação

- Testar login.
- Testar logout.
- Verificar persistência da sessão.
- Validar acesso às páginas protegidas.
- Testar usuários com diferentes perfis.

### 4.3. Operações de dados

- Testar cadastros.
- Testar edições.
- Testar exclusões.
- Verificar persistência no Supabase.
- Verificar carregamento de registros.
- Validar mensagens de erro.

### 4.4. Regras de negócio

Testar os cálculos, validações e fluxos específicos de cada módulo.

Atenção especial para operações que envolvam valores financeiros, versões, movimentações de estoque e relacionamentos entre registros.

## 5. Testes por perfil

Quando uma alteração envolver permissões, testar com diferentes perfis de usuário.

Verificar:

- Funcionalidades disponíveis.
- Funcionalidades bloqueadas.
- Visualização de informações.
- Operações autorizadas.
- Operações não autorizadas.

## 6. Testes visuais

Verificar:

- Alinhamento dos componentes.
- Responsividade.
- Carregamento de imagens.
- Estilos.
- Formulários.
- Modais.
- Tabelas.
- Mensagens e notificações.

## 7. Análise de código

Executar:

```bash
npm run lint
```

Esse procedimento verifica problemas identificados pelas regras configuradas no ESLint.

## 8. Teste de build

Executar:

```bash
npm run build
```

O build deve finalizar sem erros.

Após a compilação, executar:

```bash
npm run preview
```

Verificar a aplicação utilizando a versão compilada.

## 9. Testes de regressão

Sempre que uma funcionalidade for alterada, verificar se os recursos relacionados continuam funcionando.

Exemplo:

Uma alteração no módulo de orçamentos pode impactar:

- Cadastro de ambientes.
- Itens do orçamento.
- Cálculos.
- Versionamento.
- Memorial descritivo.

Por isso, os testes devem considerar não apenas a funcionalidade modificada, mas também suas dependências.

## 10. Registro de problemas

Quando um problema for identificado, registrar:

- Funcionalidade afetada.
- Etapas para reproduzir.
- Resultado esperado.
- Resultado obtido.
- Mensagem de erro, quando disponível.
- Correção realizada.

## 11. Critérios para publicação

Uma alteração estará apta para publicação quando:

- A funcionalidade estiver concluída.
- Os testes necessários tiverem sido realizados.
- Não existirem erros conhecidos que impeçam seu funcionamento.
- O lint tiver sido verificado.
- O build tiver sido concluído.
- A versão compilada tiver sido validada.

## 12. Checklist

- [ ] Aplicação inicia normalmente.
- [ ] Navegação funciona.
- [ ] Funcionalidade alterada foi testada.
- [ ] Integração com Supabase foi validada.
- [ ] Permissões foram verificadas, quando aplicável.
- [ ] Interface foi revisada.
- [ ] Responsividade foi verificada.
- [ ] Lint executado.
- [ ] Build concluído.
- [ ] Preview validado.

---

**Projeto:** ALME Marcenaria  
**Documento:** Testing  
**Localização:** `arquivos/TESTING.md`