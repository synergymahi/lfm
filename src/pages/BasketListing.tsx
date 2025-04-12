import React, { useEffect, useState } from 'react';
import { ShoppingBasket } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Basket } from '../types/basket';
import BasketCard from '../components/BasketCard';

const BasketListing = () => {
  const [baskets, setBaskets] = useState<Basket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBaskets = async () => {
      try {
        const { data, error } = await supabase
          .from('baskets')
          .select('*')
          .eq('available', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBaskets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchBaskets();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center p-4">
        <div className="text-red-600 text-center">
          <p className="text-xl font-semibold">Erreur</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Nos Paniers</h1>
        <p className="text-base sm:text-lg text-gray-600 px-4">
          Découvrez notre sélection de paniers frais et locaux
        </p>
      </div>

      {baskets.length === 0 ? (
        <div className="text-center py-8 sm:py-12 px-4">
          <ShoppingBasket className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Aucun panier disponible</h3>
          <p className="mt-1 text-sm text-gray-500">
            Revenez plus tard pour découvrir nos nouveaux paniers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {baskets.map((basket) => (
            <BasketCard key={basket.id} basket={basket} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BasketListing;