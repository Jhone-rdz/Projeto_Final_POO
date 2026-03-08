import { useCallback, useEffect, useRef, useState } from 'react';
import { Header, Footer } from '../../components/layout';
import { RestauranteCard } from '../../components/features';
import { restaurantesService } from '../../services/api';
import type { Restaurante } from '../../types';

/**
 * Página Home - Tela inicial do sistema
 * Design: ReserveAqui — tema escuro/dourado inspirado nas imagens de referência
 */
export const Home = () => {
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const destaquesRef = useRef<HTMLElement | null>(null);

  const carregarRestaurantes = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) {
        setCarregando(true);
        setErro('');
      }
      const resposta = await restaurantesService.listar({ page: 1 });
      const payload = resposta as unknown;
      const lista = Array.isArray(payload)
        ? (payload as Restaurante[])
        : ((payload as { results?: Restaurante[] })?.results || []);
      setRestaurantes(lista);
    } catch (error) {
      console.error('Erro ao carregar restaurantes:', error);
      if (!silencioso) {
        setErro('Não foi possível carregar os restaurantes. Tente novamente mais tarde.');
      }
    } finally {
      if (!silencioso) setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarRestaurantes();
  }, [carregarRestaurantes]);

  useEffect(() => {
    const atualizar = () => {
      if (document.visibilityState === 'visible') {
        carregarRestaurantes(true);
      }
    };

    const intervalId = window.setInterval(atualizar, 15000);
    window.addEventListener('focus', atualizar);
    document.addEventListener('visibilitychange', atualizar);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', atualizar);
      document.removeEventListener('visibilitychange', atualizar);
    };
  }, [carregarRestaurantes]);

  const handleVerRestaurantes = () => {
    destaquesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="w-full flex flex-col min-h-screen" style={{ backgroundColor: '#F5F0EA' }}>
      <Header />

      {/* ── Hero Section ── */}
      <section
        className="w-full relative flex flex-col items-center justify-center text-center text-white overflow-hidden"
        style={{ minHeight: '100vh' }}
      >
        {/* Imagem de fundo com overlay escuro */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80')",
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(20, 12, 0, 0.72)' }}
        />

        {/* Conteúdo centralizado */}
        <div className="relative z-10 flex flex-col items-center px-4" style={{ maxWidth: 780 }}>
          <h1
            className="font-serif mb-6 leading-tight"
            style={{
              fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontWeight: 400,
              letterSpacing: '-0.01em',
            }}
          >
            Reserve sua mesa perfeita
          </h1>

          <p
            className="mb-10"
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              color: 'rgba(255,255,255,0.82)',
              maxWidth: 560,
              lineHeight: 1.65,
              fontFamily: "'Georgia', serif",
            }}
          >
            Descubra os melhores restaurantes da cidade e faça sua reserva em poucos cliques
          </p>

          <button
            onClick={handleVerRestaurantes}
            style={{
              backgroundColor: '#C9922A',
              color: '#fff',
              border: '2px solid #C9922A',
              borderRadius: 10,
              padding: '14px 48px',
              fontSize: '1.05rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#b07e1e';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#b07e1e';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#C9922A';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#C9922A';
            }}
          >
            Ver restaurantes
          </button>
        </div>

        
      </section>

      {/* ── Seção de Restaurantes em Destaque ── */}
      <section ref={destaquesRef} className="w-full py-16 px-4" style={{ backgroundColor: '#F5F0EA' }}>
        <div className="w-full max-w-7xl mx-auto">

          {/* Título da seção */}
          <div className="mb-10" style={{ paddingLeft: 4 }}>
            <h2
              className="font-bold mb-1"
              style={{
                fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                color: '#1a1a1a',
                fontFamily: "'Georgia', serif",
              }}
            >
              Restaurantes em destaque
            </h2>
            <p
              className="font-bold"
              style={{ fontSize: '1rem', color: '#1a1a1a' }}
            >
              Escolha entre os melhores restaurantes e reserve sua experiência
            </p>
          </div>

          {/* Carregando */}
          {carregando && (
            <div className="flex justify-center items-center py-16">
              <div
                className="animate-spin rounded-full"
                style={{
                  width: 44,
                  height: 44,
                  border: '4px solid #e5d9c8',
                  borderTopColor: '#C9922A',
                }}
              />
              <span className="ml-4 font-medium" style={{ color: '#555' }}>
                Carregando restaurantes...
              </span>
            </div>
          )}

          {/* Erro */}
          {erro && !carregando && (
            <div
              className="rounded-xl p-8 text-center"
              style={{ background: '#fff3cd', border: '1px solid #f0c060' }}
            >
              <p style={{ color: '#7a5a00', fontWeight: 600 }}>{erro}</p>
              <button
                onClick={() => carregarRestaurantes()}
                className="mt-4 underline font-semibold"
                style={{ color: '#C9922A', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Grid de Restaurantes */}
          {!carregando && restaurantes.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {restaurantes.map((restaurante) => (
                  <RestauranteCard
                    key={restaurante.id}
                    id={restaurante.id}
                    nome={restaurante.nome}
                    endereco={restaurante.endereco}
                    cidade={restaurante.cidade}
                    descricao={restaurante.descricao}
                    mesasDisponiveis={restaurante.mesas_disponiveis ?? restaurante.quantidade_mesas}
                  />
                ))}
              </div>


            </>
          )}

          {/* Sem Restaurantes */}
          {!carregando && restaurantes.length === 0 && !erro && (
            <div
              className="rounded-xl p-14 text-center"
              style={{ background: '#fff', border: '1px solid #e5d9c8' }}
            >
              <p style={{ color: '#888', fontSize: '1.1rem' }}>
                Nenhum restaurante disponível no momento
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};