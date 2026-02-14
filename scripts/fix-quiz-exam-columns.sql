-- Add missing columns to exams table
ALTER TABLE exams ADD COLUMN IF NOT EXISTS passing_score integer DEFAULT 70;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS total_questions integer DEFAULT 0;

-- Add missing columns to quizzes table
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS passing_score integer DEFAULT 70;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS total_questions integer DEFAULT 0;

-- Add missing columns to quiz_submissions table
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS passed boolean DEFAULT false;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;

-- Add question_text alias: rename 'question' to 'question_text' in exam_questions if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_questions' AND column_name = 'question' AND table_schema = 'public'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_questions' AND column_name = 'question_text' AND table_schema = 'public'
  ) THEN
    ALTER TABLE exam_questions RENAME COLUMN question TO question_text;
  END IF;
END $$;

-- Same for quiz_questions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_questions' AND column_name = 'question' AND table_schema = 'public'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_questions' AND column_name = 'question_text' AND table_schema = 'public'
  ) THEN
    ALTER TABLE quiz_questions RENAME COLUMN question TO question_text;
  END IF;
END $$;

-- Add submission_id column to exam_responses if missing (for our submit API)
ALTER TABLE exam_responses ADD COLUMN IF NOT EXISTS submission_id uuid REFERENCES exam_submissions(id);

-- Add submission_id column to quiz_responses if missing (for our submit API)  
ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS selected_answer_id uuid;
