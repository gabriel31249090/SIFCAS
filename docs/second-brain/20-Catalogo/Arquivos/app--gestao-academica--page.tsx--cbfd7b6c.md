---
tipo: inventario-gerado
fonte: "app/gestao-academica/page.tsx"
verificado_em: 2026-11-13T10:48:20.170Z
commit_base: c1fe354f5cddb3ce1509f71ba135d9ca59c76203
sha256: 3564bd785904dd2d294f6641a19892a87eeb6fb4f1bdca89f7e93df669d5f722
hash_formato: sha256-utf8-lf-v1
---

# app/gestao-academica/page.tsx

Categoria: **Rotas**. 17715 bytes; 229 linhas.

[Fonte no repositório](../../../../app/gestao-academica/page.tsx). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Academico-e-importacoes]] · [[20-Catalogo/Indice]]

Rota do App Router: `/gestao-academica`.

## Símbolos exportados

- `AcademicManagementPage`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/app--gestao-academica--actions.ts--b9461ba5|app/gestao-academica/actions.ts]]
- [[20-Catalogo/Arquivos/components--ImportedAcademicSummary.tsx--2e49ab45|components/ImportedAcademicSummary.tsx]]
- [[20-Catalogo/Arquivos/components--UI.tsx--4b5b8820|components/UI.tsx]]
- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: `academic_periods`, `campuses`, `class_schedules`, `class_subjects`, `classes`, `courses`, `enrollments`, `profiles`, `subjects`, `teaching_assignments`, `user_roles`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: requireAccount. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
