---
tipo: inventario-gerado
fonte: "app/monitoramento/page.tsx"
verificado_em: 2026-11-13T15:58:18.928Z
commit_base: 9f270e354b18c60fc4c493749c13ce8c544026df
sha256: 319cd2374c38a18a2f52ba053ae6fc516672a1a4c48bb82f4f40d3b4a3a2363a
hash_formato: sha256-utf8-lf-v1
---

# app/monitoramento/page.tsx

Categoria: **Rotas**. 6283 bytes; 64 linhas.

[Fonte no repositório](../../../../app/monitoramento/page.tsx). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Arquitetura-e-navegacao]] · [[20-Catalogo/Indice]]

Rota do App Router: `/monitoramento`.

## Símbolos exportados

- `MonitoringPage`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/components--UI.tsx--4b5b8820|components/UI.tsx]]
- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--request-time.ts--21ea01e8|lib/request-time.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: `audit_logs`, `institutional_publications`, `profiles`, `publication_attachments`, `service_requests`.

RPCs: `sifcas_health`.

Guards encontrados: requireAccount. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
