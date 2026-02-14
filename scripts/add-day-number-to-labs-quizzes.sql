-- Add day_number to labs so each lab is tied to a specific day of the week
ALTER TABLE labs ADD COLUMN IF NOT EXISTS day_number integer;

-- Add day_number to quizzes so each quiz is tied to a specific day of the week
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS day_number integer;

-- Add deadline column to labs (timestamp for when the 24hr window expires)
ALTER TABLE labs ADD COLUMN IF NOT EXISTS deadline timestamp with time zone;

-- Add deadline column to quizzes
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS deadline timestamp with time zone;

-- Add deadline column to lessons (so lecture also has a 24hr window)
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS deadline timestamp with time zone;
