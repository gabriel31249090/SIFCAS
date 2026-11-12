---
tipo: inventario-gerado
fonte: "supabase/isolated/academic-import.sql"
verificado_em: 2026-11-12T16:48:34.196Z
commit_base: f341b358dcc9c0b4bb783ddd459cc7918cdb77eb
sha256: aa32b9108467fc64dedeb1ed6aa3508d783c5780c70f7c9fddad57cb70e66963
hash_formato: sha256-utf8-lf-v1
---

# supabase/isolated/academic-import.sql

Categoria: **Banco**. 21253 bytes; 239 linhas.

[Fonte no repositório](../../../../supabase/isolated/academic-import.sql). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Auth-perfis-e-RLS]] · [[10-Mapas/Academico-e-importacoes]] · [[10-Mapas/Integracoes-e-limites]] · [[20-Catalogo/Indice]]

## Símbolos exportados

Nenhum identificado pela extração estática.

## Dependências locais resolvidas

Nenhum identificado pela extração estática.

## Dados e autorização identificados

Tabelas consultadas: nenhuma referência literal `.from()`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: SECURITY DEFINER (revisar grants e corpo SQL). Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

SQL local não comprova aplicação remota. Contratos `isolated/` usam dados sintéticos; patches exigem revisão. Não há baseline remota verificada.

Objetos SQL declarados:

- `tabela: academic_import_audit`
- `tabela: academic_import_batches`
- `tabela: academic_import_diaries`
- `tabela: academic_import_operator_scopes`
- `tabela: academic_import_records`
- `tabela: academic_import_student_links`
- `função: academic_import_can_access`
- `função: academic_import_conflicts`
- `função: academic_import_validate`
- `função: apply_academic_import`
- `função: cancel_academic_import`
- `função: preview_academic_import`
- `função: purge_expired_academic_imports`
- `política: batch_owner`
- `política: diary_read`
- `política: import_audit_owner`
- `política: imported_record_read`
- `RLS habilitado no arquivo: academic_import_audit`
- `RLS habilitado no arquivo: academic_import_batches`
- `RLS habilitado no arquivo: academic_import_diaries`
- `RLS habilitado no arquivo: academic_import_operator_scopes`
- `RLS habilitado no arquivo: academic_import_records`
- `RLS habilitado no arquivo: academic_import_student_links`

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
