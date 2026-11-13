---
tipo: inventario-gerado
fonte: "lib/documents.ts"
verificado_em: 2026-11-13T10:48:20.170Z
commit_base: c1fe354f5cddb3ce1509f71ba135d9ca59c76203
sha256: a56cb4346ff812c8ffda4f62104a4bedc0786132f1635d864014e3121143911e
hash_formato: sha256-utf8-lf-v1
---

# lib/documents.ts

Categoria: **Bibliotecas**. 8801 bytes; 262 linhas.

[Fonte no repositório](../../../../lib/documents.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Institucional-e-servicos]] · [[20-Catalogo/Indice]]

## Símbolos exportados

- `academicDocumentLabels`
- `AcademicDocumentListItem`
- `AcademicDocumentRecord`
- `AcademicDocumentSnapshot`
- `AcademicDocumentType`
- `buildAcademicDocumentSnapshot`
- `DocumentEligibility`
- `getAcademicDocumentById`
- `getDocumentEligibility`
- `listAcademicDocuments`
- `verifyAcademicDocument`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--diary.ts--e56a4afb|lib/diary.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--config.ts--3fda3e56|lib/supabase/config.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: `academic_documents`, `academic_periods`, `campuses`, `classes`, `courses`, `enrollments`, `profiles`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: nenhum padrão reconhecido neste arquivo. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
