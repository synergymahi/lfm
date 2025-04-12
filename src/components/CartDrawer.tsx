import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, Trash2, ShoppingCart, CheckCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { DeliveryMethod, PaymentMethod } from '../types/order';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('home');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset states when drawer is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setShowSuccess(false);
      setShowOrderForm(false);
      setError(null);
      setDeliveryMethod('home');
      setPaymentMethod('mobile_money');
      setDeliveryAddress('');
      setDeliveryNotes('');
    }
  }, [isOpen]);

  const handleCheckout = async () => {
    if (!user) {
      onClose();
      navigate('/login');
      return;
    }
    setShowOrderForm(true);
  };

  const handleProfileUpdate = () => {
    // Store current cart state in session storage
    sessionStorage.setItem('returnToCart', 'true');
    onClose();
    navigate('/profile');
  };

  const handleContinueShopping = () => {
    clearCart();
    onClose();
    navigate('/paniers');
  };

  const handleSubmitOrder = async () => {
    if (!user || items.length === 0) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Get user profile for phone number
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number, email')
        .eq('id', user.id)
        .single();

      if (!profile?.phone_number) {
        setError(
          <div className="space-y-2">
            <p>Veuillez mettre à jour votre numéro de téléphone dans votre profil</p>
            <button
              onClick={handleProfileUpdate}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
            >
              Mettre à jour mon profil
            </button>
          </div>
        );
        return;
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          delivery_method: deliveryMethod,
          payment_method: paymentMethod,
          delivery_address: deliveryAddress,
          delivery_notes: deliveryNotes,
          phone_number: profile.phone_number,
          notification_email: profile.email,
          total_price: getTotalPrice(),
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        basket_id: item.basket.id,
        quantity: item.quantity,
        unit_price: item.basket.price,
        total_price: item.basket.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Show success message
      setShowSuccess(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Votre Panier</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {showSuccess ? (
              <div className="text-center py-8 space-y-4">
                <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
                <h3 className="text-xl font-semibold text-gray-900">Commande enregistrée avec succès !</h3>
                <p className="text-gray-600">
                  Notre équipe commerciale vous contactera dans les plus brefs délais pour confirmer votre commande.
                </p>
                <button
                  onClick={handleContinueShopping}
                  className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                >
                  Continuer mes achats
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-600">Votre panier est vide</p>
              </div>
            ) : showOrderForm ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mode de livraison
                  </label>
                  <select
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
                    className="w-full border-gray-300 rounded-md shadow-sm"
                  >
                    <option value="home">Livraison à domicile</option>
                    <option value="pickup">Retrait en magasin</option>
                  </select>
                </div>

                {deliveryMethod === 'home' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse de livraison
                    </label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm"
                      rows={3}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes de livraison (optionnel)
                  </label>
                  <textarea
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mode de paiement
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full border-gray-300 rounded-md shadow-sm"
                  >
                    <option value="mobile_money">Mobile Money</option>
                    <option value="cash">Espèces</option>
                  </select>
                </div>

                {error && (
                  <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {items.map(item => (
                  <div
                    key={item.basket.id}
                    className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    {item.basket.image_url ? (
                      <img
                        src={item.basket.image_url}
                        alt={item.basket.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                        <ShoppingCart className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-medium">{item.basket.name}</h3>
                      <p className="text-sm text-gray-600">
                        {(item.basket.price * item.quantity).toLocaleString('fr-FR')} FCFA
                      </p>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.basket.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.basket.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeItem(item.basket.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && !showSuccess && (
            <div className="border-t p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-xl font-bold text-green-600">
                  {getTotalPrice().toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {showOrderForm ? (
                  <>
                    <button
                      onClick={() => setShowOrderForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Retour
                    </button>
                    <button
                      onClick={handleSubmitOrder}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:bg-green-400"
                    >
                      {isSubmitting ? 'Validation...' : 'Valider ma commande'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={clearCart}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Vider le panier
                    </button>
                    <button
                      onClick={handleCheckout}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
                    >
                      Commander
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;