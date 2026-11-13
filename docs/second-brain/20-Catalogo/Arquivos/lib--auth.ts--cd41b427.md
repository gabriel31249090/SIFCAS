---
tipo: inventario-gerado
fonte: "lib/auth.ts"
verificado_em: 2026-11-13T15:58:18.928Z
commit_base: 9f270e354b18c60fc4c493749c13ce8c544026df
sha256: c9d36d0d89f88d4df24a293504856bd428397c88a593952f9e486cd50034f6df
hash_formato: sha256-utf8-lf-v1
---

# lib/auth.ts

Categoria: **Bibliotecas**. 3200 bytes; 91 linhas.

[Fonte no repositório](../../../../lib/auth.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Auth-perfis-e-RLS]] · [[20-Catalogo/Indice]]

## Símbolos exportados

- `AccountStatus`
- `AppRole`
- `canAccess`
- `CurrentAccount`
- `getCurrentAccount`
- `initials`
- `requireAccount`
- `roleLabels`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/lib--supabase--config.ts--3fda3e56|lib/supabase/config.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: `profiles`, `user_roles`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: auth.getClaims, canAccess, getCurrentAccount, requireAccount. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
