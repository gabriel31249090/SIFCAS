---
tipo: inventario-gerado
fonte: "app/nova-senha/actions.ts"
verificado_em: 2026-11-12T16:48:34.196Z
commit_base: f341b358dcc9c0b4bb783ddd459cc7918cdb77eb
sha256: 1c55a71b8e06f7e64f5c70192becfbb913aa38ad11d0e45dcc01956f6d55a424
hash_formato: sha256-utf8-lf-v1
---

# app/nova-senha/actions.ts

Categoria: **Acoes**. 983 bytes; 24 linhas.

[Fonte no repositório](../../../../app/nova-senha/actions.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Auth-perfis-e-RLS]] · [[20-Catalogo/Indice]]

## Símbolos exportados

- `updatePassword`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/lib--password-policy.ts--03ef9e1f|lib/password-policy.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: nenhuma referência literal `.from()`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: auth.getClaims. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
