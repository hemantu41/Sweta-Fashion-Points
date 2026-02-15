-- Add total_ratings column to spf_delivery_partners table
ALTER TABLE spf_delivery_partners
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- Optional: Update existing records with sample data for testing
-- UPDATE spf_delivery_partners 
-- SET total_ratings = FLOOR(RANDOM() * 50 + 1) 
-- WHERE average_rating > 0;
