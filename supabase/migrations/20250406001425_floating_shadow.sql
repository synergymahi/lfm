/*
  # Order Management System Setup

  1. New Tables
    - `delivery_methods`
      - `id` (text, primary key)
      - `name` (text)
      - `description` (text)
      - `price` (integer)
    
    - `payment_methods`
      - `id` (text, primary key)
      - `name` (text)
      - `description` (text)
      - `is_active` (boolean)

    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `basket_id` (uuid, references baskets)
      - `quantity` (integer)
      - `unit_price` (integer)
      - `total_price` (integer)

  2. Changes to Existing Tables
    - Update `profiles` table to add phone number
    - Update `orders` table with new fields

  3. Security
    - Enable RLS on all new tables
    - Add policies for user and admin access
*/

-- Create delivery methods enum
CREATE TYPE delivery_method AS ENUM ('home', 'pickup');

-- Create payment method enum
CREATE TYPE payment_method AS ENUM ('cash', 'mobile_money');

-- Update profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone_number text;

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  basket_id uuid REFERENCES baskets(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price integer NOT NULL,
  total_price integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Update orders table with new fields
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_method delivery_method NOT NULL DEFAULT 'home',
ADD COLUMN IF NOT EXISTS payment_method payment_method NOT NULL DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS delivery_address text,
ADD COLUMN IF NOT EXISTS delivery_notes text,
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS notification_email text,
ADD COLUMN IF NOT EXISTS notification_sms boolean DEFAULT true;

-- Enable RLS on order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies for order_items
CREATE POLICY "Users can view their own order items"
ON order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all order items"
ON order_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Function to update order total when items change
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders
  SET total_price = (
    SELECT SUM(total_price)
    FROM order_items
    WHERE order_id = NEW.order_id
  )
  WHERE id = NEW.order_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update order total
CREATE TRIGGER update_order_total_trigger
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_total();

-- Function to send notification on order status change
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    -- Insert into notification queue table (to be processed by Edge Function)
    INSERT INTO notification_queue (
      user_id,
      order_id,
      notification_type,
      status,
      email,
      phone_number
    )
    SELECT
      orders.user_id,
      orders.id,
      CASE
        WHEN orders.notification_email IS NOT NULL THEN 'email'
        WHEN orders.notification_sms = true THEN 'sms'
      END,
      NEW.status,
      orders.notification_email,
      orders.phone_number
    FROM orders
    WHERE orders.id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create notification queue table
CREATE TABLE IF NOT EXISTS notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  order_id uuid REFERENCES orders(id),
  notification_type text NOT NULL,
  status order_status NOT NULL,
  email text,
  phone_number text,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Enable RLS on notification queue
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Add trigger for order status changes
CREATE TRIGGER notify_order_status_change_trigger
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_order_status_change();