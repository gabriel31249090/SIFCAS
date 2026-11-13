---
tipo: inventario-gerado
fonte: "lib/diary-security.ts"
verificado_em: 2026-11-13T10:48:20.170Z
commit_base: c1fe354f5cddb3ce1509f71ba135d9ca59c76203
sha256: 42b91a54301267cd9a64aa33fa1a7efa58978e9b372598a092717f35b56a7954
hash_formato: sha256-utf8-lf-v1
---

# lib/diary-security.ts

Categoria: **Bibliotecas**. 7449 bytes; 141 linhas.

[Fonte no repositório](../../../../lib/diary-security.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Auth-perfis-e-RLS]] · [[10-Mapas/Academico-e-importacoes]] · [[20-Catalogo/Indice]]

## Símbolos exportados

- `DIARY_PAGE_SIZE`
- `DiaryActor`
- `diaryDate`
- `diaryGrade`
- `diaryPage`
- `DiaryValidationError`
- `readDiaryIds`
- `readDiaryPage`
- `readDiaryRows`
- `requireDiaryAccess`
- `requireDiaryId`
- `requireDiaryRecord`
- `requireDiaryStudents`
- `selectDiaryRecord`

## Dependências locais resolvidas

Nenhum identificado pela extração estática.

## Dados e autorização identificados

Tabelas consultadas: `class_subjects`, `enrollments`, `teaching_assignments`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: nenhum padrão reconhecido neste arquivo. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
