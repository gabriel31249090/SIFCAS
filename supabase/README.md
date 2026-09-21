# Banco do SIFCAS

Projeto referenciado pela aplicação: `xqhilujzacwebeexljaf`.

## Estado desta atualização

Nenhuma mudança de schema, política RLS, função, usuário ou dado foi aplicada ao Supabase. A conexão disponível não possuía permissão para inspecionar este projeto. O endpoint de saúde da aplicação não substitui auditoria de RLS nem teste dos fluxos autenticados.

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

## Próximo passo com a conexão correta

1. Confirmar projeto e ambiente antes de qualquer operação.
2. Exportar a estrutura existente para uma baseline de migrações, sem dados pessoais nem credenciais.
3. Revisar funções, triggers, grants, views e políticas RLS contra o banco real.
4. Testar a baseline em ambiente isolado, incluindo acesso anônimo, estudante, professor, servidor, gestor, administrador, pendente e suspenso.
5. Conferir backups e restauração; o Storage requer cópia separada.
6. Versionar somente a estrutura revisada. Aplicar futuras alterações primeiro em ambiente de teste.

As permissões do menu são apenas apresentação. O banco e as ações no servidor continuam responsáveis por autorização.
