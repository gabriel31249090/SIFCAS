---
tipo: inventario-gerado
fonte: "app/reportar-erro/actions.ts"
verificado_em: 2026-11-13T15:58:18.928Z
commit_base: 9f270e354b18c60fc4c493749c13ce8c544026df
sha256: 0621a6d630a6181683173199a0ea6bee25a05600d353158695702a144bbf2790
hash_formato: sha256-utf8-lf-v1
---

# app/reportar-erro/actions.ts

Categoria: **Acoes**. 2227 bytes; 58 linhas.

[Fonte no repositório](../../../../app/reportar-erro/actions.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Arquitetura-e-navegacao]] · [[20-Catalogo/Indice]]

## Símbolos exportados

- `createBugReport`
- `manageBugReport`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: `bug_reports`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: requireAccount. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
