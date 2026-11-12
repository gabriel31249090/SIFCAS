---
tipo: inventario-gerado
fonte: "app/pessoas/page.tsx"
verificado_em: 2026-11-12T16:48:34.196Z
commit_base: f341b358dcc9c0b4bb783ddd459cc7918cdb77eb
sha256: 3e0323eee0e7640436a4d786666658f9263adcee856ee0fd399101589c24e567
hash_formato: sha256-utf8-lf-v1
---

# app/pessoas/page.tsx

Categoria: **Rotas**. 3586 bytes; 48 linhas.

[Fonte no repositório](../../../../app/pessoas/page.tsx). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Arquitetura-e-navegacao]] · [[20-Catalogo/Indice]]

Rota do App Router: `/pessoas`.

## Símbolos exportados

- `PeoplePage`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/components--UI.tsx--4b5b8820|components/UI.tsx]]
- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: `profiles`, `user_roles`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: requireAccount. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
