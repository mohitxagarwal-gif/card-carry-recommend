-- Add metadata columns to spending_analyses table for AI extraction tracking
ALTER TABLE spending_analyses
ADD COLUMN IF NOT EXISTS extraction_method VARCHAR(50) DEFAULT 'ai_powered',
ADD COLUMN IF NOT EXISTS extraction_metadata JSONB;

COMMENT ON COLUMN spending_analyses.extraction_method IS 'Method used to extract transactions: ai_powered or legacy_regex';
COMMENT ON COLUMN spending_analyses.extraction_metadata IS 'Metadata from extraction process: model used, file count, transaction count, timestamp';

-- Add index for faster queries on extraction method
CREATE INDEX IF NOT EXISTS idx_spending_analyses_extraction_method 
ON spending_analyses(extraction_method);