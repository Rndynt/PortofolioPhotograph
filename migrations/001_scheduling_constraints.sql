-- Phase 4: Scheduling System - Exclusion Constraints
-- This migration adds btree_gist extension and exclusion constraint to prevent
-- double-booking of photographers on overlapping sessions.
--
-- Run this AFTER running `npm run db:push` to apply the Drizzle schema changes.
-- Execute: psql $DATABASE_URL -f migrations/001_scheduling_constraints.sql

-- =============================================================================
-- UP MIGRATION
-- =============================================================================

-- Enable btree_gist extension for exclusion constraints
-- This extension allows us to use GiST indexes with = and && operators
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add time_range column to sessions table
-- This is a generated column that creates a tstzrange (timestamptz range) from start_at and end_at
-- '[)' means inclusive start, exclusive end (standard range notation)
ALTER TABLE sessions 
  ADD COLUMN IF NOT EXISTS time_range tstzrange 
  GENERATED ALWAYS AS (tstzrange(start_at, end_at, '[)')) STORED;

-- Create exclusion constraint on session_assignments
-- This constraint prevents the same photographer from being assigned to overlapping sessions
-- The constraint uses GiST index with two conditions:
--   1. photographer_id WITH = : Same photographer
--   2. time_range WITH && : Overlapping time ranges
-- If both conditions match, insertion fails with error code 23P01 (exclusion_violation)
ALTER TABLE session_assignments
  ADD CONSTRAINT no_overlap_per_photographer
  EXCLUDE USING gist (
    photographer_id WITH =,
    (SELECT s.time_range FROM sessions s WHERE s.id = session_assignments.session_id) WITH &&
  );

-- =============================================================================
-- Verification Queries (Optional - for testing)
-- =============================================================================

-- Check if extension is installed
-- SELECT extname FROM pg_extension WHERE extname = 'btree_gist';

-- Check if time_range column exists
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'sessions' AND column_name = 'time_range';

-- Check if constraint exists
-- SELECT conname FROM pg_constraint 
-- WHERE conname = 'no_overlap_per_photographer';

-- =============================================================================
-- DOWN MIGRATION (for rollback if needed)
-- =============================================================================

-- To rollback this migration, run:
-- ALTER TABLE session_assignments DROP CONSTRAINT IF EXISTS no_overlap_per_photographer;
-- ALTER TABLE sessions DROP COLUMN IF EXISTS time_range;
-- Note: btree_gist extension is not dropped as it might be used elsewhere
