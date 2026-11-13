---
tipo: inventario-gerado
fonte: "app/importar-dados-academicos/actions.ts"
verificado_em: 2026-11-13T10:48:20.170Z
commit_base: c1fe354f5cddb3ce1509f71ba135d9ca59c76203
sha256: a6042abf85688a84ec3595e4138e9de9023afabaa71b0d757600876b2fb59559
hash_formato: sha256-utf8-lf-v1
---

# app/importar-dados-academicos/actions.ts

Categoria: **Acoes**. 4470 bytes; 59 linhas.

[Fonte no repositório](../../../../app/importar-dados-academicos/actions.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Academico-e-importacoes]] · [[10-Mapas/Integracoes-e-limites]] · [[20-Catalogo/Indice]]

## Símbolos exportados

- `cancelAcademicImport`
- `confirmAcademicImport`
- `previewAcademicImport`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/lib--academic-import-server.ts--bb1df26c|lib/academic-import-server.ts]]
- [[20-Catalogo/Arquivos/lib--academic-import.ts--c27b4ee9|lib/academic-import.ts]]
- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--csv.ts--95fd9b83|lib/csv.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: nenhuma referência literal `.from()`.

RPCs: `apply_academic_import`, `cancel_academic_import`, `preview_academic_import`.

Guards encontrados: requireAccount. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
