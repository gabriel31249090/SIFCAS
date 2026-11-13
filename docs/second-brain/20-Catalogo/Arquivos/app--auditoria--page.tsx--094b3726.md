---
tipo: inventario-gerado
fonte: "app/auditoria/page.tsx"
verificado_em: 2026-11-13T15:58:18.928Z
commit_base: 9f270e354b18c60fc4c493749c13ce8c544026df
sha256: 1044946b466f0afd9f1145498bfbd3c8fdec1b1bf57344793a3c25ec8136cd09
hash_formato: sha256-utf8-lf-v1
---

# app/auditoria/page.tsx

Categoria: **Rotas**. 3598 bytes; 54 linhas.

[Fonte no repositório](../../../../app/auditoria/page.tsx). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Testes-deploy-e-operacoes]] · [[20-Catalogo/Indice]]

Rota do App Router: `/auditoria`.

## Símbolos exportados

- `AuditPage`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/components--UI.tsx--4b5b8820|components/UI.tsx]]
- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--request-time.ts--21ea01e8|lib/request-time.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: `audit_logs`, `profiles`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: requireAccount. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
