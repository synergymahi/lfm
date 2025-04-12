import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, User, Menu, X, ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import CartDrawer from './CartDrawer';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Leaf className="h-8 w-8" />
              <span className="text-xl font-bold">LaFermeDeMahi</span>
            </Link>
            
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 hover:bg-green-600 rounded-md mr-2 relative"
              >
                <ShoppingCart className="h-6 w-6" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md hover:bg-green-600 focus:outline-none"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/paniers" className="hover:text-green-200 transition-colors">
                Nos Paniers
              </Link>
              <Link to="/personnaliser" className="hover:text-green-200 transition-colors">
                Personnaliser
              </Link>
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 hover:bg-green-600 rounded-md relative"
              >
                <ShoppingCart className="h-6 w-6" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </button>
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link to="/profile" className="flex items-center space-x-2 hover:text-green-200">
                    <User className="h-5 w-5" />
                    <span>Profil</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-500 transition-colors"
                  >
                    Déconnexion
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-500 transition-colors"
                >
                  Connexion
                </Link>
              )}
            </div>
          </div>

          {/* Mobile navigation */}
          {isMenuOpen && (
            <div className="md:hidden pb-4">
              <div className="flex flex-col space-y-3">
                <Link 
                  to="/paniers" 
                  className="hover:bg-green-600 px-3 py-2 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Nos Paniers
                </Link>
                <Link 
                  to="/personnaliser" 
                  className="hover:bg-green-600 px-3 py-2 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Personnaliser
                </Link>
                {user ? (
                  <>
                    <Link 
                      to="/profile" 
                      className="hover:bg-green-600 px-3 py-2 rounded-md flex items-center space-x-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      <span>Profil</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="text-left hover:bg-green-600 px-3 py-2 rounded-md w-full"
                    >
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="hover:bg-green-600 px-3 py-2 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Connexion
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Navbar;