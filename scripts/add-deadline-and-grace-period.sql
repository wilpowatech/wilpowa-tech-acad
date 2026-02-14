-- Add deadline, grace period, and submission type columns

-- Add deadline tracking to content_assignments
ALTER TABLE content_assignments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE content_assignments ADD COLUMN IF NOT EXISTS grace_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE content_assignments ADD COLUMN IF NOT EXISTS max_score_percentage NUMERIC DEFAULT 100;
ALTER TABLE content_assignments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'grace_period', 'expired', 'completed'));

-- Add submission_type and github_url to lab_submissions
ALTER TABLE lab_submissions ADD COLUMN IF NOT EXISTS submission_type TEXT DEFAULT 'sandbox' CHECK (submission_type IN ('sandbox', 'github'));
ALTER TABLE lab_submissions ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE lab_submissions ADD COLUMN IF NOT EXISTS score_breakdown JSONB;
ALTER TABLE lab_submissions ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE;
ALTER TABLE lab_submissions ADD COLUMN IF NOT EXISTS max_score_percentage NUMERIC DEFAULT 100;

-- Add is_late and max_score_percentage to quiz_submissions
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS max_score_percentage NUMERIC DEFAULT 100;

-- Add day_number to student_daily_progress if not there
ALTER TABLE student_daily_progress ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE student_daily_progress ADD COLUMN IF NOT EXISTS grace_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE student_daily_progress ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE;

-- Create indexes for deadline queries
CREATE INDEX IF NOT EXISTS idx_content_assignments_deadline ON content_assignments(deadline);
CREATE INDEX IF NOT EXISTS idx_content_assignments_grace ON content_assignments(grace_deadline);
CREATE INDEX IF NOT EXISTS idx_content_assignments_status ON content_assignments(status);
CREATE INDEX IF NOT EXISTS idx_lab_submissions_github ON lab_submissions(github_url);
