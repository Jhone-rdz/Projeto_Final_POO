import { Link } from 'react-router-dom';
import { Button } from '../common';

interface RestauranteCardProps {
  id: number;
  nome: string;
  endereco: string;
  cidade: string;
  imagem?: string;
  descricao?: string;
}

/**
 * Card de Restaurante
 */
export const RestauranteCard: React.FC<RestauranteCardProps> = ({
  id,
  nome,
  endereco,
  cidade,
  imagem,
  descricao,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Imagem */}
      <div className="relative h-48 bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden">
        {imagem ? (
          <img
            src={imagem}
            alt={nome}
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 3v1m6.364 1.636l-.707-.707M21 12h-1m1.364 6.364l-.707-.707M12 21v-1m-6.364-1.636l.707.707M3 12h1M3.636 5.636l.707.707"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        {/* Nome */}
        <h3 className="font-bold text-lg text-gray-900 mb-2">{nome}</h3>

        {/* Descrição */}
        {descricao && (
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{descricao}</p>
        )}

        {/* Localização */}
        <div className="flex items-start gap-2 text-gray-600 text-sm mb-4">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <div>
            <p>{endereco}</p>
            <p className="font-medium">{cidade}</p>
          </div>
        </div>

        {/* Botão */}
        <Link to={`/restaurantes/${id}`}>
          <Button variant="primary" size="sm" className="w-full">
            Ver Restaurante
          </Button>
        </Link>
      </div>
    </div>
  );
};
