import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBasket, Plus, Minus, Trash2, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { DeliveryMethod, PaymentMethod } from '../types/order';

interface CustomItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

// Updated with proper UUIDs
const AVAILABLE_ITEMS = [
  { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Tomates', price: 1000 },
  { id: '123e4567-e89b-12d3-a456-426614174002', name: 'Oignons', price: 800 },
  { id: '123e4567-e89b-12d3-a456-426614174003', name: 'Pommes de terre', price: 1200 },
  { id: '123e4567-e89b-12d3-a456-426614174004', name: 'Carottes', price: 900 },
  { id: '123e4567-e89b-12d3-a456-426614174005', name: 'Poivrons', price: 1500 },
  { id: '123e4567-e89b-12d3-a456-426614174006', name: 'Concombres', price: 700 },
  { id: '123e4567-e89b-12d3-a456-426614174007', name: 'Aubergines', price: 1100 },
  { id: '123e4567-e89b-12d3-a456-426614174008', name: 'Courgettes', price: 1300 },
  { id: '123e4567-e89b-12d3-a456-426614174009', name: 'Laitues', price: 600 },
  { id: '123e4567-e89b-12d3-a456-426614174010', name: 'Piments', price: 500 },
];

const CustomBasket = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedItems, setSelectedItems] = useState<CustomItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRecap, setShowRecap] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('home');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredItems = AVAILABLE_ITEMS.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItem = (item: typeof AVAILABLE_ITEMS[0]) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }
    setSelectedItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const getTotalPrice = () => {
    return selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleOrder = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setError(null);

    try {
      // Check if user has a phone number
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('id', user.id)
        .single();

      if (!profile?.phone_number) {
        setShowPhoneModal(true);
        return;
      }

      // Show order recap
      setShowRecap(true);
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    }
  };

  const handleSavePhoneNumber = async () => {
    if (!phoneNumber) {
      setError('Veuillez entrer un numéro de téléphone');
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ phone_number: phoneNumber })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setShowPhoneModal(false);
      setShowRecap(true);
    } catch (err) {
      setError('Une erreur est survenue lors de la sauvegarde du numéro de téléphone');
    }
  };

  const handleConfirmOrder = async () => {
    if (!user || selectedItems.length === 0) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number, email')
        .eq('id', user.id)
        .single();

      if (!profile?.phone_number) {
        setError('Numéro de téléphone non trouvé');
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

      // Create order items without basket_id since these are custom items
      const orderItems = selectedItems.map(item => ({
        order_id: order.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Show success message
      setShowSuccess(true);
      setSelectedItems([]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueShopping = () => {
    setShowSuccess(false);
    setShowRecap(false);
    setSelectedItems([]);
  };

  if (showSuccess) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-4">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Commande enregistrée avec succès !</h2>
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
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Personnalisez Votre Panier</h1>

      {/* Phone Number Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-30"></div>
            <div className="relative bg-white rounded-lg p-8 max-w-md w-full">
              <button
                onClick={() => setShowPhoneModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
              <h2 className="text-xl font-semibold mb-4">Numéro de téléphone requis</h2>
              <p className="text-gray-600 mb-4">
                Pour finaliser votre commande, veuillez entrer votre numéro de téléphone.
              </p>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ex: 0585478585"
                className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4"
              />
              {error && (
                <p className="text-red-600 text-sm mb-4">{error}</p>
              )}
              <button
                onClick={handleSavePhoneNumber}
                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-500"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Recap Modal */}
      {showRecap && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-30"></div>
            <div className="relative bg-white rounded-lg p-8 max-w-2xl w-full">
              <button
                onClick={() => setShowRecap(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
              <h2 className="text-2xl font-semibold mb-6">Récapitulatif de votre commande</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Articles sélectionnés</h3>
                  <div className="space-y-2">
                    {selectedItems.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.name} × {item.quantity}</span>
                        <span>{(item.price * item.quantity).toLocaleString('fr-FR')} FCFA</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{getTotalPrice().toLocaleString('fr-FR')} FCFA</span>
                      </div>
                    </div>
                  </div>
                </div>

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
                </div>

                {error && (
                  <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
                    {error}
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    onClick={() => setShowRecap(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleConfirmOrder}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:bg-green-400"
                  >
                    {isSubmitting ? 'Validation...' : 'Confirmer la commande'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Available Items Section */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-500 transition-colors"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-gray-600">{item.price.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <button
                  onClick={() => addItem(item)}
                  className="bg-green-600 text-white p-2 rounded-full hover:bg-green-500 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Items Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Votre Panier</h2>
          
          {selectedItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBasket className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600">Votre panier est vide</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {selectedItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-gray-600 hover:text-gray-900"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-gray-600 hover:text-gray-900"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-green-600">
                    {getTotalPrice().toLocaleString('fr-FR')} FCFA
                  </span>
                </div>

                <button
                  onClick={handleOrder}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-500 transition-colors"
                >
                  Commander
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomBasket;