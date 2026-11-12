---
tipo: inventario-gerado
fonte: "app/vinculos-institucionais/page.tsx"
verificado_em: 2026-11-12T16:48:34.196Z
commit_base: f341b358dcc9c0b4bb783ddd459cc7918cdb77eb
sha256: cd1934a06b68edd3a087225b3975af62bfa711189a273553b45592c30d1035a4
hash_formato: sha256-utf8-lf-v1
---

# app/vinculos-institucionais/page.tsx

Categoria: **Rotas**. 8745 bytes; 130 linhas.

[Fonte no repositório](../../../../app/vinculos-institucionais/page.tsx). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Auth-perfis-e-RLS]] · [[20-Catalogo/Indice]]

Rota do App Router: `/vinculos-institucionais`.

## Símbolos exportados

- `InstitutionalLinksPage`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/app--vinculos-institucionais--actions.ts--8d854dae|app/vinculos-institucionais/actions.ts]]
- [[20-Catalogo/Arquivos/components--UI.tsx--4b5b8820|components/UI.tsx]]
- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: `institutional_identity_records`, `institutional_import_batches`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: requireAccount. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
