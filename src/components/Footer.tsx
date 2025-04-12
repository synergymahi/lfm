import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-green-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                +225 05 85 47 85 85
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                contact@lafermedemahi.com
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Abidjan, Côte d'Ivoire
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Liens Utiles</h3>
            <ul className="space-y-2">
              <li><a href="/about" className="hover:text-green-200">À propos</a></li>
              <li><a href="/terms" className="hover:text-green-200">Conditions d'utilisation</a></li>
              <li><a href="/privacy" className="hover:text-green-200">Politique de confidentialité</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Horaires</h3>
            <p>Lundi - Samedi: 8h - 18h</p>
            <p>Dimanche: Fermé</p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-green-700 text-center">
          <p>&copy; 2025 lafermedemahi. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;