-- Add scheduling columns to lessons, labs, quizzes
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS available_at timestamp with time zone;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS available_at timestamp with time zone;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS available_at timestamp with time zone;

-- Lesson/lab/quiz student assignments (which students can access which content)
CREATE TABLE IF NOT EXISTS content_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type text NOT NULL, -- 'lesson', 'lab', 'quiz'
  content_id uuid NOT NULL,
  student_id uuid NOT NULL REFERENCES users(id),
  course_id uuid NOT NULL REFERENCES courses(id),
  assigned_at timestamp with time zone DEFAULT now(),
  available_at timestamp with time zone, -- when student can access
  deadline timestamp with time zone, -- when it's due
  UNIQUE(content_type, content_id, student_id)
);

-- Student daily progress (tracks % completion per lecture, lab score, quiz score)
CREATE TABLE IF NOT EXISTS student_daily_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES users(id),
  course_id uuid NOT NULL REFERENCES courses(id),
  module_id uuid NOT NULL REFERENCES modules(id),
  day_number integer NOT NULL,
  lecture_progress numeric DEFAULT 0, -- 0-100%
  lecture_completed boolean DEFAULT false,
  quiz_score numeric DEFAULT 0,
  quiz_completed boolean DEFAULT false,
  lab_score numeric DEFAULT 0,
  lab_completed boolean DEFAULT false,
  overall_day_score numeric DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(student_id, module_id, day_number)
);

-- Anti-cheat event log
CREATE TABLE IF NOT EXISTS anti_cheat_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES users(id),
  lab_id uuid NOT NULL REFERENCES labs(id),
  event_type text NOT NULL, -- 'tab_switch', 'copy_paste', 'rapid_typing', 'ai_detected'
  event_data jsonb,
  flagged boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Sandbox sessions for the in-house code editor
CREATE TABLE IF NOT EXISTS sandbox_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES users(id),
  lab_id uuid NOT NULL REFERENCES labs(id),
  code text DEFAULT '',
  language text DEFAULT 'javascript',
  started_at timestamp with time zone DEFAULT now(),
  last_saved_at timestamp with time zone DEFAULT now(),
  keystroke_count integer DEFAULT 0,
  paste_count integer DEFAULT 0,
  focus_time_seconds integer DEFAULT 0,
  tab_switches integer DEFAULT 0
);
