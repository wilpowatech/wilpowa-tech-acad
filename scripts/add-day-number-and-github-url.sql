-- Add day_number to lessons so we can show Day 1-5 per module/week
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS day_number integer;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS description text;

-- Add github_repo_url and sandbox_url to labs for scoring
ALTER TABLE labs ADD COLUMN IF NOT EXISTS github_repo_url text;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS sandbox_url text;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS order_number integer;

-- Add module_id to quizzes so quizzes belong to a module/week
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES modules(id);

-- Add module_id to exams if not already there
ALTER TABLE exams ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES modules(id);

-- Add order_number to quiz_answers
ALTER TABLE quiz_answers ADD COLUMN IF NOT EXISTS order_number integer;

-- Add order_number to exam_answers  
ALTER TABLE exam_answers ADD COLUMN IF NOT EXISTS order_number integer;
