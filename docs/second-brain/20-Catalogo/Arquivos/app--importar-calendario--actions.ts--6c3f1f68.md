---
tipo: inventario-gerado
fonte: "app/importar-calendario/actions.ts"
verificado_em: 2026-11-13T15:58:18.928Z
commit_base: 9f270e354b18c60fc4c493749c13ce8c544026df
sha256: 505db503bd23d681433e1e823476a6c08d0915c0a7c8af4feb3da37f7a28fdc4
hash_formato: sha256-utf8-lf-v1
---

# app/importar-calendario/actions.ts

Categoria: **Acoes**. 2304 bytes; 40 linhas.

[Fonte no repositório](../../../../app/importar-calendario/actions.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Integracoes-e-limites]] · [[20-Catalogo/Indice]]

## Símbolos exportados

- `clearPersonalCalendar`
- `importPersonalCalendar`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--csv.ts--95fd9b83|lib/csv.ts]]
- [[20-Catalogo/Arquivos/lib--ical.ts--26dea6c1|lib/ical.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: nenhuma referência literal `.from()`.

RPCs: `clear_personal_calendar`, `import_personal_calendar`.

Guards encontrados: requireAccount. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
