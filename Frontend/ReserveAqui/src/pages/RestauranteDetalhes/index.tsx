import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header, Footer } from '../../components/layout';
import { restaurantesService, mesasService } from '../../services/api';
import type { Restaurante, Mesa } from '../../types';
import { useAuth } from '../../context';

const GOLD = '#C9922A';
const BEGE = '#E8E4DE';

/**
 * Página de Detalhes do Restaurante — tema ReservaFácil
 */
const RestauranteDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => { if (id) carregarDetalhes(); }, [id]);

  const carregarDetalhes = async () => {
    try {
      setCarregando(true);
      setErro('');
      const restauranteData = await restaurantesService.obter(Number(id));
      setRestaurante(restauranteData);
      if (isAuthenticated) {
        try {
          const mesasResponse = await mesasService.listar({ restaurante: Number(id) });
          // Log para debug
          console.log('Mesas Response:', mesasResponse);
          setMesas(Array.isArray(mesasResponse) ? mesasResponse : (mesasResponse.results || []));
        } catch (err) {
          // Se falhar ao carregar mesas, apenas continua sem elas
          console.error('Erro ao carregar mesas:', err);
          setMesas([]);
        }
      } else {
        setMesas([]);
      }
    } catch {
      setErro('Não foi possível carregar os detalhes do restaurante.');
    } finally {
      setCarregando(false);
    }
  };

  const mesasDisponiveis = isAuthenticated
    ? mesas.filter(m => m.status === 'disponivel').length
    : (restaurante?.quantidade_mesas || 0);

  const totalMesas = isAuthenticated ? mesas.length : (restaurante?.quantidade_mesas || 0);

  const handleFazerReserva = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: `/restaurantes/${id}` } });
    } else {
      navigate(`/reserva/${id}`);
    }
  };

  // ── Loading ──
  if (carregando) {
    return (
      <div className="w-full flex flex-col min-h-screen" style={{ backgroundColor: BEGE }}>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full" style={{ width: 44, height: 44, border: '4px solid #e5d9c8', borderTopColor: GOLD }} />
            <p style={{ color: '#666' }}>Carregando detalhes do restaurante...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Erro ──
  if (erro || !restaurante) {
    return (
      <div className="w-full flex flex-col min-h-screen" style={{ backgroundColor: BEGE }}>
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: '40px 32px', maxWidth: 400, textAlign: 'center' }}>
            <p style={{ color: '#e05555', marginBottom: 20 }}>{erro || 'Restaurante não encontrado'}</p>
            <button onClick={() => navigate('/')} style={{ backgroundColor: GOLD, border: 'none', color: '#fff', borderRadius: 8, padding: '10px 28px', fontWeight: 700, cursor: 'pointer' }}>
              Voltar para Home
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col min-h-screen" style={{ backgroundColor: BEGE }}>
      <Header />

      {/* ── Hero: foto full-width com overlay e nome ── */}
      <section style={{ position: 'relative', width: '100%', height: 420, overflow: 'hidden' }}>
        {/* Foto de fundo */}
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80"
          alt={restaurante.nome}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Overlay gradient escuro na parte inferior */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }} />

        {/* Badge de culinária + título */}
        <div style={{ position: 'absolute', bottom: 32, left: 40 }}>
          <h1 style={{ color: '#fff', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, fontFamily: "'Georgia', serif", textShadow: '0 2px 12px rgba(0,0,0,0.5)', margin: 0 }}>
            {restaurante.nome}
          </h1>
        </div>
      </section>

      {/* ── Conteúdo principal ── */}
      <main className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Layout 2 colunas: info + sidebar reserva */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* ── Coluna principal ── */}
          <div className="lg:col-span-2">
            {/* Sobre */}
            {restaurante.descricao && (
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '0.95rem', marginBottom: 4 }}>Sobre</p>
                <p style={{ color: '#1a1a1a', fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {restaurante.descricao}
                </p>
              </div>
            )}

            {/* Cards de info: Localização, Horário, Mesas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Localização */}
              <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #e5ddd5', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#f5f0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '0.9rem', marginBottom: 2 }}>Localização</p>
                  <p style={{ color: '#555', fontSize: '0.85rem' }}>{restaurante.endereco} - {restaurante.cidade}</p>
                </div>
              </div>

              {/* Horário */}
              <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #e5ddd5', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#f5f0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '0.9rem', marginBottom: 2 }}>Horário</p>
                  <p style={{ color: '#555', fontSize: '0.85rem' }}>
                    {restaurante.horario_funcionamento || '11:00 - 23:00'}
                  </p>
                </div>
              </div>

              {/* Mesas disponíveis */}
              <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #e5ddd5', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#f5f0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="8" width="18" height="4" rx="1" />
                    <path d="M5 12v5M19 12v5M8 8V6a4 4 0 018 0v2" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '0.9rem', marginBottom: 2 }}>Mesas disponíveis</p>
                  <p style={{ color: '#555', fontSize: '0.85rem' }}>
                    {mesasDisponiveis} de {totalMesas}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Sidebar: Fazer reserva ── */}
          <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: '24px 28px', border: '1px solid #e5ddd5', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', position: 'sticky', top: 88 }}>
            <p style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '1rem', marginBottom: 6 }}>Faça sua reserva</p>
            <p style={{ color: '#1a1a1a', fontWeight: 600, fontSize: '0.9rem', marginBottom: 20 }}>
              {mesasDisponiveis} mesas.
            </p>

            <button
              onClick={handleFazerReserva}
              disabled={mesasDisponiveis === 0}
              style={{
                width: '100%',
                backgroundColor: mesasDisponiveis > 0 ? GOLD : '#ccc',
                border: 'none',
                color: mesasDisponiveis > 0 ? '#fff' : '#888',
                borderRadius: 8,
                padding: '12px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: mesasDisponiveis > 0 ? 'pointer' : 'not-allowed',
                marginBottom: 12,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={e => { if (mesasDisponiveis > 0) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#b07e1e'; }}
              onMouseLeave={e => { if (mesasDisponiveis > 0) (e.currentTarget as HTMLButtonElement).style.backgroundColor = GOLD; }}
            >
              Fazer reserva
            </button>

            {!isAuthenticated && (
              <p style={{ color: '#888', fontSize: '0.82rem', textAlign: 'center' }}>
                É necessário estar logado para reservar.
              </p>
            )}

            {mesasDisponiveis === 0 && (
              <p style={{ color: '#e05555', fontSize: '0.82rem', textAlign: 'center', marginTop: 4 }}>
                Nenhuma mesa disponível no momento.
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RestauranteDetalhes;