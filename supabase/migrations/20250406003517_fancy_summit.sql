/*
  # Add INSERT policy for order_items table

  1. Changes
    - Add new RLS policy to allow users to insert order items for their own orders
  
  2. Security
    - Policy ensures users can only create order items for orders they own
    - Verifies ownership by checking the order's user_id against the authenticated user's ID
*/

CREATE POLICY "Users can create order items for their own orders"
ON order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);