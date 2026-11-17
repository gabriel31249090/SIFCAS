---
tipo: inventario-gerado
fonte: "app/painel-institucional/demo-cleanup-actions.ts"
verificado_em: 2026-11-17T14:58:27.318Z
commit_base: d705518e13bf72a73ebddd2c9aa99ed568527782
sha256: bbd810edc2137906812d3e91a817f87d94004ebdf675b0371fd21b4c7eb9cdc6
hash_formato: sha256-utf8-lf-v1
---

# app/painel-institucional/demo-cleanup-actions.ts

Categoria: **Documentacao**. 8263 bytes; 184 linhas.

[Fonte no repositório](../../../../app/painel-institucional/demo-cleanup-actions.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Institucional-e-servicos]] · [[20-Catalogo/Indice]]

## Símbolos exportados

- `confirmDemoCleanup`
- `DemoCleanupResult`
- `previewDemoCleanup`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--config.ts--3fda3e56|lib/supabase/config.ts]]

## Dados e autorização identificados

Tabelas consultadas: `institutional_identity_records`.

RPCs: `sifcas_demo_cleanup_content`, `sifcas_demo_cleanup_finish`, `sifcas_demo_cleanup_preview`.

Guards encontrados: requireAccount. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
