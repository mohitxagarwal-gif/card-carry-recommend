-- Add brute force protection columns to phone_verifications table
ALTER TABLE phone_verifications 
  ADD COLUMN failed_attempts INTEGER DEFAULT 0,
  ADD COLUMN locked_until TIMESTAMP WITH TIME ZONE;