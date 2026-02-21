-- Ensure video_url column exists on lessons table
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_url TEXT;
