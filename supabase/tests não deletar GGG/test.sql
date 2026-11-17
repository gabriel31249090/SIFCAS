-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  campus text DEFAULT 'Campus Cáceres'::text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  institutional_email text,
  account_status text NOT NULL DEFAULT 'active'::text CHECK (account_status = ANY (ARRAY['active'::text, 'pending'::text, 'suspended'::text])),
  institutional_identity_id uuid,
  institutional_verified_at timestamp with time zone,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_institutional_identity_id_fkey FOREIGN KEY (institutional_identity_id) REFERENCES public.institutional_identity_records(id)
);
CREATE TABLE public.user_roles (
  user_id uuid NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'student'::app_role,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_general_admin boolean NOT NULL DEFAULT false,
  role_source text NOT NULL DEFAULT 'manual'::text CHECK (role_source = ANY (ARRAY['manual'::text, 'institutional'::text, 'unverified'::text])),
  CONSTRAINT user_roles_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.campuses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (char_length(code) >= 2 AND char_length(code) <= 20),
  name text NOT NULL,
  city text NOT NULL,
  state character NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT campuses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.academic_periods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campus_id uuid NOT NULL,
  year integer NOT NULL CHECK (year >= 2000 AND year <= 2200),
  term smallint NOT NULL CHECK (term >= 1 AND term <= 6),
  name text NOT NULL,
  starts_on date,
  ends_on date,
  status text NOT NULL DEFAULT 'planned'::text CHECK (status = ANY (ARRAY['planned'::text, 'active'::text, 'closed'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT academic_periods_pkey PRIMARY KEY (id),
  CONSTRAINT academic_periods_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES public.campuses(id)
);
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campus_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  level text NOT NULL DEFAULT 'other'::text CHECK (level = ANY (ARRAY['integrated_technical'::text, 'technical'::text, 'undergraduate'::text, 'postgraduate'::text, 'other'::text])),
  shift text NOT NULL DEFAULT 'mixed'::text CHECK (shift = ANY (ARRAY['morning'::text, 'afternoon'::text, 'evening'::text, 'full_time'::text, 'mixed'::text])),
  total_semesters smallint CHECK (total_semesters IS NULL OR total_semesters >= 1 AND total_semesters <= 30),
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT courses_pkey PRIMARY KEY (id),
  CONSTRAINT courses_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES public.campuses(id)
);
CREATE TABLE public.subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  workload_hours integer NOT NULL DEFAULT 0 CHECK (workload_hours >= 0 AND workload_hours <= 3000),
  semester smallint CHECK (semester IS NULL OR semester >= 1 AND semester <= 30),
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT subjects_pkey PRIMARY KEY (id),
  CONSTRAINT subjects_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  academic_period_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  shift text NOT NULL DEFAULT 'mixed'::text CHECK (shift = ANY (ARRAY['morning'::text, 'afternoon'::text, 'evening'::text, 'full_time'::text, 'mixed'::text])),
  capacity integer CHECK (capacity IS NULL OR capacity >= 1 AND capacity <= 500),
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT classes_pkey PRIMARY KEY (id),
  CONSTRAINT classes_academic_period_id_fkey FOREIGN KEY (academic_period_id) REFERENCES public.academic_periods(id),
  CONSTRAINT classes_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.class_subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  room text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT class_subjects_pkey PRIMARY KEY (id),
  CONSTRAINT class_subjects_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT class_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id)
);
CREATE TABLE public.teaching_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_subject_id uuid NOT NULL,
  teacher_user_id uuid NOT NULL,
  is_primary boolean NOT NULL DEFAULT true,
  starts_on date,
  ends_on date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT teaching_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT teaching_assignments_class_subject_id_fkey FOREIGN KEY (class_subject_id) REFERENCES public.class_subjects(id),
  CONSTRAINT teaching_assignments_teacher_user_id_fkey FOREIGN KEY (teacher_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  student_user_id uuid NOT NULL,
  enrollment_number text,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'locked'::text, 'completed'::text, 'cancelled'::text])),
  enrolled_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT enrollments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT enrollments_student_user_id_fkey FOREIGN KEY (student_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.class_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_subject_id uuid NOT NULL,
  weekday smallint NOT NULL CHECK (weekday >= 1 AND weekday <= 7),
  starts_at time without time zone NOT NULL,
  ends_at time without time zone NOT NULL,
  room text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT class_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT class_schedules_class_subject_id_fkey FOREIGN KEY (class_subject_id) REFERENCES public.class_subjects(id)
);
CREATE TABLE public.class_agenda_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_subject_id uuid NOT NULL,
  author_user_id uuid NOT NULL,
  entry_date date NOT NULL,
  starts_at time without time zone,
  entry_type text NOT NULL DEFAULT 'class'::text CHECK (entry_type = ANY (ARRAY['class'::text, 'exam'::text, 'assignment'::text, 'activity'::text, 'notice'::text, 'material'::text])),
  title text NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 180),
  description text NOT NULL DEFAULT ''::text CHECK (char_length(description) <= 8000),
  status text NOT NULL DEFAULT 'published'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT class_agenda_entries_pkey PRIMARY KEY (id),
  CONSTRAINT class_agenda_entries_class_subject_id_fkey FOREIGN KEY (class_subject_id) REFERENCES public.class_subjects(id),
  CONSTRAINT class_agenda_entries_author_user_id_fkey FOREIGN KEY (author_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.class_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_subject_id uuid NOT NULL,
  session_date date NOT NULL,
  starts_at time without time zone,
  ends_at time without time zone,
  content text NOT NULL DEFAULT ''::text,
  notes text NOT NULL DEFAULT ''::text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT class_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT class_sessions_class_subject_id_fkey FOREIGN KEY (class_subject_id) REFERENCES public.class_subjects(id),
  CONSTRAINT class_sessions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.attendance_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  student_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'present'::text CHECK (status = ANY (ARRAY['present'::text, 'absent'::text, 'late'::text, 'justified'::text])),
  notes text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT attendance_records_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_records_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.class_sessions(id),
  CONSTRAINT attendance_records_student_user_id_fkey FOREIGN KEY (student_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.academic_assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_subject_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT ''::text,
  assessment_date date NOT NULL,
  max_score numeric NOT NULL DEFAULT 10 CHECK (max_score > 0::numeric),
  weight numeric NOT NULL DEFAULT 1 CHECK (weight > 0::numeric),
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT academic_assessments_pkey PRIMARY KEY (id),
  CONSTRAINT academic_assessments_class_subject_id_fkey FOREIGN KEY (class_subject_id) REFERENCES public.class_subjects(id),
  CONSTRAINT academic_assessments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.grades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL,
  student_user_id uuid NOT NULL,
  score numeric NOT NULL CHECK (score >= 0::numeric),
  notes text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT grades_pkey PRIMARY KEY (id),
  CONSTRAINT grades_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.academic_assessments(id),
  CONSTRAINT grades_student_user_id_fkey FOREIGN KEY (student_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.academic_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL,
  enrollment_id uuid NOT NULL,
  document_type text NOT NULL CHECK (document_type = ANY (ARRAY['enrollment_declaration'::text, 'academic_record'::text, 'completion_certificate'::text])),
  verification_code text NOT NULL DEFAULT ('SIF-'::text || upper(substr(replace((gen_random_uuid())::text, '-'::text, ''::text), 1, 16))) UNIQUE,
  snapshot jsonb NOT NULL,
  issued_by uuid NOT NULL DEFAULT auth.uid(),
  issued_at timestamp with time zone NOT NULL DEFAULT now(),
  revoked_at timestamp with time zone,
  revoked_by uuid,
  revocation_reason text,
  CONSTRAINT academic_documents_pkey PRIMARY KEY (id),
  CONSTRAINT academic_documents_student_user_id_fkey FOREIGN KEY (student_user_id) REFERENCES auth.users(id),
  CONSTRAINT academic_documents_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id),
  CONSTRAINT academic_documents_issued_by_fkey FOREIGN KEY (issued_by) REFERENCES auth.users(id),
  CONSTRAINT academic_documents_revoked_by_fkey FOREIGN KEY (revoked_by) REFERENCES auth.users(id)
);
CREATE TABLE public.institutional_publications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campus_id uuid,
  kind text NOT NULL CHECK (kind = ANY (ARRAY['news'::text, 'notice'::text, 'edital'::text, 'event'::text])),
  reference_code text,
  title text NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 220),
  summary text NOT NULL DEFAULT ''::text CHECK (char_length(summary) <= 600),
  content text NOT NULL DEFAULT ''::text CHECK (char_length(content) <= 20000),
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  visibility text NOT NULL DEFAULT 'public'::text CHECK (visibility = ANY (ARRAY['public'::text, 'authenticated'::text])),
  audience_roles ARRAY NOT NULL DEFAULT ARRAY['student'::app_role, 'teacher'::app_role, 'staff'::app_role, 'manager'::app_role, 'admin'::app_role] CHECK (cardinality(audience_roles) > 0),
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  expires_at timestamp with time zone,
  location text,
  external_url text,
  created_by uuid NOT NULL,
  updated_by uuid,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT institutional_publications_pkey PRIMARY KEY (id),
  CONSTRAINT institutional_publications_campus_id_fkey FOREIGN KEY (campus_id) REFERENCES public.campuses(id),
  CONSTRAINT institutional_publications_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT institutional_publications_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 220),
  body text NOT NULL DEFAULT ''::text CHECK (char_length(body) <= 1000),
  href text NOT NULL DEFAULT '/'::text,
  source_type text NOT NULL DEFAULT 'system'::text,
  source_id uuid,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  actor_user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.service_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  requester_user_id uuid NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['academic'::text, 'documents'::text, 'people'::text, 'infrastructure'::text, 'it'::text, 'transport'::text, 'other'::text])),
  title text NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 180),
  description text NOT NULL DEFAULT ''::text CHECK (char_length(description) <= 8000),
  priority text NOT NULL DEFAULT 'normal'::text CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text])),
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'in_progress'::text, 'waiting'::text, 'resolved'::text, 'cancelled'::text])),
  assigned_to uuid,
  response text NOT NULL DEFAULT ''::text CHECK (char_length(response) <= 8000),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  CONSTRAINT service_requests_pkey PRIMARY KEY (id),
  CONSTRAINT service_requests_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id),
  CONSTRAINT service_requests_requester_user_id_fkey FOREIGN KEY (requester_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.publication_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  publication_id uuid NOT NULL,
  storage_path text NOT NULL UNIQUE,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes >= 0 AND size_bytes <= 15728640),
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT publication_attachments_pkey PRIMARY KEY (id),
  CONSTRAINT publication_attachments_publication_id_fkey FOREIGN KEY (publication_id) REFERENCES public.institutional_publications(id),
  CONSTRAINT publication_attachments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.knowledge_articles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text),
  title text NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 180),
  summary text NOT NULL DEFAULT ''::text CHECK (char_length(summary) <= 500),
  content text NOT NULL DEFAULT ''::text CHECK (char_length(content) <= 20000),
  category text NOT NULL DEFAULT 'general'::text CHECK (category = ANY (ARRAY['general'::text, 'academic'::text, 'services'::text, 'documents'::text, 'account'::text, 'maisa'::text])),
  audience_roles ARRAY NOT NULL DEFAULT ARRAY['student'::app_role, 'teacher'::app_role, 'staff'::app_role, 'manager'::app_role, 'admin'::app_role],
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  updated_by uuid,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_articles_pkey PRIMARY KEY (id),
  CONSTRAINT knowledge_articles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT knowledge_articles_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.user_shortcuts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL CHECK (char_length(label) >= 2 AND char_length(label) <= 80),
  href text NOT NULL CHECK (href ~ '^/[a-z0-9/_-]*$'::text AND char_length(href) <= 180),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_shortcuts_pkey PRIMARY KEY (id),
  CONSTRAINT user_shortcuts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.notification_preferences (
  user_id uuid NOT NULL,
  institutional boolean NOT NULL DEFAULT true,
  service_requests boolean NOT NULL DEFAULT true,
  academic boolean NOT NULL DEFAULT true,
  system boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (user_id),
  CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.bug_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  route text NOT NULL DEFAULT '/'::text CHECK (route ~ '^/'::text AND char_length(route) <= 300),
  title text NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 180),
  description text NOT NULL DEFAULT ''::text CHECK (char_length(description) <= 10000),
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'reviewing'::text, 'resolved'::text, 'closed'::text])),
  response text NOT NULL DEFAULT ''::text CHECK (char_length(response) <= 10000),
  managed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  CONSTRAINT bug_reports_pkey PRIMARY KEY (id),
  CONSTRAINT bug_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT bug_reports_managed_by_fkey FOREIGN KEY (managed_by) REFERENCES auth.users(id)
);
CREATE TABLE public.electronic_processes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  protocol text NOT NULL DEFAULT ((('SIF-'::text || to_char(now(), 'YYYYMMDD'::text)) || '-'::text) || upper(substr(replace((gen_random_uuid())::text, '-'::text, ''::text), 1, 8))) UNIQUE,
  requester_user_id uuid NOT NULL,
  process_type text NOT NULL DEFAULT 'general'::text CHECK (process_type = ANY (ARRAY['general'::text, 'academic'::text, 'administrative'::text, 'documents'::text, 'student_assistance'::text, 'internship'::text, 'research'::text, 'extension'::text])),
  subject text NOT NULL CHECK (char_length(subject) >= 3 AND char_length(subject) <= 180),
  description text NOT NULL DEFAULT ''::text CHECK (char_length(description) <= 12000),
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'triage'::text, 'in_progress'::text, 'waiting_user'::text, 'completed'::text, 'archived'::text])),
  priority text NOT NULL DEFAULT 'normal'::text CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text])),
  current_sector text NOT NULL DEFAULT 'Protocolo'::text CHECK (char_length(current_sector) <= 120),
  responsible_user_id uuid,
  opened_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  closed_at timestamp with time zone,
  CONSTRAINT electronic_processes_pkey PRIMARY KEY (id),
  CONSTRAINT electronic_processes_requester_user_id_fkey FOREIGN KEY (requester_user_id) REFERENCES auth.users(id),
  CONSTRAINT electronic_processes_responsible_user_id_fkey FOREIGN KEY (responsible_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.process_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL,
  actor_user_id uuid,
  action text NOT NULL CHECK (char_length(action) >= 2 AND char_length(action) <= 120),
  note text NOT NULL DEFAULT ''::text CHECK (char_length(note) <= 8000),
  from_status text,
  to_status text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT process_movements_pkey PRIMARY KEY (id),
  CONSTRAINT process_movements_process_id_fkey FOREIGN KEY (process_id) REFERENCES public.electronic_processes(id),
  CONSTRAINT process_movements_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.internship_opportunities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 180),
  organization text NOT NULL CHECK (char_length(organization) >= 2 AND char_length(organization) <= 180),
  description text NOT NULL DEFAULT ''::text CHECK (char_length(description) <= 12000),
  location text NOT NULL DEFAULT ''::text CHECK (char_length(location) <= 180),
  workload_hours integer CHECK (workload_hours IS NULL OR workload_hours >= 1 AND workload_hours <= 80),
  stipend numeric CHECK (stipend IS NULL OR stipend >= 0::numeric),
  slots integer NOT NULL DEFAULT 1 CHECK (slots >= 1 AND slots <= 500),
  application_deadline date,
  starts_on date,
  ends_on date,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'open'::text, 'closed'::text, 'archived'::text])),
  created_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT internship_opportunities_pkey PRIMARY KEY (id),
  CONSTRAINT internship_opportunities_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.internship_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL,
  student_user_id uuid NOT NULL,
  statement text NOT NULL DEFAULT ''::text CHECK (char_length(statement) <= 6000),
  status text NOT NULL DEFAULT 'submitted'::text CHECK (status = ANY (ARRAY['submitted'::text, 'under_review'::text, 'approved'::text, 'rejected'::text, 'withdrawn'::text])),
  reviewed_by uuid,
  applied_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT internship_applications_pkey PRIMARY KEY (id),
  CONSTRAINT internship_applications_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.internship_opportunities(id),
  CONSTRAINT internship_applications_student_user_id_fkey FOREIGN KEY (student_user_id) REFERENCES auth.users(id),
  CONSTRAINT internship_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id)
);
CREATE TABLE public.student_aid_programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 180),
  description text NOT NULL DEFAULT ''::text CHECK (char_length(description) <= 12000),
  benefit_type text NOT NULL DEFAULT 'other'::text CHECK (benefit_type = ANY (ARRAY['food'::text, 'transport'::text, 'housing'::text, 'digital_inclusion'::text, 'emergency'::text, 'scholarship'::text, 'other'::text])),
  benefit_value numeric CHECK (benefit_value IS NULL OR benefit_value >= 0::numeric),
  application_deadline date,
  starts_on date,
  ends_on date,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'open'::text, 'closed'::text, 'archived'::text])),
  created_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT student_aid_programs_pkey PRIMARY KEY (id),
  CONSTRAINT student_aid_programs_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.student_aid_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL,
  student_user_id uuid NOT NULL,
  notes text NOT NULL DEFAULT ''::text CHECK (char_length(notes) <= 6000),
  status text NOT NULL DEFAULT 'submitted'::text CHECK (status = ANY (ARRAY['submitted'::text, 'under_review'::text, 'approved'::text, 'rejected'::text, 'waitlist'::text, 'withdrawn'::text])),
  reviewed_by uuid,
  applied_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT student_aid_applications_pkey PRIMARY KEY (id),
  CONSTRAINT student_aid_applications_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.student_aid_programs(id),
  CONSTRAINT student_aid_applications_student_user_id_fkey FOREIGN KEY (student_user_id) REFERENCES auth.users(id),
  CONSTRAINT student_aid_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id)
);
CREATE TABLE public.tcc_defenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_user_id uuid,
  course_id uuid,
  advisor_user_id uuid,
  title text NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 300),
  summary text NOT NULL DEFAULT ''::text CHECK (char_length(summary) <= 8000),
  scheduled_at timestamp with time zone NOT NULL,
  room text NOT NULL DEFAULT ''::text CHECK (char_length(room) <= 180),
  panel_members ARRAY NOT NULL DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'scheduled'::text CHECK (status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text])),
  result text NOT NULL DEFAULT ''::text CHECK (char_length(result) <= 4000),
  created_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tcc_defenses_pkey PRIMARY KEY (id),
  CONSTRAINT tcc_defenses_student_user_id_fkey FOREIGN KEY (student_user_id) REFERENCES auth.users(id),
  CONSTRAINT tcc_defenses_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT tcc_defenses_advisor_user_id_fkey FOREIGN KEY (advisor_user_id) REFERENCES auth.users(id),
  CONSTRAINT tcc_defenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.institutional_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  axis text NOT NULL CHECK (axis = ANY (ARRAY['teaching'::text, 'research'::text, 'extension'::text])),
  title text NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 220),
  summary text NOT NULL DEFAULT ''::text CHECK (char_length(summary) <= 1200),
  details text NOT NULL DEFAULT ''::text CHECK (char_length(details) <= 16000),
  call_reference text NOT NULL DEFAULT ''::text CHECK (char_length(call_reference) <= 160),
  leader_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'submitted'::text, 'published'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])),
  open_for_applications boolean NOT NULL DEFAULT false,
  starts_on date,
  ends_on date,
  created_by uuid NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT institutional_projects_pkey PRIMARY KEY (id),
  CONSTRAINT institutional_projects_leader_user_id_fkey FOREIGN KEY (leader_user_id) REFERENCES auth.users(id),
  CONSTRAINT institutional_projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.project_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  applicant_user_id uuid NOT NULL,
  motivation text NOT NULL DEFAULT ''::text CHECK (char_length(motivation) <= 6000),
  status text NOT NULL DEFAULT 'submitted'::text CHECK (status = ANY (ARRAY['submitted'::text, 'under_review'::text, 'approved'::text, 'rejected'::text, 'withdrawn'::text])),
  reviewed_by uuid,
  applied_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_applications_pkey PRIMARY KEY (id),
  CONSTRAINT project_applications_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.institutional_projects(id),
  CONSTRAINT project_applications_applicant_user_id_fkey FOREIGN KEY (applicant_user_id) REFERENCES auth.users(id),
  CONSTRAINT project_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id)
);
CREATE TABLE public.institutional_import_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_name text NOT NULL DEFAULT 'Importação institucional'::text CHECK (char_length(source_name) >= 2 AND char_length(source_name) <= 120),
  filename text NOT NULL CHECK (char_length(filename) >= 1 AND char_length(filename) <= 255),
  status text NOT NULL DEFAULT 'validated'::text CHECK (status = ANY (ARRAY['validated'::text, 'applied'::text, 'failed'::text])),
  total_rows integer NOT NULL DEFAULT 0 CHECK (total_rows >= 0),
  valid_rows integer NOT NULL DEFAULT 0 CHECK (valid_rows >= 0),
  invalid_rows integer NOT NULL DEFAULT 0 CHECK (invalid_rows >= 0),
  applied_rows integer NOT NULL DEFAULT 0 CHECK (applied_rows >= 0),
  awaiting_rows integer NOT NULL DEFAULT 0 CHECK (awaiting_rows >= 0),
  conflict_rows integer NOT NULL DEFAULT 0 CHECK (conflict_rows >= 0),
  imported_by uuid NOT NULL,
  notes text NOT NULL DEFAULT ''::text CHECK (char_length(notes) <= 4000),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  applied_at timestamp with time zone,
  CONSTRAINT institutional_import_batches_pkey PRIMARY KEY (id),
  CONSTRAINT institutional_import_batches_imported_by_fkey FOREIGN KEY (imported_by) REFERENCES auth.users(id)
);
CREATE TABLE public.institutional_identity_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  batch_id uuid,
  source_name text NOT NULL DEFAULT 'Importação institucional'::text CHECK (char_length(source_name) >= 2 AND char_length(source_name) <= 120),
  record_key text NOT NULL UNIQUE CHECK (char_length(record_key) >= 3 AND char_length(record_key) <= 260),
  external_id text NOT NULL CHECK (char_length(external_id) >= 2 AND char_length(external_id) <= 80),
  full_name text NOT NULL CHECK (char_length(full_name) >= 2 AND char_length(full_name) <= 160),
  institutional_email text NOT NULL CHECK (char_length(institutional_email) >= 5 AND char_length(institutional_email) <= 254),
  proposed_role USER-DEFINED NOT NULL CHECK (proposed_role <> 'admin'::app_role),
  campus text NOT NULL DEFAULT 'Campus Cáceres'::text CHECK (char_length(campus) <= 160),
  course_code text,
  class_code text,
  situation text NOT NULL DEFAULT 'active'::text CHECK (situation = ANY (ARRAY['active'::text, 'inactive'::text])),
  approval_status text NOT NULL DEFAULT 'pending'::text CHECK (approval_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  match_status text NOT NULL DEFAULT 'pending'::text CHECK (match_status = ANY (ARRAY['pending'::text, 'awaiting_account'::text, 'applied'::text, 'conflict'::text, 'inactive'::text, 'rejected'::text])),
  matched_user_id uuid,
  validation_error text,
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  applied_at timestamp with time zone,
  academic_sync_status text NOT NULL DEFAULT 'pending'::text CHECK (academic_sync_status = ANY (ARRAY['not_applicable'::text, 'pending'::text, 'applied'::text, 'course_not_found'::text, 'class_not_found'::text, 'ambiguous'::text, 'conflict'::text, 'inactive'::text])),
  academic_sync_message text,
  enrollment_id uuid,
  CONSTRAINT institutional_identity_records_pkey PRIMARY KEY (id),
  CONSTRAINT institutional_identity_records_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.institutional_import_batches(id),
  CONSTRAINT institutional_identity_records_matched_user_id_fkey FOREIGN KEY (matched_user_id) REFERENCES auth.users(id),
  CONSTRAINT institutional_identity_records_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id)
);