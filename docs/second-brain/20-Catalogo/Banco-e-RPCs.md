# Contratos de banco e RPCs

**Não há baseline remota verificada.** Uma referência no código não prova que o objeto exista ou tenha RLS correto no projeto remoto. Declarações SQL podem pertencer a fixtures mínimas ou patches isolados. Não aplicar automaticamente.

[[10-Mapas/Auth-perfis-e-RLS]] · [[10-Mapas/Academico-e-importacoes]] · [[20-Catalogo/Indice]]

## Tabelas referenciadas ou declaradas

### academic_assessments

- [[20-Catalogo/Arquivos/app--diario-professor--actions.ts--f6834158|app/diario-professor/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--diary.ts--e56a4afb|lib/diary.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--experience.ts--370a8326|lib/experience.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--teacher-workspace.ts--2cca3d98|lib/teacher-workspace.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local
- [[20-Catalogo/Arquivos/tests--fixtures--academic-browser.sql--9983fc72|tests/fixtures/academic-browser.sql]] — declaração SQL local

### academic_documents

- [[20-Catalogo/Arquivos/app--documentos-academicos--actions.ts--866899b4|app/documentos-academicos/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--documents.ts--a22a87cf|lib/documents.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--maisa--context.ts--537fca7e|lib/maisa/context.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### academic_import_audit

- [[20-Catalogo/Arquivos/supabase--isolated--academic-import.sql--84540a9b|supabase/isolated/academic-import.sql]] — declaração SQL local

### academic_import_batches

- [[20-Catalogo/Arquivos/lib--academic-import-server.ts--bb1df26c|lib/academic-import-server.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--teacher-workspace.ts--2cca3d98|lib/teacher-workspace.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--isolated--academic-import.sql--84540a9b|supabase/isolated/academic-import.sql]] — declaração SQL local

### academic_import_diaries

- [[20-Catalogo/Arquivos/lib--academic-import-server.ts--bb1df26c|lib/academic-import-server.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--isolated--academic-import.sql--84540a9b|supabase/isolated/academic-import.sql]] — declaração SQL local

### academic_import_operator_scopes

- [[20-Catalogo/Arquivos/supabase--isolated--academic-import.sql--84540a9b|supabase/isolated/academic-import.sql]] — declaração SQL local

### academic_import_records

- [[20-Catalogo/Arquivos/lib--academic-import-server.ts--bb1df26c|lib/academic-import-server.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--isolated--academic-import.sql--84540a9b|supabase/isolated/academic-import.sql]] — declaração SQL local

### academic_import_student_links

- [[20-Catalogo/Arquivos/supabase--isolated--academic-import.sql--84540a9b|supabase/isolated/academic-import.sql]] — declaração SQL local

### academic_periods

- [[20-Catalogo/Arquivos/app--gestao-academica--actions.ts--b9461ba5|app/gestao-academica/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--gestao-academica--page.tsx--cbfd7b6c|app/gestao-academica/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--academic.ts--f1f43c21|lib/academic.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--documents.ts--a22a87cf|lib/documents.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--teacher-workspace.ts--2cca3d98|lib/teacher-workspace.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local
- [[20-Catalogo/Arquivos/tests--fixtures--academic-browser.sql--9983fc72|tests/fixtures/academic-browser.sql]] — declaração SQL local

### attendance_records

- [[20-Catalogo/Arquivos/app--diario-professor--actions.ts--f6834158|app/diario-professor/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--diary.ts--e56a4afb|lib/diary.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local
- [[20-Catalogo/Arquivos/tests--fixtures--academic-browser.sql--9983fc72|tests/fixtures/academic-browser.sql]] — declaração SQL local

### audit_logs

- [[20-Catalogo/Arquivos/app--auditoria--page.tsx--094b3726|app/auditoria/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--monitoramento--page.tsx--1082a09e|app/monitoramento/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### bug_reports

- [[20-Catalogo/Arquivos/app--reportar-erro--actions.ts--b37796a3|app/reportar-erro/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--experience.ts--370a8326|lib/experience.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local
- [[20-Catalogo/Arquivos/tests--fixtures--academic-browser.sql--9983fc72|tests/fixtures/academic-browser.sql]] — declaração SQL local

### campuses

- [[20-Catalogo/Arquivos/app--gestao-academica--page.tsx--cbfd7b6c|app/gestao-academica/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--academic.ts--f1f43c21|lib/academic.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--documents.ts--a22a87cf|lib/documents.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--institutional.ts--1442f4dd|lib/institutional.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local
- [[20-Catalogo/Arquivos/tests--fixtures--academic-browser.sql--9983fc72|tests/fixtures/academic-browser.sql]] — declaração SQL local

### class_agenda_entries

- [[20-Catalogo/Arquivos/app--agenda-aluno--actions.ts--990e9d74|app/agenda-aluno/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--academic.ts--f1f43c21|lib/academic.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local
- [[20-Catalogo/Arquivos/tests--fixtures--academic-browser.sql--9983fc72|tests/fixtures/academic-browser.sql]] — declaração SQL local

### class_schedules

- [[20-Catalogo/Arquivos/app--gestao-academica--actions.ts--b9461ba5|app/gestao-academica/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--gestao-academica--page.tsx--cbfd7b6c|app/gestao-academica/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--academic.ts--f1f43c21|lib/academic.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local
- [[20-Catalogo/Arquivos/tests--fixtures--academic-browser.sql--9983fc72|tests/fixtures/academic-browser.sql]] — declaração SQL local

### class_sessions

- [[20-Catalogo/Arquivos/app--diario-professor--actions.ts--f6834158|app/diario-professor/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--diary.ts--e56a4afb|lib/diary.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--teacher-workspace.ts--2cca3d98|lib/teacher-workspace.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local
- [[20-Catalogo/Arquivos/tests--fixtures--academic-browser.sql--9983fc72|tests/fixtures/academic-browser.sql]] — declaração SQL local

### class_subjects

- [[20-Catalogo/Arquivos/app--gestao-academica--actions.ts--b9461ba5|app/gestao-academica/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--gestao-academica--page.tsx--cbfd7b6c|app/gestao-academica/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--academic.ts--f1f43c21|lib/academic.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--diary-security.ts--4d1f95ab|lib/diary-security.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--diary.ts--e56a4afb|lib/diary.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--experience.ts--370a8326|lib/experience.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--teacher-workspace.ts--2cca3d98|lib/teacher-workspace.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--isolated--academic-import.fixture.sql--fce195fa|supabase/isolated/academic-import.fixture.sql]] — declaração SQL local
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### classes

- [[20-Catalogo/Arquivos/app--gestao-academica--actions.ts--b9461ba5|app/gestao-academica/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--gestao-academica--page.tsx--cbfd7b6c|app/gestao-academica/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--academic.ts--f1f43c21|lib/academic.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--diary.ts--e56a4afb|lib/diary.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--documents.ts--a22a87cf|lib/documents.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--teacher-workspace.ts--2cca3d98|lib/teacher-workspace.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--isolated--academic-import.fixture.sql--fce195fa|supabase/isolated/academic-import.fixture.sql]] — declaração SQL local
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### courses

- [[20-Catalogo/Arquivos/app--gestao-academica--actions.ts--b9461ba5|app/gestao-academica/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--gestao-academica--page.tsx--cbfd7b6c|app/gestao-academica/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--tcc--actions.ts--eb3e7a82|app/tcc/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--tcc--page.tsx--347ad926|app/tcc/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--academic.ts--f1f43c21|lib/academic.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--documents.ts--a22a87cf|lib/documents.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--integrated-modules.ts--7bfd8902|lib/integrated-modules.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local
- [[20-Catalogo/Arquivos/tests--fixtures--academic-browser.sql--9983fc72|tests/fixtures/academic-browser.sql]] — declaração SQL local

### electronic_processes

- [[20-Catalogo/Arquivos/app--processos--actions.ts--842dea8e|app/processos/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--integrated-modules.ts--7bfd8902|lib/integrated-modules.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--maisa--context.ts--537fca7e|lib/maisa/context.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--pending.ts--890ab95c|lib/pending.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### enrollments

- [[20-Catalogo/Arquivos/app--gestao-academica--actions.ts--b9461ba5|app/gestao-academica/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--gestao-academica--page.tsx--cbfd7b6c|app/gestao-academica/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--academic.ts--f1f43c21|lib/academic.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--diary-security.ts--4d1f95ab|lib/diary-security.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--diary.ts--e56a4afb|lib/diary.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--documents.ts--a22a87cf|lib/documents.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--maisa--context.ts--537fca7e|lib/maisa/context.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--teacher-workspace.ts--2cca3d98|lib/teacher-workspace.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--isolated--academic-import.fixture.sql--fce195fa|supabase/isolated/academic-import.fixture.sql]] — declaração SQL local
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### grades

- [[20-Catalogo/Arquivos/app--diario-professor--actions.ts--f6834158|app/diario-professor/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--diary.ts--e56a4afb|lib/diary.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local
- [[20-Catalogo/Arquivos/tests--fixtures--academic-browser.sql--9983fc72|tests/fixtures/academic-browser.sql]] — declaração SQL local

### institutional_identity_records

- [[20-Catalogo/Arquivos/app--vinculos-institucionais--page.tsx--3c749cdf|app/vinculos-institucionais/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### institutional_import_batches

- [[20-Catalogo/Arquivos/app--vinculos-institucionais--page.tsx--3c749cdf|app/vinculos-institucionais/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### institutional_projects

- [[20-Catalogo/Arquivos/app--projetos--actions.ts--bb247ac6|app/projetos/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--integrated-modules.ts--7bfd8902|lib/integrated-modules.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--maisa--context.ts--537fca7e|lib/maisa/context.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### institutional_publications

- [[20-Catalogo/Arquivos/app--monitoramento--page.tsx--1082a09e|app/monitoramento/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--painel-institucional--actions.ts--1a4e695e|app/painel-institucional/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--institutional.ts--1442f4dd|lib/institutional.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### internship_applications

- [[20-Catalogo/Arquivos/app--estagios--actions.ts--f5d2eba1|app/estagios/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--integrated-modules.ts--7bfd8902|lib/integrated-modules.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--pending.ts--890ab95c|lib/pending.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### internship_opportunities

- [[20-Catalogo/Arquivos/app--estagios--actions.ts--f5d2eba1|app/estagios/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--integrated-modules.ts--7bfd8902|lib/integrated-modules.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--maisa--context.ts--537fca7e|lib/maisa/context.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### knowledge_articles

- [[20-Catalogo/Arquivos/lib--experience.ts--370a8326|lib/experience.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### notification_preferences

- [[20-Catalogo/Arquivos/app--preferencias-notificacoes--actions.ts--4a26075e|app/preferencias-notificacoes/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--experience.ts--370a8326|lib/experience.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### notifications

- [[20-Catalogo/Arquivos/app--notificacoes--actions.ts--4f9997de|app/notificacoes/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--experience.ts--370a8326|lib/experience.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--institutional.ts--1442f4dd|lib/institutional.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--pending.ts--890ab95c|lib/pending.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local
- [[20-Catalogo/Arquivos/tests--fixtures--academic-browser.sql--9983fc72|tests/fixtures/academic-browser.sql]] — declaração SQL local

### personal_calendar_events

- [[20-Catalogo/Arquivos/components--PersonalCalendar.tsx--79049461|components/PersonalCalendar.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--home-today-server.ts--a747b4e9|lib/home-today-server.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--isolated--personal-calendar.sql--710066e7|supabase/isolated/personal-calendar.sql]] — declaração SQL local

### process_movements

- [[20-Catalogo/Arquivos/lib--integrated-modules.ts--7bfd8902|lib/integrated-modules.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### profiles

- [[20-Catalogo/Arquivos/app--auditoria--page.tsx--094b3726|app/auditoria/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--gestao-academica--actions.ts--b9461ba5|app/gestao-academica/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--gestao-academica--page.tsx--cbfd7b6c|app/gestao-academica/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--login--actions.ts--168e825f|app/login/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--monitoramento--page.tsx--1082a09e|app/monitoramento/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--perfil--actions.ts--96bbaf0a|app/perfil/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--pessoas--page.tsx--7ab1d215|app/pessoas/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--solicitacoes--page.tsx--7c6440f8|app/solicitacoes/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--tcc--actions.ts--eb3e7a82|app/tcc/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--tcc--page.tsx--347ad926|app/tcc/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--usuarios--page.tsx--ec7d8ca0|app/usuarios/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--diary.ts--e56a4afb|lib/diary.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--documents.ts--a22a87cf|lib/documents.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--integrated-modules.ts--7bfd8902|lib/integrated-modules.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--maisa--context.ts--537fca7e|lib/maisa/context.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--supabase--proxy.ts--8cd03fd3|lib/supabase/proxy.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--isolated--academic-import.fixture.sql--fce195fa|supabase/isolated/academic-import.fixture.sql]] — declaração SQL local
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### project_applications

- [[20-Catalogo/Arquivos/app--projetos--actions.ts--bb247ac6|app/projetos/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--integrated-modules.ts--7bfd8902|lib/integrated-modules.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--pending.ts--890ab95c|lib/pending.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### publication_attachments

- [[20-Catalogo/Arquivos/app--api--anexos--_id_--route.ts--82884916|app/api/anexos/[id]/route.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--monitoramento--page.tsx--1082a09e|app/monitoramento/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--painel-institucional--actions.ts--1a4e695e|app/painel-institucional/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--institutional.ts--1442f4dd|lib/institutional.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### service_requests

- [[20-Catalogo/Arquivos/app--api--maisa--actions--service-request--route.ts--6b3a268f|app/api/maisa/actions/service-request/route.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--monitoramento--page.tsx--1082a09e|app/monitoramento/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--solicitacoes--actions.ts--fc591195|app/solicitacoes/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--solicitacoes--page.tsx--7c6440f8|app/solicitacoes/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--experience.ts--370a8326|lib/experience.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--maisa--context.ts--537fca7e|lib/maisa/context.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--pending.ts--890ab95c|lib/pending.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local
- [[20-Catalogo/Arquivos/tests--fixtures--academic-browser.sql--9983fc72|tests/fixtures/academic-browser.sql]] — declaração SQL local

### student_aid_applications

- [[20-Catalogo/Arquivos/app--auxilios--actions.ts--30b69292|app/auxilios/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--integrated-modules.ts--7bfd8902|lib/integrated-modules.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--pending.ts--890ab95c|lib/pending.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### student_aid_programs

- [[20-Catalogo/Arquivos/app--auxilios--actions.ts--30b69292|app/auxilios/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--integrated-modules.ts--7bfd8902|lib/integrated-modules.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--maisa--context.ts--537fca7e|lib/maisa/context.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### subjects

- [[20-Catalogo/Arquivos/app--gestao-academica--actions.ts--b9461ba5|app/gestao-academica/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--gestao-academica--page.tsx--cbfd7b6c|app/gestao-academica/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--academic.ts--f1f43c21|lib/academic.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--diary.ts--e56a4afb|lib/diary.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--experience.ts--370a8326|lib/experience.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--teacher-workspace.ts--2cca3d98|lib/teacher-workspace.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local
- [[20-Catalogo/Arquivos/tests--fixtures--academic-browser.sql--9983fc72|tests/fixtures/academic-browser.sql]] — declaração SQL local

### tcc_defenses

- [[20-Catalogo/Arquivos/app--tcc--actions.ts--eb3e7a82|app/tcc/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--integrated-modules.ts--7bfd8902|lib/integrated-modules.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--maisa--context.ts--537fca7e|lib/maisa/context.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--pending.ts--890ab95c|lib/pending.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### teaching_assignments

- [[20-Catalogo/Arquivos/app--gestao-academica--actions.ts--b9461ba5|app/gestao-academica/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--gestao-academica--page.tsx--cbfd7b6c|app/gestao-academica/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--academic.ts--f1f43c21|lib/academic.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--diary-security.ts--4d1f95ab|lib/diary-security.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--diary.ts--e56a4afb|lib/diary.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--teacher-workspace.ts--2cca3d98|lib/teacher-workspace.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--isolated--academic-import.fixture.sql--fce195fa|supabase/isolated/academic-import.fixture.sql]] — declaração SQL local
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### user_roles

- [[20-Catalogo/Arquivos/app--gestao-academica--actions.ts--b9461ba5|app/gestao-academica/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--gestao-academica--page.tsx--cbfd7b6c|app/gestao-academica/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--pessoas--page.tsx--7ab1d215|app/pessoas/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--solicitacoes--page.tsx--7c6440f8|app/solicitacoes/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--tcc--page.tsx--347ad926|app/tcc/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--usuarios--actions.ts--bfcfb35a|app/usuarios/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/app--usuarios--page.tsx--ec7d8ca0|app/usuarios/page.tsx]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--auth.ts--cd41b427|lib/auth.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--supabase--proxy.ts--8cd03fd3|lib/supabase/proxy.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--isolated--academic-import.fixture.sql--fce195fa|supabase/isolated/academic-import.fixture.sql]] — declaração SQL local
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local

### user_shortcuts

- [[20-Catalogo/Arquivos/app--atalhos--actions.ts--c6ae5e99|app/atalhos/actions.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/lib--experience.ts--370a8326|lib/experience.ts]] — consulta literal no código
- [[20-Catalogo/Arquivos/supabase--tests_nao_deletar_GGG--test.sql--029834fb|supabase/tests não deletar GGG/test.sql]] — declaração SQL local
- [[20-Catalogo/Arquivos/tests--fixtures--academic-browser.sql--9983fc72|tests/fixtures/academic-browser.sql]] — declaração SQL local

## RPCs chamadas ou funções SQL declaradas

### academic_import_can_access

- [[20-Catalogo/Arquivos/supabase--isolated--academic-import.sql--84540a9b|supabase/isolated/academic-import.sql]] — declaração SQL local

### academic_import_conflicts

- [[20-Catalogo/Arquivos/supabase--isolated--academic-import.sql--84540a9b|supabase/isolated/academic-import.sql]] — declaração SQL local

### academic_import_validate

- [[20-Catalogo/Arquivos/supabase--isolated--academic-import.sql--84540a9b|supabase/isolated/academic-import.sql]] — declaração SQL local

### admin_set_account_status

- [[20-Catalogo/Arquivos/app--usuarios--actions.ts--bfcfb35a|app/usuarios/actions.ts]] — chamada no código
- [[20-Catalogo/Arquivos/supabase--patches--admin-account-status.sql--16c898c5|supabase/patches/admin-account-status.sql]] — declaração SQL local

### advance_electronic_process

- [[20-Catalogo/Arquivos/app--processos--actions.ts--842dea8e|app/processos/actions.ts]] — chamada no código

### apply_academic_import

- [[20-Catalogo/Arquivos/app--importar-dados-academicos--actions.ts--1f12d48e|app/importar-dados-academicos/actions.ts]] — chamada no código
- [[20-Catalogo/Arquivos/supabase--isolated--academic-import.sql--84540a9b|supabase/isolated/academic-import.sql]] — declaração SQL local

### apply_institutional_batch

- [[20-Catalogo/Arquivos/app--vinculos-institucionais--actions.ts--8d854dae|app/vinculos-institucionais/actions.ts]] — chamada no código

### auth.uid

- [[20-Catalogo/Arquivos/supabase--isolated--academic-import.fixture.sql--fce195fa|supabase/isolated/academic-import.fixture.sql]] — declaração SQL local

### cancel_academic_import

- [[20-Catalogo/Arquivos/app--importar-dados-academicos--actions.ts--1f12d48e|app/importar-dados-academicos/actions.ts]] — chamada no código
- [[20-Catalogo/Arquivos/supabase--isolated--academic-import.sql--84540a9b|supabase/isolated/academic-import.sql]] — declaração SQL local

### clear_personal_calendar

- [[20-Catalogo/Arquivos/app--importar-calendario--actions.ts--6c3f1f68|app/importar-calendario/actions.ts]] — chamada no código
- [[20-Catalogo/Arquivos/supabase--isolated--personal-calendar.sql--710066e7|supabase/isolated/personal-calendar.sql]] — declaração SQL local

### fixture_can_class

- [[20-Catalogo/Arquivos/tests--fixtures--academic-browser.sql--9983fc72|tests/fixtures/academic-browser.sql]] — declaração SQL local

### get_transparency_snapshot

- [[20-Catalogo/Arquivos/app--transparencia--page.tsx--906370d6|app/transparencia/page.tsx]] — chamada no código

### import_institutional_records

- [[20-Catalogo/Arquivos/app--vinculos-institucionais--actions.ts--8d854dae|app/vinculos-institucionais/actions.ts]] — chamada no código

### import_personal_calendar

- [[20-Catalogo/Arquivos/app--importar-calendario--actions.ts--6c3f1f68|app/importar-calendario/actions.ts]] — chamada no código
- [[20-Catalogo/Arquivos/supabase--isolated--personal-calendar.sql--710066e7|supabase/isolated/personal-calendar.sql]] — declaração SQL local

### preview_academic_import

- [[20-Catalogo/Arquivos/app--importar-dados-academicos--actions.ts--1f12d48e|app/importar-dados-academicos/actions.ts]] — chamada no código
- [[20-Catalogo/Arquivos/supabase--isolated--academic-import.sql--84540a9b|supabase/isolated/academic-import.sql]] — declaração SQL local

### purge_expired_academic_imports

- [[20-Catalogo/Arquivos/supabase--isolated--academic-import.sql--84540a9b|supabase/isolated/academic-import.sql]] — declaração SQL local

### resync_institutional_academics

- [[20-Catalogo/Arquivos/app--vinculos-institucionais--actions.ts--8d854dae|app/vinculos-institucionais/actions.ts]] — chamada no código

### sifcas_health

- [[20-Catalogo/Arquivos/app--api--health--route.ts--949aae3a|app/api/health/route.ts]] — chamada no código
- [[20-Catalogo/Arquivos/app--monitoramento--page.tsx--1082a09e|app/monitoramento/page.tsx]] — chamada no código
- [[20-Catalogo/Arquivos/tests--fixtures--academic-browser.sql--9983fc72|tests/fixtures/academic-browser.sql]] — declaração SQL local
