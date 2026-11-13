---
tipo: inventario-gerado
fonte: "app/api/maisa/actions/service-request/route.ts"
verificado_em: 2026-11-13T15:58:18.928Z
commit_base: 9f270e354b18c60fc4c493749c13ce8c544026df
sha256: 4aa24ee4a90148ae2508f448e1179f5983008829e4ccc67983a25fde8fbf03e7
hash_formato: sha256-utf8-lf-v1
---

# app/api/maisa/actions/service-request/route.ts

Categoria: **Rotas**. 2904 bytes; 68 linhas.

[Fonte no repositório](../../../../app/api/maisa/actions/service-request/route.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/LUMA]] · [[20-Catalogo/Indice]]

Rota do App Router: `/api/maisa/actions/service-request` (POST).

## Símbolos exportados

- `dynamic`
- `POST`
- `runtime`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--service-request.ts--13eaece1|lib/service-request.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: `service_requests`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: getCurrentAccount. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
