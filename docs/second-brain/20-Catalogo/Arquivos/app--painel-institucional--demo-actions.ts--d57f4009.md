---
tipo: inventario-gerado
fonte: "app/painel-institucional/demo-actions.ts"
verificado_em: 2026-11-17T14:58:27.318Z
commit_base: d705518e13bf72a73ebddd2c9aa99ed568527782
sha256: ff20a57f00d5aeb14dcb8a906951a8a78a935029a06e6c149d94311369982fbc
hash_formato: sha256-utf8-lf-v1
---

# app/painel-institucional/demo-actions.ts

Categoria: **Documentacao**. 6180 bytes; 129 linhas.

[Fonte no repositório](../../../../app/painel-institucional/demo-actions.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Institucional-e-servicos]] · [[20-Catalogo/Indice]]

## Símbolos exportados

- `DemoSetupResult`
- `prepareSifcasDemo`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--compromised-password.ts--2c580bd8|lib/compromised-password.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--config.ts--3fda3e56|lib/supabase/config.ts]]

## Dados e autorização identificados

Tabelas consultadas: `institutional_identity_records`.

RPCs: `sifcas_demo_populate_academic`, `sifcas_demo_populate_extras`.

Guards encontrados: requireAccount. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
