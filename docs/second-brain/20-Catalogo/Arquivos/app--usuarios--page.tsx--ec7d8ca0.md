---
tipo: inventario-gerado
fonte: "app/usuarios/page.tsx"
verificado_em: 2026-11-13T15:58:18.928Z
commit_base: 9f270e354b18c60fc4c493749c13ce8c544026df
sha256: aa38c881dfebab5be8b91a9e74f0f0c1452733f31f567ad9998b0a13d4780265
hash_formato: sha256-utf8-lf-v1
---

# app/usuarios/page.tsx

Categoria: **Rotas**. 5926 bytes; 72 linhas.

[Fonte no repositório](../../../../app/usuarios/page.tsx). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Auth-perfis-e-RLS]] · [[20-Catalogo/Indice]]

Rota do App Router: `/usuarios`.

## Símbolos exportados

- `UsersPage`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/app--usuarios--actions.ts--bfcfb35a|app/usuarios/actions.ts]]
- [[20-Catalogo/Arquivos/components--UI.tsx--4b5b8820|components/UI.tsx]]
- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: `profiles`, `user_roles`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: requireAccount. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
