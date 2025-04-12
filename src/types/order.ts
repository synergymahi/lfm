export type DeliveryMethod = 'home' | 'pickup';
export type PaymentMethod = 'cash' | 'mobile_money';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  basket_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  delivery_method: DeliveryMethod;
  payment_method: PaymentMethod;
  delivery_address: string;
  delivery_notes?: string;
  phone_number: string;
  notification_email?: string;
  notification_sms: boolean;
  total_price: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}