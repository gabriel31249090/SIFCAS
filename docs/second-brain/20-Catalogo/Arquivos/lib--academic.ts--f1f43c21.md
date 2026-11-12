---
tipo: inventario-gerado
fonte: "lib/academic.ts"
verificado_em: 2026-11-12T16:48:34.196Z
commit_base: f341b358dcc9c0b4bb783ddd459cc7918cdb77eb
sha256: 236decb68d9a660e13255114a17b0985d81b17452abb13d7f6b3f94d10a2899c
hash_formato: sha256-utf8-lf-v1
---

# lib/academic.ts

Categoria: **Bibliotecas**. 10959 bytes; 284 linhas.

[Fonte no repositório](../../../../lib/academic.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Academico-e-importacoes]] · [[20-Catalogo/Indice]]

## Símbolos exportados

- `AcademicOverview`
- `AgendaContext`
- `AgendaEntry`
- `AgendaOption`
- `getAcademicOverview`
- `getAgendaContext`
- `getStudentAcademicContext`
- `StudentAcademicContext`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: `academic_periods`, `campuses`, `class_agenda_entries`, `class_schedules`, `class_subjects`, `classes`, `courses`, `enrollments`, `subjects`, `teaching_assignments`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: nenhum padrão reconhecido neste arquivo. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
