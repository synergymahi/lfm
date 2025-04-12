/*
  # Add featured products functionality

  1. Changes
    - Add is_featured_product boolean column to baskets table
    - Set default value to false
    - Update existing records

  2. Security
    - No changes to RLS policies needed
    - Maintains existing table permissions
*/

-- Add is_featured_product column with default value
ALTER TABLE baskets 
ADD COLUMN IF NOT EXISTS is_featured_product boolean DEFAULT false;

-- Update some existing products as featured (optional seeding)
UPDATE baskets 
SET is_featured_product = true 
WHERE id IN (
  SELECT id FROM baskets 
  WHERE available = true 
  ORDER BY created_at DESC 
  LIMIT 3
);