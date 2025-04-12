import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBasket, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Basket, BasketItem } from '../types/basket';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const BasketDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [basket, setBasket] = useState<Basket | null>(null);
  const [items, setItems] = useState<BasketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchBasketDetails = async () => {
      try {
        // Fetch basket details using slug
        const { data: basketData, error: basketError } = await supabase
          .from('baskets')
          .select('*')
          .eq('slug', slug)
          .single();

        if (basketError) throw basketError;
        setBasket(basketData);

        // Fetch basket items
        const { data: itemsData, error: itemsError } = await supabase
          .from('basket_items')
          .select('*')
          .eq('basket_id', basketData.id);

        if (itemsError) throw itemsError;
        setItems(itemsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBasketDetails();
    }
  }, [slug]);

  const handleAddToCart = () => {
    if (!basket) return;
    
    setAddingToCart(true);
    addItem(basket, quantity);
    
    setTimeout(() => {
      setAddingToCart(false);
      setQuantity(1);
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (error || !basket) {
    return (
      <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center p-4">
        <div className="text-red-600 text-center">
          <p className="text-xl font-semibold">Erreur</p>
          <p>{error || 'Panier non trouvé'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <button
        onClick={() => navigate('/paniers')}
        className="flex items-center text-green-600 hover:text-green-700 mb-6 sm:mb-8"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        <span className="text-sm sm:text-base">Retour aux paniers</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
        <div>
          {basket.image_url ? (
            <img
              src={basket.image_url}
              alt={basket.name}
              className="w-full h-64 sm:h-96 object-cover rounded-lg shadow-lg"
            />
          ) : (
            <div className="w-full h-64 sm:h-96 bg-gray-200 rounded-lg flex items-center justify-center">
              <ShoppingBasket className="h-16 sm:h-20 w-16 sm:w-20 text-gray-400" />
            </div>
          )}
        </div>

        <div className="space-y-6 sm:space-y-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">{basket.name}</h1>
            <p className="text-gray-600 text-base sm:text-lg">{basket.description}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Contenu du panier</h2>
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between items-center text-sm sm:text-base">
                  <span className="text-gray-700">{item.item_name}</span>
                  <span className="text-gray-600">{item.quantity}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <span className="text-2xl sm:text-3xl font-bold text-green-600">
                {(basket.price * quantity).toLocaleString('fr-FR')} FCFA
              </span>
              <p className="text-sm text-gray-500">Prix total</p>
            </div>
            <div className="flex items-center space-x-4">
              <label htmlFor="quantity" className="text-gray-700 text-sm sm:text-base">Quantité:</label>
              <select
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={addingToCart}
            className={`w-full py-3 px-6 rounded-lg text-base sm:text-lg font-semibold transition-colors ${
              addingToCart
                ? 'bg-green-500 text-white cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-500'
            }`}
          >
            {addingToCart ? 'Ajouté !' : 'Ajouter au panier'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BasketDetail;