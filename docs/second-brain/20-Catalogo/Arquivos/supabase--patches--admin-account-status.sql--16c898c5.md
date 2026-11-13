---
tipo: inventario-gerado
fonte: "supabase/patches/admin-account-status.sql"
verificado_em: 2026-11-13T15:58:18.928Z
commit_base: 9f270e354b18c60fc4c493749c13ce8c544026df
sha256: 10a48af1bab87f7fa4b1e2d8b09e3446eedd7430a0107f1a2e2df652bcc51e2b
hash_formato: sha256-utf8-lf-v1
---

# supabase/patches/admin-account-status.sql

Categoria: **Banco**. 2556 bytes; 76 linhas.

[Fonte no repositório](../../../../supabase/patches/admin-account-status.sql). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Auth-perfis-e-RLS]] · [[10-Mapas/Integracoes-e-limites]] · [[20-Catalogo/Indice]]

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

- `função: admin_set_account_status`

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
