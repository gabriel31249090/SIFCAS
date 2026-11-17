---
tipo: inventario-gerado
fonte: "app/nova-senha/actions.ts"
verificado_em: 2026-11-17T14:58:27.318Z
commit_base: d705518e13bf72a73ebddd2c9aa99ed568527782
sha256: 855241428494d511a3d8b5c292d6001629ba2057e73e99e3e5cf99f709807c6f
hash_formato: sha256-utf8-lf-v1
---

# app/nova-senha/actions.ts

Categoria: **Acoes**. 1000 bytes; 24 linhas.

[Fonte no repositório](../../../../app/nova-senha/actions.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Auth-perfis-e-RLS]] · [[20-Catalogo/Indice]]

## Símbolos exportados

- `updatePassword`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/lib--compromised-password.ts--2c580bd8|lib/compromised-password.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: nenhuma referência literal `.from()`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: auth.getClaims. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
