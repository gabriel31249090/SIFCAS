---
tipo: inventario-gerado
fonte: "app/painel-institucional/actions.ts"
verificado_em: 2026-11-17T14:41:06.597Z
commit_base: b73b65b1ec73157996650139f5cb2a4650f7be40
sha256: b11c72a202bd8e0ac925a3e7073e70c7814a752775c1cb6cab031cfe708cf96f
hash_formato: sha256-utf8-lf-v1
---

# app/painel-institucional/actions.ts

Categoria: **Acoes**. 8535 bytes; 200 linhas.

[Fonte no repositório](../../../../app/painel-institucional/actions.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Institucional-e-servicos]] · [[20-Catalogo/Indice]]

## Símbolos exportados

- `addPublicationAttachment`
- `createPublication`
- `setPublicationStatus`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--institutional.ts--1442f4dd|lib/institutional.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: `institutional_publications`, `publication_attachments`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: requireAccount. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
