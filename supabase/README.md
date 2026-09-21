# Banco do SIFCAS

Projeto referenciado pela aplicação: `xqhilujzacwebeexljaf`.

## Estado desta atualização

Nenhuma mudança de schema, política RLS, função, usuário ou dado foi aplicada ao Supabase. A conexão disponível não possuía permissão para inspecionar este projeto. O endpoint de saúde da aplicação não substitui auditoria de RLS nem teste dos fluxos autenticados.

Não há uma baseline SQL verificada neste repositório. Não recriar o banco a partir de inferências do código nem executar migrações de outro projeto.

## Próximo passo com a conexão correta

1. Confirmar projeto e ambiente antes de qualquer operação.
2. Exportar a estrutura existente para uma baseline de migrações, sem dados pessoais nem credenciais.
3. Revisar funções, triggers, grants, views e políticas RLS contra o banco real.
4. Testar a baseline em ambiente isolado, incluindo acesso anônimo, estudante, professor, servidor, gestor, administrador, pendente e suspenso.
5. Conferir backups e restauração; o Storage requer cópia separada.
6. Versionar somente a estrutura revisada. Aplicar futuras alterações primeiro em ambiente de teste.

As permissões do menu são apenas apresentação. O banco e as ações no servidor continuam responsáveis por autorização.
