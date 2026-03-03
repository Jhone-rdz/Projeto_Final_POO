import { Link } from 'react-router-dom';
import { Button } from '../common';

const GOLD = '#C9922A';

interface RestauranteCardProps {
  id: number;
  nome: string;
  endereco: string;
  cidade: string;
  imagem?: string;
  descricao?: string;
  culinaria?: string;
  horario?: string;
  mesasDisponiveis?: number;
}

/**
 * Card de Restaurante — tema ReservaFácil
 */
export const RestauranteCard: React.FC<RestauranteCardProps> = ({
  id,
  nome,
  endereco,
  cidade,
  imagem,
  descricao,
  culinaria,
  horario,
  mesasDisponiveis,
}) => {
  return (
    <div
      className="overflow-hidden flex flex-col"
      style={{
        backgroundColor: '#fff',
        borderRadius: 14,
        border: '1px solid #e8e0d4',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.13)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Imagem */}
      <div className="relative overflow-hidden" style={{ height: 200 }}>
        {imagem ? (
          <img
            src={imagem}
            alt={nome}
            className="w-full h-full object-cover"
            style={{ transition: 'transform 0.4s ease' }}
            onMouseEnter={e => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1.06)')}
            onMouseLeave={e => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1)')}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2a1f0e 0%, #4a3520 100%)' }}
          >
            <svg className="w-16 h-16" style={{ color: GOLD, opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
        )}

        {/* Badge culinária */}
        {culinaria && (
          <span
            className="absolute top-3 left-3 font-semibold"
            style={{
              backgroundColor: '#fff',
              color: '#1a1a1a',
              borderRadius: 6,
              padding: '4px 12px',
              fontSize: '0.8rem',
              boxShadow: '0 1px 6px rgba(0,0,0,0.18)',
            }}
          >
            {culinaria}
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex flex-col flex-1 p-5">
        {/* Nome */}
        <h3
          className="font-bold mb-3"
          style={{ fontSize: '1.1rem', color: '#1a1a1a', fontFamily: "'Georgia', serif" }}
        >
          {nome}
        </h3>

        {/* Endereço */}
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#888' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span style={{ color: '#555', fontSize: '0.9rem' }}>
            {endereco}{cidade ? ` - ${cidade}` : ''}
          </span>
        </div>

        {/* Horário */}
        {horario && (
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#888' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span style={{ color: '#555', fontSize: '0.9rem' }}>{horario}</span>
          </div>
        )}

        {/* Descrição (fallback se não tiver horário/mesas) */}
        {descricao && !horario && (
          <p className="mb-4 line-clamp-2" style={{ color: '#777', fontSize: '0.875rem', lineHeight: 1.55 }}>
            {descricao}
          </p>
        )}

        {/* Rodapé do card: mesas + botão */}
        <div className="flex items-center justify-between mt-auto pt-3" style={{ borderTop: '1px solid #f0e8dc' }}>
          {mesasDisponiveis !== undefined ? (
            <span style={{ color: GOLD, fontSize: '0.9rem', fontWeight: 600 }}>
              {mesasDisponiveis} mesa{mesasDisponiveis !== 1 ? 's' : ''} disponíve{mesasDisponiveis !== 1 ? 'is' : 'l'}
            </span>
          ) : (
            <span />
          )}

          <Link to={`/restaurantes/${id}`}>
            <Button variant="primary" size="sm">
              Ver restaurante
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};