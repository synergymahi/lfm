/*
  # Add slug functionality to baskets table

  1. Changes
    - Add slug column to baskets table
    - Create unique index for slugs
    - Add functions and triggers for automatic slug generation
    - Update existing records with slugs

  2. Security
    - No changes to RLS policies needed
    - Maintains existing table permissions
*/

-- Add slug column
ALTER TABLE baskets ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS baskets_slug_key ON baskets (slug);

-- Function to generate unique slugs
CREATE OR REPLACE FUNCTION generate_unique_slug(title text)
RETURNS text AS $$
DECLARE
  new_slug text;
  base_slug text;
  counter integer := 1;
  slug_exists boolean;
BEGIN
  -- Convert to lowercase and replace spaces/special chars with hyphens
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'));
  -- Remove leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  
  new_slug := base_slug;
  
  -- Check if slug exists and append number if needed
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM baskets WHERE baskets.slug = new_slug
    ) INTO slug_exists;
    
    EXIT WHEN NOT slug_exists;
    
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to set slug before insert
CREATE OR REPLACE FUNCTION set_slug_on_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := generate_unique_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_basket_slug_on_insert ON baskets;
CREATE TRIGGER set_basket_slug_on_insert
  BEFORE INSERT ON baskets
  FOR EACH ROW
  EXECUTE FUNCTION set_slug_on_insert();

-- Update existing rows with slugs
UPDATE baskets
SET slug = generate_unique_slug(name)
WHERE slug IS NULL;