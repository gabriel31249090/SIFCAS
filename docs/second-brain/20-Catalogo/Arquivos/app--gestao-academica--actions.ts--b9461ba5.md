---
tipo: inventario-gerado
fonte: "app/gestao-academica/actions.ts"
verificado_em: 2026-11-13T15:58:18.928Z
commit_base: 9f270e354b18c60fc4c493749c13ce8c544026df
sha256: 1d6b0effc04d8a949a7eb1b9dfb1c7eff1f80e6d4400a648454abfbbcf501b8b
hash_formato: sha256-utf8-lf-v1
---

# app/gestao-academica/actions.ts

Categoria: **Acoes**. 10049 bytes; 182 linhas.

[Fonte no repositório](../../../../app/gestao-academica/actions.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Academico-e-importacoes]] · [[20-Catalogo/Indice]]

## Símbolos exportados

- `assignTeacher`
- `attachSubjectToClass`
- `createAcademicPeriod`
- `createClass`
- `createCourse`
- `createSchedule`
- `createSubject`
- `enrollStudent`
- `setUserRole`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: `academic_periods`, `class_schedules`, `class_subjects`, `classes`, `courses`, `enrollments`, `profiles`, `subjects`, `teaching_assignments`, `user_roles`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: requireAccount. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
