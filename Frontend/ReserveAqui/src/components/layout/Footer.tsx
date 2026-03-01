import { Link } from 'react-router-dom';

/**
 * Componente de Footer
 */
export const Footer = () => {
  return (
    <footer className="w-full bg-gray-900 text-white py-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Sobre */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                R
              </div>
              <span className="font-bold text-xl">ReserveAqui</span>
            </div>
            <p className="text-gray-400 text-sm">
              A forma mais fácil e rápida de reservar sua mesa em restaurantes.
            </p>
          </div>

          {/* Links Úteis */}
          <div>
            <h3 className="font-bold mb-4">Links Úteis</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/" className="hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/restaurants" className="hover:text-white">
                  Restaurantes
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Sobre nós
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Contato
                </a>
              </li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h3 className="font-bold mb-4">Suporte</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-white">
                  Central de Ajuda
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Termos de Serviço
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Política de Privacidade
                </a>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="font-bold mb-4">Contato</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="mailto:suporte@reserveaqui.com" className="hover:text-white">
                  suporte@reserveaqui.com
                </a>
              </li>
              <li>
                <a href="tel:+551133334444" className="hover:text-white">
                  (11) 3333-4444
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divisor */}
        <hr className="border-gray-800 my-8" />

        {/* Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>&copy; 2026 ReserveAqui. Todos os direitos reservados.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white">
              Facebook
            </a>
            <a href="#" className="hover:text-white">
              Instagram
            </a>
            <a href="#" className="hover:text-white">
              Twitter
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
