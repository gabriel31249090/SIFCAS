---
tipo: inventario-gerado
fonte: "tests/fixtures/academic-browser.sql"
verificado_em: 2026-11-13T10:48:20.170Z
commit_base: c1fe354f5cddb3ce1509f71ba135d9ca59c76203
sha256: b06d24f47e3d7eec5761807968b79f23ee4c36404cc8ed7efc99ce204cef3e39
hash_formato: sha256-utf8-lf-v1
---

# tests/fixtures/academic-browser.sql

Categoria: **Testes-e-auditoria**. 12941 bytes; 104 linhas.

[Fonte no repositório](../../../../tests/fixtures/academic-browser.sql). Formato: sha256-utf8-lf-v1. Texto usa UTF-8 com finais de linha LF; bin?rios preservam bytes originais. Compare o SHA-256 can?nico com o manifesto antes de confiar nesta ficha.

[[10-Mapas/Academico-e-importacoes]] · [[10-Mapas/Testes-deploy-e-operacoes]] · [[20-Catalogo/Indice]]

## Símbolos exportados

Nenhum identificado pela extração estática.

## Dependências locais resolvidas

Nenhum identificado pela extração estática.

## Dados e autorização identificados

Tabelas consultadas: nenhuma referência literal `.from()`.

RPCs: nenhuma referência literal `.rpc()`.

Guards encontrados: SECURITY DEFINER (revisar grants e corpo SQL). Ausência nesta extração não significa acesso público; confira proxy, chamadores, ações e RLS.

Objetos SQL declarados:

- `tabela: academic_assessments`
- `tabela: academic_periods`
- `tabela: attendance_records`
- `tabela: bug_reports`
- `tabela: campuses`
- `tabela: class_agenda_entries`
- `tabela: class_schedules`
- `tabela: class_sessions`
- `tabela: courses`
- `tabela: grades`
- `tabela: notifications`
- `tabela: service_requests`
- `tabela: subjects`
- `tabela: user_shortcuts`
- `função: fixture_can_class`
- `função: sifcas_health`
- `política: fixture_agenda_read`
- `política: fixture_assessments_read`
- `política: fixture_attendance_read`
- `política: fixture_classes_read`
- `política: fixture_enrollments_read`
- `política: fixture_grades_read`
- `política: fixture_notifications`
- `política: fixture_profile_read`
- `política: fixture_reports`
- `política: fixture_requests`
- `política: fixture_role_read`
- `política: fixture_schedules_read`
- `política: fixture_sessions_read`
- `política: fixture_shortcuts`
- `política: fixture_subjects_read`
- `política: fixture_teachers_read`
- `RLS habilitado no arquivo: academic_assessments`
- `RLS habilitado no arquivo: attendance_records`
- `RLS habilitado no arquivo: bug_reports`
- `RLS habilitado no arquivo: class_agenda_entries`
- `RLS habilitado no arquivo: class_schedules`
- `RLS habilitado no arquivo: class_sessions`
- `RLS habilitado no arquivo: class_subjects`
- `RLS habilitado no arquivo: classes`
- `RLS habilitado no arquivo: enrollments`
- `RLS habilitado no arquivo: grades`
- `RLS habilitado no arquivo: notifications`
- `RLS habilitado no arquivo: profiles`
- `RLS habilitado no arquivo: service_requests`
- `RLS habilitado no arquivo: teaching_assignments`
- `RLS habilitado no arquivo: user_roles`
- `RLS habilitado no arquivo: user_shortcuts`

## Limite desta evidência

Ficha gerada por padrões estáticos em arquivos locais. Não executa o módulo, não resolve SQL dinâmico nem comprova disponibilidade, permissão remota ou aprovação institucional. Volte ao código para decisões.
