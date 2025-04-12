import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBasket } from 'lucide-react';
import type { Basket } from '../types/basket';
import { useCart } from '../contexts/CartContext';

interface BasketCardProps {
  basket: Basket;
  showOrderButton?: boolean;
  className?: string;
}

const BasketCard: React.FC<BasketCardProps> = ({ 
  basket, 
  showOrderButton = true,
  className = ''
}) => {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking the button
    setIsAdding(true);
    addItem(basket, 1);
    
    setTimeout(() => {
      setIsAdding(false);
    }, 500);
  };

  return (
    <Link
      to={`/paniers/${basket.slug}`}
      className={`bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}
    >
      {basket.image_url ? (
        <img
          src={basket.image_url}
          alt={basket.name}
          className="w-full h-48 sm:h-56 object-cover"
        />
      ) : (
        <div className="w-full h-48 sm:h-56 bg-gray-200 flex items-center justify-center">
          <ShoppingBasket className="h-12 w-12 text-gray-400" />
        </div>
      )}
      <div className="p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          {basket.name}
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-2 text-sm sm:text-base">
          {basket.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl sm:text-2xl font-bold text-green-600">
            {basket.price.toLocaleString('fr-FR')} FCFA
          </span>
          {showOrderButton && (
            <button
              onClick={handleAddToCart}
              className={`${
                isAdding
                  ? 'bg-green-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-500'
              } text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base transition-colors`}
              disabled={isAdding}
            >
              {isAdding ? 'Ajouté !' : 'Ajouter au panier'}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default BasketCard;