---
tipo: inventario-gerado
fonte: "app/vinculos-institucionais/actions.ts"
verificado_em: 2026-11-13T10:48:20.170Z
commit_base: c1fe354f5cddb3ce1509f71ba135d9ca59c76203
sha256: bba8246aaa1c42d0d1c16e2dc124ebcf1def451fd6d83b6b3043062113e13b7c
hash_formato: sha256-utf8-lf-v1
---

# app/vinculos-institucionais/actions.ts

Categoria: **Acoes**. 3902 bytes; 107 linhas.

[Fonte no repositório](../../../../app/vinculos-institucionais/actions.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Auth-perfis-e-RLS]] · [[20-Catalogo/Indice]]

## Símbolos exportados

- `applyInstitutionalBatch`
- `importInstitutionalCsv`
- `resyncInstitutionalAcademics`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--csv.ts--95fd9b83|lib/csv.ts]]
- [[20-Catalogo/Arquivos/lib--institutional-import.ts--3fca2ae3|lib/institutional-import.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: nenhuma referência literal `.from()`.

RPCs: `apply_institutional_batch`, `import_institutional_records`, `resync_institutional_academics`.

Guards encontrados: requireAccount. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
