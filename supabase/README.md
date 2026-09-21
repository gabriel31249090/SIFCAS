# Banco do SIFCAS

Projeto referenciado pela aplicação: `xqhilujzacwebeexljaf`.

## Estado desta atualização

Nenhuma mudança de schema, política RLS, função, usuário ou dado foi aplicada ao Supabase. A conexão disponível não possuía permissão para inspecionar este projeto. O endpoint de saúde da aplicação não substitui auditoria de RLS nem teste dos fluxos autenticados.

O diretório agora foi inicializado pelo Supabase CLI `2.117.0`. O arquivo `config.toml` descreve somente o ambiente local e não prova que o banco remoto usa a mesma versão de Postgres ou as mesmas opções de Auth. Antes de iniciar/resetar o banco local, confirme `server_version` no projeto real e ajuste `[db].major_version` se necessário.

Os e-mails de autenticação do SIFCAS estão versionados separadamente do banco:

- confirmação de cadastro: `templates/confirmation.html` — assunto **Confirme seu e-mail no SIFCAS**;
- recuperação de conta: `templates/recovery.html` — assunto **Redefina sua senha do SIFCAS**.

Ambos usam `{{ .TokenHash }}` e passam pela rota SSR `/auth/confirm`, que verifica o código antes de criar a sessão. O template de recuperação segue então para `/nova-senha`. As URLs de callback atuais permanecem como compatibilidade para o template padrão do Supabase durante uma implantação gradual.

Para gerar o payload oficial da Management API sem enviar alterações:

```bash
npm run supabase:email-config
```

Para aplicar somente os quatro campos de assunto e conteúdo no projeto conferido pelo manifesto:

```bash
SUPABASE_ACCESS_TOKEN=... npm run supabase:email-apply
```

O script recusa um `SUPABASE_PROJECT_REF` diferente de `xqhilujzacwebeexljaf` e verifica a resposta do Supabase. Em projeto hospedado, os mesmos assuntos e conteúdos também podem ser colados em **Authentication > Email Templates**. É necessário ter SMTP personalizado quando a política do plano não permitir editar templates com o SMTP padrão.

Não há uma baseline SQL verificada neste repositório. Não recriar o banco a partir de inferências do código nem executar migrações de outro projeto.

## Fluxo para criar a baseline real

1. Autenticar o CLI com uma conta que enxergue o projeto `xqhilujzacwebeexljaf`.
2. Conferir a lista de projetos e então executar `npm run supabase:link`.
3. Executar `npm run supabase:pull` uma única vez para criar a migração `remote_schema` a partir do banco real.
4. Revisar o SQL gerado: extensões, funções, triggers, grants, views, buckets e todas as políticas RLS.
5. Executar os Security e Performance Advisors antes de qualquer ajuste e salvar os achados na revisão.
6. Criar um projeto de staging separado, aplicar a baseline nele e testar todos os papéis.
7. Só depois executar `npm run supabase:types` e integrar `lib/database.types.ts` ao cliente.
8. Após futuras migrações, repetir lint, advisors e testes no staging antes da produção.

Comandos disponíveis:

```bash
npm run supabase:link
npm run supabase:pull
npm run supabase:lint
npm run supabase:types
```

O gerador de tipos recusa um `SUPABASE_PROJECT_REF` diferente do projeto SIFCAS e só substitui o arquivo atual quando recebe uma saída válida. Credenciais, senhas de banco e tokens não devem ser gravados no repositório.

## Autenticação local

Novos cadastros e redefinições exigem 12 caracteres, confirmação de e-mail e intervalo mínimo de 60 segundos entre mensagens no ambiente local. CAPTCHA permanece desligado até que a instituição escolha hCaptcha ou Turnstile e forneça as chaves. A proteção contra senhas vazadas depende de um plano compatível do Supabase.

Essas opções locais não alteram automaticamente a produção; elas precisam ser comparadas com o Dashboard do projeto correto.

## Backup

`npm run db:backup` cria um dump lógico, verifica o índice do arquivo e grava o SHA-256. `npm run db:restore-test` exige confirmação explícita, recusa o host de produção e deve apontar apenas para um banco vazio e descartável. O Storage não faz parte do `pg_dump` e precisa de rotina própria.

## Próximo passo com a conexão correta

1. Confirmar projeto e ambiente antes de qualquer operação.
2. Exportar a estrutura existente para uma baseline de migrações, sem dados pessoais nem credenciais.
3. Revisar funções, triggers, grants, views e políticas RLS contra o banco real.
4. Testar a baseline em ambiente isolado, incluindo acesso anônimo, estudante, professor, servidor, gestor, administrador, pendente e suspenso.
5. Conferir backups e restauração; o Storage requer cópia separada.
6. Versionar somente a estrutura revisada. Aplicar futuras alterações primeiro em ambiente de teste.

As permissões do menu são apenas apresentação. O banco e as ações no servidor continuam responsáveis por autorização.
