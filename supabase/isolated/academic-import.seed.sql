-- Executar só após fixture.sql e academic-import.sql em ambiente descartável.
insert into public.academic_import_diaries(id,class_subject_id,instance,external_id,period,label) values
 ('20000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000003','sifcas-layout','000123','2026/2','Turma sintética A • Matemática'),
 ('20000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000004','sifcas-layout','000124','2026/2','Turma sintética B • Física');
insert into public.academic_import_student_links values
 ('20000000-0000-0000-0000-000000000005','000001','20000000-0000-0000-0000-000000000007'),
 ('20000000-0000-0000-0000-000000000005','000002','20000000-0000-0000-0000-000000000008');
