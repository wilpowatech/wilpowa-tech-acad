-- Run this in the Supabase SQL Editor to add all missing columns
-- Safe to run multiple times (uses IF NOT EXISTS)

-- 1. Add profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sex text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code_expires_at timestamp with time zone;

-- 2. Add scheduling columns
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS available_at timestamp with time zone;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS day_number integer;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS available_at timestamp with time zone;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS github_repo_url text;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS sandbox_url text;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS order_number integer;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS available_at timestamp with time zone;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES modules(id);
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS passing_score integer DEFAULT 70;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES modules(id);
ALTER TABLE quiz_answers ADD COLUMN IF NOT EXISTS order_number integer;
ALTER TABLE exam_answers ADD COLUMN IF NOT EXISTS order_number integer;

-- 3. Create content_assignments if not exists
CREATE TABLE IF NOT EXISTS content_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type text, -- 'lesson', 'lab', 'quiz'
  content_id uuid,
  student_id uuid NOT NULL REFERENCES users(id),
  course_id uuid NOT NULL REFERENCES courses(id),
  assigned_at timestamp with time zone DEFAULT now(),
  available_at timestamp with time zone,
  deadline timestamp with time zone,
  UNIQUE(content_type, content_id, student_id)
);

-- Add columns to content_assignments that may be missing
ALTER TABLE content_assignments ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES modules(id);
ALTER TABLE content_assignments ADD COLUMN IF NOT EXISTS day_number INTEGER;
ALTER TABLE content_assignments ADD COLUMN IF NOT EXISTS grace_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE content_assignments ADD COLUMN IF NOT EXISTS max_score_percentage NUMERIC DEFAULT 100;
ALTER TABLE content_assignments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 4. Create student_daily_progress if not exists
CREATE TABLE IF NOT EXISTS student_daily_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES users(id),
  course_id uuid NOT NULL REFERENCES courses(id),
  module_id uuid NOT NULL REFERENCES modules(id),
  day_number integer NOT NULL,
  lecture_progress numeric DEFAULT 0,
  lecture_completed boolean DEFAULT false,
  quiz_score numeric DEFAULT 0,
  quiz_completed boolean DEFAULT false,
  lab_score numeric DEFAULT 0,
  lab_completed boolean DEFAULT false,
  overall_day_score numeric DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(student_id, module_id, day_number)
);

ALTER TABLE student_daily_progress ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE student_daily_progress ADD COLUMN IF NOT EXISTS grace_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE student_daily_progress ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE;

-- 5. Lab/quiz submission extra columns
ALTER TABLE lab_submissions ADD COLUMN IF NOT EXISTS submission_type TEXT DEFAULT 'sandbox';
ALTER TABLE lab_submissions ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE lab_submissions ADD COLUMN IF NOT EXISTS score_breakdown JSONB;
ALTER TABLE lab_submissions ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE;
ALTER TABLE lab_submissions ADD COLUMN IF NOT EXISTS max_score_percentage NUMERIC DEFAULT 100;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS max_score_percentage NUMERIC DEFAULT 100;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS passed BOOLEAN;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 6. Create anti_cheat and sandbox tables if not exists
CREATE TABLE IF NOT EXISTS anti_cheat_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES users(id),
  lab_id uuid NOT NULL REFERENCES labs(id),
  event_type text NOT NULL,
  event_data jsonb,
  flagged boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

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

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_content_assignments_deadline ON content_assignments(deadline);
CREATE INDEX IF NOT EXISTS idx_content_assignments_grace ON content_assignments(grace_deadline);
CREATE INDEX IF NOT EXISTS idx_content_assignments_module ON content_assignments(module_id);
CREATE INDEX IF NOT EXISTS idx_lab_submissions_github ON lab_submissions(github_url);

-- 8. Create Supabase storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

-- Allow public read access to avatars
CREATE POLICY IF NOT EXISTS "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- Allow authenticated users to upload their own avatar
CREATE POLICY IF NOT EXISTS "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
