
-- Run this in your Supabase SQL Editor to update the table structure
ALTER TABLE public.home_churches ADD COLUMN IF NOT EXISTS "creatorName" text NOT NULL DEFAULT '';
ALTER TABLE public.home_churches ADD COLUMN IF NOT EXISTS "creatorEmail" text NOT NULL DEFAULT '';

-- Optional: Drop the default if you don't want empty strings for future inserts (code handles values)
ALTER TABLE public.home_churches ALTER COLUMN "creatorName" DROP DEFAULT;
ALTER TABLE public.home_churches ALTER COLUMN "creatorEmail" DROP DEFAULT;
