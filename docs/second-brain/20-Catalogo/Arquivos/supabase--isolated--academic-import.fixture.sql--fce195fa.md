---
tipo: inventario-gerado
fonte: "supabase/isolated/academic-import.fixture.sql"
verificado_em: 2026-11-13T15:58:18.928Z
commit_base: 9f270e354b18c60fc4c493749c13ce8c544026df
sha256: bdce78aa8f99dbda8a6c9007db13883d67d9fed49199f9e006c0308885f73a0e
hash_formato: sha256-utf8-lf-v1
---

# supabase/isolated/academic-import.fixture.sql

Categoria: **Banco**. 2864 bytes; 26 linhas.

[Fonte no repositório](../../../../supabase/isolated/academic-import.fixture.sql). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Auth-perfis-e-RLS]] · [[10-Mapas/Academico-e-importacoes]] · [[10-Mapas/Integracoes-e-limites]] · [[20-Catalogo/Indice]]

## Símbolos exportados

Nenhum identificado pela extração estática.

## Dependências locais resolvidas

Nenhum identificado pela extração estática.

## Dados e autorização identificados

Tabelas consultadas: nenhuma referência literal `.from()`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: nenhum padrão reconhecido neste arquivo. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

SQL local não comprova aplicação remota. Contratos `isolated/` usam dados sintéticos; patches exigem revisão. Não há baseline remota verificada.

Objetos SQL declarados:

- `tabela: class_subjects`
- `tabela: classes`
- `tabela: enrollments`
- `tabela: profiles`
- `tabela: teaching_assignments`
- `tabela: user_roles`
- `função: auth.uid`

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
