---
tipo: inventario-gerado
fonte: "app/tcc/actions.ts"
verificado_em: 2026-11-17T14:41:06.597Z
commit_base: b73b65b1ec73157996650139f5cb2a4650f7be40
sha256: b598f89442c08c18fe84a9240221418b65f73979b331c402cd4237746f6f3ea9
hash_formato: sha256-utf8-lf-v1
---

# app/tcc/actions.ts

Categoria: **Acoes**. 3186 bytes; 62 linhas.

[Fonte no repositório](../../../../app/tcc/actions.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Institucional-e-servicos]] · [[20-Catalogo/Indice]]

## Símbolos exportados

- `createTccDefense`
- `updateTccDefense`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: `courses`, `profiles`, `tcc_defenses`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: requireAccount. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
