---
tipo: inventario-gerado
fonte: "app/diario-professor/actions.ts"
verificado_em: 2026-11-12T16:48:34.196Z
commit_base: f341b358dcc9c0b4bb783ddd459cc7918cdb77eb
sha256: c049ed45b625600e8201ee017e86285a9b1739f124e6b1747a26528e4d14f9cd
hash_formato: sha256-utf8-lf-v1
---

# app/diario-professor/actions.ts

Categoria: **Acoes**. 9234 bytes; 183 linhas.

[Fonte no repositório](../../../../app/diario-professor/actions.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Academico-e-importacoes]] · [[20-Catalogo/Indice]]

## Símbolos exportados

- `createAssessment`
- `createSession`
- `saveAttendance`
- `saveGrades`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--diary-security.ts--4d1f95ab|lib/diary-security.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: `academic_assessments`, `attendance_records`, `class_sessions`, `grades`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: requireAccount. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
