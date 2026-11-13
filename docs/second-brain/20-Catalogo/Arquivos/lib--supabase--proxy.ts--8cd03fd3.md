---
tipo: inventario-gerado
fonte: "lib/supabase/proxy.ts"
verificado_em: 2026-11-13T10:48:20.170Z
commit_base: c1fe354f5cddb3ce1509f71ba135d9ca59c76203
sha256: e0da2dc4fcee485884379876179b1a552826d17b9ed86669984274c01bcd0716
hash_formato: sha256-utf8-lf-v1
---

# lib/supabase/proxy.ts

Categoria: **Bibliotecas**. 5346 bytes; 133 linhas.

[Fonte no repositório](../../../../lib/supabase/proxy.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Auth-perfis-e-RLS]] · [[10-Mapas/Integracoes-e-limites]] · [[20-Catalogo/Indice]]

## Símbolos exportados

- `updateSession`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/lib--supabase--config.ts--3fda3e56|lib/supabase/config.ts]]

## Dados e autorização identificados

Tabelas consultadas: `profiles`, `user_roles`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: auth.getClaims. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
