---
tipo: inventario-gerado
fonte: "lib/experience.ts"
verificado_em: 2026-11-13T10:48:20.170Z
commit_base: c1fe354f5cddb3ce1509f71ba135d9ca59c76203
sha256: 280d9c4bc9c875f2a7bfd8b50699fc53d52b5b7c46e5cd5f2a107d7a6fcdc689
hash_formato: sha256-utf8-lf-v1
---

# lib/experience.ts

Categoria: **Bibliotecas**. 9988 bytes; 227 linhas.

[Fonte no repositório](../../../../lib/experience.ts). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Arquitetura-e-navegacao]] · [[20-Catalogo/Indice]]

## Símbolos exportados

- `AttentionItem`
- `getHomeAttention`
- `getNotificationPreferences`
- `getShortcutCatalog`
- `getStudentAssessments`
- `KnowledgeArticle`
- `listBugReports`
- `listKnowledgeArticles`
- `listUserShortcuts`
- `NotificationPreferences`
- `ShortcutItem`
- `StudentAssessment`

## Dependências locais resolvidas

- [[20-Catalogo/Arquivos/lib--academic.ts--f1f43c21|lib/academic.ts]]
- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]]
- [[20-Catalogo/Arquivos/lib--supabase--server.ts--9a6b3950|lib/supabase/server.ts]]

## Dados e autorização identificados

Tabelas consultadas: `academic_assessments`, `bug_reports`, `class_subjects`, `knowledge_articles`, `notification_preferences`, `notifications`, `service_requests`, `subjects`, `user_shortcuts`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: nenhum padrão reconhecido neste arquivo. Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
