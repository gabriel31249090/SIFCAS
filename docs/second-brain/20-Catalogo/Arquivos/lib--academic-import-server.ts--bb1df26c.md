---
tipo: inventario-gerado
fonte: "lib/academic-import-server.ts"
verificado_em: 2026-11-12T16:48:34.196Z
commit_base: f341b358dcc9c0b4bb783ddd459cc7918cdb77eb
sha256: ba9125cd29089f4367bc901891fbd60e9acce3fe4e7371f7e08690dbfaab272f
hash_formato: sha256-utf8-lf-v1
---

# lib/academic-import-server.ts

Categoria: **Bibliotecas**. 5551 bytes; 75 linhas.

[Fonte no repositório](../../../../lib/academic-import-server.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Academico-e-importacoes]] · [[10-Mapas/Integracoes-e-limites]] · [[20-Catalogo/Indice]]

## Símbolos exportados

- `AcademicImportBatch`
- `academicImportConfigured`
- `getAcademicImportBatch`
- `getAcademicImportBatches`
- `getImportedAcademicContext`
- `ImportedAcademicContext`
- `ImportedDiary`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: `academic_import_batches`, `academic_import_diaries`, `academic_import_records`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: nenhum padrão reconhecido neste arquivo. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
