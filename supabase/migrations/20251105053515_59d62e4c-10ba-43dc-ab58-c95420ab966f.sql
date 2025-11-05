-- Add application_url column to credit_cards table
ALTER TABLE credit_cards 
ADD COLUMN IF NOT EXISTS application_url TEXT;