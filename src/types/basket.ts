export interface Basket {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  available: boolean;
  slug: string;
  is_featured_product: boolean;
  created_at: string;
  updated_at: string;
}

export interface BasketItem {
  id: string;
  basket_id: string;
  item_name: string;
  quantity: string;
  category: string;
  created_at: string;
}