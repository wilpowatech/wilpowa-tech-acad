-- Add missing columns to content_assignments
-- The table already has: id, content_type, content_id, student_id, course_id, assigned_at, available_at, deadline
ALTER TABLE content_assignments ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES modules(id);
ALTER TABLE content_assignments ADD COLUMN IF NOT EXISTS day_number INTEGER;
ALTER TABLE content_assignments ADD COLUMN IF NOT EXISTS grace_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE content_assignments ADD COLUMN IF NOT EXISTS max_score_percentage NUMERIC DEFAULT 100;
ALTER TABLE content_assignments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add submission_type and github_url to lab_submissions
ALTER TABLE lab_submissions ADD COLUMN IF NOT EXISTS submission_type TEXT DEFAULT 'sandbox';
ALTER TABLE lab_submissions ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE lab_submissions ADD COLUMN IF NOT EXISTS score_breakdown JSONB;
ALTER TABLE lab_submissions ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE;
ALTER TABLE lab_submissions ADD COLUMN IF NOT EXISTS max_score_percentage NUMERIC DEFAULT 100;

-- Add is_late and max_score_percentage to quiz_submissions
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS max_score_percentage NUMERIC DEFAULT 100;

-- Add deadline fields to student_daily_progress
ALTER TABLE student_daily_progress ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE student_daily_progress ADD COLUMN IF NOT EXISTS grace_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE student_daily_progress ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_content_assignments_deadline ON content_assignments(deadline);
CREATE INDEX IF NOT EXISTS idx_content_assignments_grace ON content_assignments(grace_deadline);
CREATE INDEX IF NOT EXISTS idx_content_assignments_module ON content_assignments(module_id);
CREATE INDEX IF NOT EXISTS idx_lab_submissions_github ON lab_submissions(github_url);
