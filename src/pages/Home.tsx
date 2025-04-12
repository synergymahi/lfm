import React, { useEffect, useState } from 'react';
import { ShoppingBasket, Truck, Users } from 'lucide-react';
import BasketCard from '../components/BasketCard';
import { supabase } from '../lib/supabase';
import type { Basket } from '../types/basket';

const Home = () => {
  const [featuredBaskets, setFeaturedBaskets] = useState<Basket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedBaskets = async () => {
      try {
        const { data, error } = await supabase
          .from('baskets')
          .select('*')
          .eq('available', true)
          .eq('is_featured_product', true)
          .limit(3)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setFeaturedBaskets(data || []);
      } catch (err) {
        console.error('Error fetching featured baskets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedBaskets();
  }, []);

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section 
        className="relative h-[500px] flex items-center"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Des Produits Frais<br />Directement Chez Vous
          </h1>
          <p className="text-xl mb-8 max-w-2xl">
            Découvrez nos paniers de produits agricoles frais et locaux, 
            livrés directement à votre porte à Abidjan et ses environs.
          </p>
          <a 
            href="/paniers" 
            className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-500 transition-colors"
          >
            Découvrir nos paniers
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Pourquoi nous choisir ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <ShoppingBasket className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-semibold mb-2">Produits Frais</h3>
            <p className="text-gray-600">
              Des produits locaux sélectionnés avec soin pour leur qualité et leur fraîcheur.
            </p>
          </div>
          <div className="text-center p-6">
            <Truck className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-semibold mb-2">Livraison Rapide</h3>
            <p className="text-gray-600">
              Livraison à domicile dans Abidjan et ses environs sous 24h.
            </p>
          </div>
          <div className="text-center p-6">
            <Users className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-semibold mb-2">Service Client</h3>
            <p className="text-gray-600">
              Une équipe à votre écoute pour vous accompagner dans vos commandes.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Baskets */}
      <section className="bg-green-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Nos Paniers Populaires</h2>
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : featuredBaskets.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBasket className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600">Aucun panier mis en avant pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredBaskets.map((basket) => (
                <BasketCard key={basket.id} basket={basket} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;