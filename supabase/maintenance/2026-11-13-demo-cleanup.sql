-- SIFCAS 2026-11-13: installation snapshot for the general-admin DEMO cleanup.
-- This is NOT an automatic migration; functions were already applied to the connected
-- production database and verified inside a BEGIN/ROLLBACK transaction.
-- Review this file and ensure your own project is correct before replaying it.

CREATE OR REPLACE FUNCTION public.sifcas_demo_cleanup_content()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE v jsonb;
BEGIN
 IF current_user NOT IN ('service_role','postgres') THEN
    RAISE EXCEPTION 'Operação exclusiva do serviço administrativo' USING ERRCODE='42501';
 END IF;
 SELECT public.sifcas_demo_cleanup_preview() INTO v;
 IF coalesce((v->>'safe')::boolean,false) IS NOT TRUE THEN
    RAISE EXCEPTION 'A prévia encontrou riscos, nenhuma exclusão foi feita: %',v->'blockers' USING ERRCODE='42501';
 END IF;

 IF EXISTS (
  SELECT 1 FROM public.teaching_assignments t
  JOIN public.class_subjects cs ON cs.id=t.class_subject_id
  JOIN public.classes cl ON cl.id=cs.class_id JOIN public.courses co ON co.id=cl.course_id
  WHERE co.code='DEMO-INF-2026'
   AND t.teacher_user_id NOT IN (
     SELECT matched_user_id FROM public.institutional_identity_records
     WHERE source_name='SIFCAS-DEMO-2026' AND matched_user_id IS NOT NULL)
 ) THEN RAISE EXCEPTION 'Há professor real ligado a uma turma DEMO'; END IF;
 IF EXISTS (
  SELECT 1 FROM public.enrollments e
  JOIN public.classes cl ON cl.id=e.class_id JOIN public.courses co ON co.id=cl.course_id
  WHERE co.code='DEMO-INF-2026'
   AND e.student_user_id NOT IN (
     SELECT matched_user_id FROM public.institutional_identity_records
     WHERE source_name='SIFCAS-DEMO-2026' AND matched_user_id IS NOT NULL)
 ) THEN RAISE EXCEPTION 'Há aluno real ligado a uma turma DEMO'; END IF;
 IF EXISTS (
  SELECT 1 FROM public.project_applications a
  JOIN public.institutional_projects p ON p.id=a.project_id
  WHERE p.call_reference LIKE 'SIFCAS-DEMO-2026-P%'
 ) THEN RAISE EXCEPTION 'Um projeto fictício contém candidaturas e exige revisão'; END IF;
 IF EXISTS (
  SELECT 1 FROM public.classes cl
  JOIN public.academic_periods p ON p.id=cl.academic_period_id
  JOIN public.courses co ON co.id=cl.course_id
  WHERE co.code='DEMO-INF-2026' AND p.name <> 'Período 2026 — Demonstração'
 ) THEN RAISE EXCEPTION 'Turma DEMO está relacionada a período não fictício'; END IF;
 IF EXISTS (
  SELECT 1 FROM public.tcc_defenses d
  JOIN public.courses co ON co.id=d.course_id
  WHERE co.code='DEMO-INF-2026'
 ) THEN RAISE EXCEPTION 'Há registro de TCC associado ao curso DEMO'; END IF;
 IF EXISTS (
  SELECT 1 FROM public.academic_assessments a JOIN public.class_subjects cs ON cs.id=a.class_subject_id
  JOIN public.classes cl ON cl.id=cs.class_id JOIN public.courses co ON co.id=cl.course_id
  WHERE co.code='DEMO-INF-2026' AND a.created_by NOT IN (
   SELECT matched_user_id FROM public.institutional_identity_records
   WHERE source_name='SIFCAS-DEMO-2026' AND matched_user_id IS NOT NULL)
 ) THEN RAISE EXCEPTION 'Há avaliação criada por usuário real em turma DEMO'; END IF;
 IF EXISTS (
  SELECT 1 FROM public.class_sessions a JOIN public.class_subjects cs ON cs.id=a.class_subject_id
  JOIN public.classes cl ON cl.id=cs.class_id JOIN public.courses co ON co.id=cl.course_id
  WHERE co.code='DEMO-INF-2026' AND a.created_by NOT IN (
   SELECT matched_user_id FROM public.institutional_identity_records
   WHERE source_name='SIFCAS-DEMO-2026' AND matched_user_id IS NOT NULL)
 ) THEN RAISE EXCEPTION 'Há aula criada por usuário real em turma DEMO'; END IF;
 IF EXISTS (
  SELECT 1 FROM public.class_agenda_entries a JOIN public.class_subjects cs ON cs.id=a.class_subject_id
  JOIN public.classes cl ON cl.id=cs.class_id JOIN public.courses co ON co.id=cl.course_id
  WHERE co.code='DEMO-INF-2026' AND a.author_user_id NOT IN (
   SELECT matched_user_id FROM public.institutional_identity_records
   WHERE source_name='SIFCAS-DEMO-2026' AND matched_user_id IS NOT NULL)
 ) THEN RAISE EXCEPTION 'Há evento de usuário real em turma DEMO'; END IF;

 UPDATE public.institutional_identity_records SET approval_status='rejected',updated_at=now()
 WHERE source_name='SIFCAS-DEMO-2026' AND approval_status<>'rejected';

 DELETE FROM public.notifications WHERE source_type='sifcas-demo-2026';
 DELETE FROM public.institutional_publications
 WHERE (reference_code LIKE 'SIFCAS-DEMO-2026-%' OR reference_code LIKE 'DEMO-COM-%')
 AND title LIKE '[Demonstração]%';
 DELETE FROM public.institutional_projects
 WHERE call_reference LIKE 'SIFCAS-DEMO-2026-P%' AND title LIKE '[Demonstração]%';
 DELETE FROM public.knowledge_articles
 WHERE slug LIKE 'sifcas-demo-2026-%' AND title LIKE '[Demonstração]%';

 DELETE FROM public.classes cl USING public.courses co
 WHERE cl.course_id=co.id AND co.code='DEMO-INF-2026'
   AND cl.code LIKE 'DEMO-INF-%-2026';
 DELETE FROM public.courses WHERE code='DEMO-INF-2026';
 DELETE FROM public.academic_periods
 WHERE name='Período 2026 — Demonstração'
   AND NOT EXISTS(SELECT 1 FROM public.classes cl WHERE cl.academic_period_id=academic_periods.id);
 RETURN jsonb_build_object('content_cleared',true,'identities_remaining',
 (SELECT count(*) FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026'),
 'auth_accounts_remaining',
 (SELECT count(*) FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026' AND matched_user_id IS NOT NULL));
END;
$function$;

CREATE OR REPLACE FUNCTION public.sifcas_demo_cleanup_finish()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE n integer;
BEGIN
 IF current_user NOT IN ('service_role','postgres') THEN
  RAISE EXCEPTION 'Operação exclusiva do serviço administrativo' USING ERRCODE='42501';
 END IF;
 IF EXISTS(SELECT 1 FROM public.institutional_identity_records
 WHERE source_name='SIFCAS-DEMO-2026' AND matched_user_id IS NOT NULL) THEN
  RAISE EXCEPTION 'Ainda há contas DEMO ativas; a limpeza deve terminar no Auth Admin';
 END IF;
 IF EXISTS(SELECT 1 FROM public.courses WHERE code='DEMO-INF-2026')
  OR EXISTS(SELECT 1 FROM public.institutional_publications
   WHERE reference_code LIKE 'SIFCAS-DEMO-2026-%' OR reference_code LIKE 'DEMO-COM-%')
  OR EXISTS(SELECT 1 FROM public.institutional_projects
   WHERE call_reference LIKE 'SIFCAS-DEMO-2026-P%') THEN
  RAISE EXCEPTION 'Há conteúdo DEMO pendente no banco; exclusão final bloqueada';
 END IF;
 DELETE FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026';
 GET DIAGNOSTICS n = ROW_COUNT;
 RETURN jsonb_build_object('finished',true,'deleted_demo_identity_records',n);
END;
$function$;

CREATE OR REPLACE FUNCTION public.sifcas_demo_cleanup_preview()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v JSONB;
  v_blockers text[] := '{}';
  v_count int;
BEGIN
 IF current_user NOT IN ('service_role','postgres') THEN
   RAISE EXCEPTION 'Operação exclusivamente administrativa' USING ERRCODE='42501';
 END IF;
 SELECT count(*) INTO v_count FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026';
 IF v_count NOT IN (0,69) THEN
   v_blockers := array_append(v_blockers,'Conjunto de identidades DEMO incompleto ou inesperado');
 END IF;
 IF EXISTS (
   SELECT 1 FROM public.institutional_identity_records r
   WHERE r.source_name='SIFCAS-DEMO-2026'
     AND (r.source_payload->>'synthetic' IS DISTINCT FROM 'true'
       OR r.approval_status NOT IN ('approved','rejected')
       OR NOT (
          (r.record_key='teacher-test'
             AND r.institutional_email='professorteste@gmail.com' AND r.proposed_role='teacher')
        OR (r.record_key ~ '^student-([1-9]|[1-4][0-9]|50)$'
             AND r.institutional_email='demo-'||r.record_key||'@example.com' AND r.proposed_role='student')
        OR (r.record_key ~ '^teacher-([1-9]|10)$'
             AND r.institutional_email='demo-'||r.record_key||'@example.com' AND r.proposed_role='teacher')
        OR (r.record_key ~ '^staff-[1-8]$'
             AND r.institutional_email='demo-'||r.record_key||'@example.com' AND r.proposed_role='staff')
       ))
 ) THEN
    v_blockers := array_append(v_blockers,'Identidade fora da lista sintética autorizada');
 END IF;
 IF EXISTS (
   SELECT 1 FROM public.institutional_identity_records r
   JOIN public.user_roles ur ON ur.user_id=r.matched_user_id
   WHERE r.source_name='SIFCAS-DEMO-2026'
     AND (ur.is_general_admin OR ur.role IS DISTINCT FROM r.proposed_role)
 ) THEN
    v_blockers := array_append(v_blockers,'Uma conta de teste possui privilégio ou papel inesperado');
 END IF;

 IF EXISTS (
  SELECT 1 FROM public.teaching_assignments t
  WHERE t.teacher_user_id IN (
    SELECT matched_user_id FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026'
  ) AND t.class_subject_id NOT IN (
    SELECT cs.id FROM public.class_subjects cs JOIN public.classes cl ON cl.id=cs.class_id
    JOIN public.courses c ON c.id=cl.course_id
    WHERE c.code='DEMO-INF-2026' AND cl.code LIKE 'DEMO-INF-%-2026'
  )
 ) THEN v_blockers := array_append(v_blockers,'Professor DEMO vinculado a turma não fictícia'); END IF;
 IF EXISTS (
  SELECT 1 FROM public.enrollments e
  WHERE e.student_user_id IN (
    SELECT matched_user_id FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026'
  ) AND e.class_id NOT IN (
    SELECT cl.id FROM public.classes cl JOIN public.courses c ON c.id=cl.course_id
    WHERE c.code='DEMO-INF-2026' AND cl.code LIKE 'DEMO-INF-%-2026'
  )
 ) THEN v_blockers := array_append(v_blockers,'Aluno DEMO vinculado a turma não fictícia'); END IF;
 IF EXISTS (
   SELECT 1 FROM public.classes cl JOIN public.courses c ON c.id=cl.course_id
   WHERE c.code='DEMO-INF-2026' AND cl.code NOT LIKE 'DEMO-INF-%-2026'
 ) THEN v_blockers := array_append(v_blockers,'Curso DEMO inclui turma fora do padrão'); END IF;
 IF EXISTS (
   SELECT 1 FROM public.class_subjects cs JOIN public.subjects s ON s.id=cs.subject_id
   JOIN public.courses c ON c.id=s.course_id
   JOIN public.classes cl ON cl.id=cs.class_id
   WHERE c.code='DEMO-INF-2026' AND cl.code NOT LIKE 'DEMO-INF-%-2026'
 ) THEN v_blockers := array_append(v_blockers,'Disciplina DEMO utilizada por turma fora do conjunto'); END IF;
 IF EXISTS (
   SELECT 1 FROM public.classes cl JOIN public.academic_periods ap ON ap.id=cl.academic_period_id
   WHERE ap.name='Período 2026 — Demonstração' AND cl.code NOT LIKE 'DEMO-INF-%-2026'
 ) THEN v_blockers := array_append(v_blockers,'Período DEMO utilizado por turma não fictícia'); END IF;

 -- Block every restricted or potentially real-world record authored/owned by a DEMO account.
 IF EXISTS (
  SELECT 1 FROM public.academic_assessments a WHERE a.created_by IN
  (SELECT matched_user_id FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026')
  AND a.class_subject_id NOT IN (
   SELECT cs.id FROM public.class_subjects cs JOIN public.classes cl ON cl.id=cs.class_id
   WHERE cl.code LIKE 'DEMO-INF-%-2026'
  )
 ) THEN v_blockers := array_append(v_blockers,'Avaliação não DEMO assinada por conta fictícia'); END IF;
 IF EXISTS (
  SELECT 1 FROM public.class_sessions a WHERE a.created_by IN
  (SELECT matched_user_id FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026')
  AND a.class_subject_id NOT IN (
   SELECT cs.id FROM public.class_subjects cs JOIN public.classes cl ON cl.id=cs.class_id
   WHERE cl.code LIKE 'DEMO-INF-%-2026'
  )
 ) THEN v_blockers := array_append(v_blockers,'Aula não DEMO assinada por conta fictícia'); END IF;
 IF EXISTS (
  SELECT 1 FROM public.class_agenda_entries a WHERE a.author_user_id IN
  (SELECT matched_user_id FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026')
  AND a.class_subject_id NOT IN (
   SELECT cs.id FROM public.class_subjects cs JOIN public.classes cl ON cl.id=cs.class_id
   WHERE cl.code LIKE 'DEMO-INF-%-2026'
  )
 ) THEN v_blockers := array_append(v_blockers,'Agenda não DEMO criada por conta fictícia'); END IF;
 IF EXISTS (
  SELECT 1 FROM public.institutional_publications p
  WHERE (p.created_by IN (SELECT matched_user_id FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026')
      OR p.updated_by IN (SELECT matched_user_id FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026'))
    AND NOT (
    (p.reference_code LIKE 'DEMO-COM-%' OR p.reference_code LIKE 'SIFCAS-DEMO-2026-%')
      AND p.title LIKE '[Demonstração]%'
    )
 ) THEN v_blockers := array_append(v_blockers,'Publicação não fictícia editada por conta DEMO'); END IF;
 IF EXISTS (
  SELECT 1 FROM public.institutional_projects p
  WHERE (p.created_by IN (SELECT matched_user_id FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026')
      OR p.leader_user_id IN (SELECT matched_user_id FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026'))
    AND NOT (p.call_reference LIKE 'SIFCAS-DEMO-2026-P%' AND p.title LIKE '[Demonstração]%')
 ) THEN v_blockers := array_append(v_blockers,'Projeto não DEMO assinado por conta fictícia'); END IF;
 IF EXISTS (
  SELECT 1 FROM public.knowledge_articles k
  WHERE (k.created_by IN (SELECT matched_user_id FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026')
      OR k.updated_by IN (SELECT matched_user_id FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026'))
    AND NOT (k.slug LIKE 'sifcas-demo-2026-%' AND k.title LIKE '[Demonstração]%')
 ) THEN v_blockers := array_append(v_blockers,'Artigo não fictício de conta DEMO'); END IF;

 IF EXISTS (SELECT 1 FROM public.academic_documents a
  WHERE a.issued_by IN (SELECT matched_user_id FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026')
    OR a.student_user_id IN (SELECT matched_user_id FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026')
 ) THEN v_blockers := array_append(v_blockers,'Documentos acadêmicos relacionados a DEMO exigem revisão'); END IF;
 IF EXISTS (SELECT 1 FROM public.publication_attachments a
  WHERE a.created_by IN (SELECT matched_user_id FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026')
     OR a.publication_id IN (SELECT id FROM public.institutional_publications WHERE reference_code LIKE 'DEMO-COM-%' OR reference_code LIKE 'SIFCAS-DEMO-2026-%')
 ) THEN v_blockers := array_append(v_blockers,'Anexos de publicações DEMO devem ser revisados antes da exclusão'); END IF;
 IF EXISTS (SELECT 1 FROM public.institutional_import_batches a
  WHERE a.imported_by IN (SELECT matched_user_id FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026')
 ) THEN v_blockers := array_append(v_blockers,'Importações feitas por contas DEMO exigem revisão'); END IF;
 IF EXISTS (SELECT 1 FROM public.service_requests a
  WHERE a.requester_user_id IN (SELECT matched_user_id FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026')
   OR a.assigned_to IN (SELECT matched_user_id FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026')
 ) THEN v_blockers := array_append(v_blockers,'Solicitações ligadas a DEMO exigem revisão'); END IF;
 IF EXISTS (SELECT 1 FROM public.electronic_processes a
  WHERE a.requester_user_id IN (SELECT matched_user_id FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026')
   OR a.responsible_user_id IN (SELECT matched_user_id FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026')
 ) THEN v_blockers := array_append(v_blockers,'Processos eletrônicos ligados a DEMO exigem revisão'); END IF;
 IF EXISTS (SELECT 1 FROM public.bug_reports a
  WHERE a.user_id IN (SELECT matched_user_id FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026')
   OR a.managed_by IN (SELECT matched_user_id FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026')
 ) THEN v_blockers := array_append(v_blockers,'Relatórios de bug ligados a DEMO exigem revisão'); END IF;

 SELECT jsonb_build_object(
    'safe',cardinality(v_blockers)=0 AND v_count=69,
    'blockers',to_jsonb(v_blockers),
    'fingerprint',(SELECT md5(coalesce(string_agg(record_key||':'||id::text||':'||institutional_email,'|' ORDER BY record_key),'')) FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026'),
    'identities',v_count,
    'users',(SELECT count(*) FROM public.institutional_identity_records WHERE source_name='SIFCAS-DEMO-2026' AND matched_user_id IS NOT NULL),
    'classes',(SELECT count(*) FROM public.classes c JOIN public.courses co ON co.id=c.course_id WHERE co.code='DEMO-INF-2026' AND c.code LIKE 'DEMO-INF-%-2026'),
    'enrollments',(SELECT count(*) FROM public.enrollments e JOIN public.classes c ON c.id=e.class_id WHERE c.code LIKE 'DEMO-INF-%-2026'),
    'sessions',(SELECT count(*) FROM public.class_sessions s JOIN public.class_subjects cs ON cs.id=s.class_subject_id JOIN public.classes c ON c.id=cs.class_id WHERE c.code LIKE 'DEMO-INF-%-2026'),
    'assessments',(SELECT count(*) FROM public.academic_assessments a JOIN public.class_subjects cs ON cs.id=a.class_subject_id JOIN public.classes c ON c.id=cs.class_id WHERE c.code LIKE 'DEMO-INF-%-2026'),
    'grades',(SELECT count(*) FROM public.grades g JOIN public.academic_assessments a ON a.id=g.assessment_id JOIN public.class_subjects cs ON cs.id=a.class_subject_id JOIN public.classes c ON c.id=cs.class_id WHERE c.code LIKE 'DEMO-INF-%-2026'),
    'attendance',(SELECT count(*) FROM public.attendance_records a JOIN public.class_sessions s ON s.id=a.session_id JOIN public.class_subjects cs ON cs.id=s.class_subject_id JOIN public.classes c ON c.id=cs.class_id WHERE c.code LIKE 'DEMO-INF-%-2026'),
    'calendar',(SELECT count(*) FROM public.class_agenda_entries a JOIN public.class_subjects cs ON cs.id=a.class_subject_id JOIN public.classes c ON c.id=cs.class_id WHERE c.code LIKE 'DEMO-INF-%-2026'),
    'publications',(SELECT count(*) FROM public.institutional_publications p WHERE (p.reference_code LIKE 'DEMO-COM-%' OR p.reference_code LIKE 'SIFCAS-DEMO-2026-%') AND p.title LIKE '[Demonstração]%'),
    'projects',(SELECT count(*) FROM public.institutional_projects p WHERE p.call_reference LIKE 'SIFCAS-DEMO-2026-P%' AND p.title LIKE '[Demonstração]%'),
    'articles',(SELECT count(*) FROM public.knowledge_articles k WHERE k.slug LIKE 'sifcas-demo-2026-%' AND k.title LIKE '[Demonstração]%')
  ) INTO v;
 RETURN v;
END;
$function$;

REVOKE ALL ON FUNCTION public.sifcas_demo_cleanup_preview() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sifcas_demo_cleanup_content() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sifcas_demo_cleanup_finish() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sifcas_demo_cleanup_preview() TO service_role;
GRANT EXECUTE ON FUNCTION public.sifcas_demo_cleanup_content() TO service_role;
GRANT EXECUTE ON FUNCTION public.sifcas_demo_cleanup_finish() TO service_role;
GRANT SELECT ON public.academic_documents,public.publication_attachments,public.service_requests,public.electronic_processes,public.bug_reports,public.institutional_import_batches,public.project_applications,public.tcc_defenses TO service_role;
GRANT DELETE ON public.notifications,public.institutional_publications,public.institutional_projects,public.knowledge_articles,public.classes,public.courses,public.academic_periods,public.institutional_identity_records TO service_role;

-- Restrict an unused legacy SECURITY DEFINER status helper. The web admin UI
-- writes account_status via the approved RLS path, not this RPC.
REVOKE EXECUTE ON FUNCTION public.admin_set_account_status(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_account_status(uuid,text) TO service_role;
