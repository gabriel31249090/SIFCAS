---
tipo: inventario-gerado
fonte: "lib/integrated-modules.ts"
verificado_em: 2026-11-12T16:48:34.196Z
commit_base: f341b358dcc9c0b4bb783ddd459cc7918cdb77eb
sha256: d57ecce985544e858558137ff716aa44d6968d56560495106a3c5f1aeee04cc7
hash_formato: sha256-utf8-lf-v1
---

# lib/integrated-modules.ts

Categoria: **Bibliotecas**. 7964 bytes; 108 linhas.

[Fonte no repositório](../../../../lib/integrated-modules.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Arquitetura-e-navegacao]] · [[20-Catalogo/Indice]]

## Símbolos exportados

- `AidApplication`
- `AidProgram`
- `ElectronicProcess`
- `InstitutionalProject`
- `InternshipApplication`
- `InternshipOpportunity`
- `listAidPrograms`
- `listInternships`
- `listProcesses`
- `listProjects`
- `listTccDefenses`
- `ProcessMovement`
- `ProjectApplication`
- `TccDefense`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: `courses`, `electronic_processes`, `institutional_projects`, `internship_applications`, `internship_opportunities`, `process_movements`, `profiles`, `project_applications`, `student_aid_applications`, `student_aid_programs`, `tcc_defenses`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: nenhum padrão reconhecido neste arquivo. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
