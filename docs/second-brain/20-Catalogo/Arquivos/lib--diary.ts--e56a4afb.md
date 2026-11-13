---
tipo: inventario-gerado
fonte: "lib/diary.ts"
verificado_em: 2026-11-13T15:58:18.928Z
commit_base: 9f270e354b18c60fc4c493749c13ce8c544026df
sha256: 75dde6de048f2b6fa479a3a5c6e8c39f9f5124111e40857c14c981005d9f22d3
hash_formato: sha256-utf8-lf-v1
---

# lib/diary.ts

Categoria: **Bibliotecas**. 14501 bytes; 315 linhas.

[Fonte no repositório](../../../../lib/diary.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Academico-e-importacoes]] · [[20-Catalogo/Indice]]

## Símbolos exportados

- `DiaryAssessment`
- `DiaryContext`
- `DiaryOption`
- `DiarySession`
- `DiaryStudent`
- `getDiaryContext`
- `getStudentReport`
- `StudentReport`
- `StudentReportRow`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--diary-security.ts--4d1f95ab|lib/diary-security.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: `academic_assessments`, `attendance_records`, `class_sessions`, `class_subjects`, `classes`, `enrollments`, `grades`, `profiles`, `subjects`, `teaching_assignments`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: nenhum padrão reconhecido neste arquivo. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
