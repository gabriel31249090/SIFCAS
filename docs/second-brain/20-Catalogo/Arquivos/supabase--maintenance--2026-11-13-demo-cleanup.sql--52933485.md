---
tipo: inventario-gerado
fonte: "supabase/maintenance/2026-11-13-demo-cleanup.sql"
verificado_em: 2026-11-17T14:58:27.318Z
commit_base: d705518e13bf72a73ebddd2c9aa99ed568527782
sha256: 9f220a628801d2e8f1f827f2067cd1661396ca082f5085953d8db8fed5382e6d
hash_formato: sha256-utf8-lf-v1
---

# supabase/maintenance/2026-11-13-demo-cleanup.sql

Categoria: **Banco**. 20317 bytes; 312 linhas.

[Fonte no repositório](../../../../supabase/maintenance/2026-11-13-demo-cleanup.sql). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

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

- `função: sifcas_demo_cleanup_content`
- `função: sifcas_demo_cleanup_finish`
- `função: sifcas_demo_cleanup_preview`

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
