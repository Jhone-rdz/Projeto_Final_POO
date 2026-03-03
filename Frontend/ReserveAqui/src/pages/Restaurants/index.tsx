import { Header, Footer } from '../../components/layout';
import { Alert } from '../../components/common';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { restaurantesService } from '../../services/api';
import type { Restaurante, PaginatedResponse } from '../../types';

const GOLD = '#C9922A';
const DARK_CARD = '#2e2b27';
const DARK_BG = '#1a1a1a';

/**
 * Página de Restaurantes — tema ReservaFácil
 */
const Restaurants = () => {
  const navigate = useNavigate();

  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const [busca, setBusca] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const estados = ['SP', 'RJ', 'MG', 'BA', 'RS', 'PR', 'SC', 'PE', 'GO', 'DF'];

  useEffect(() => {
    carregarRestaurantes();
  }, [paginaAtual, busca, cidade, estado]);

  const carregarRestaurantes = async () => {
    try {
      setCarregando(true);
      setErro('');
      const response: PaginatedResponse<Restaurante> = await restaurantesService.listar({
        page: paginaAtual,
        search: busca || undefined,
        cidade: cidade || undefined,
        estado: estado || undefined,
      });
      setRestaurantes(response.results || []);
      setTotalPaginas(response.count ? Math.ceil(response.count / 10) : 1);
    } catch {
      setErro('Erro ao carregar restaurantes');
      setRestaurantes([]);
    } finally {
      setCarregando(false);
    }
  };

  const handleLimparFiltros = () => {
    setBusca('');
    setCidade('');
    setEstado('');
    setPaginaAtual(1);
  };

  const handleProxPagina = () => {
    if (paginaAtual < totalPaginas) {
      setPaginaAtual(paginaAtual + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePagAnterior = () => {
    if (paginaAtual > 1) {
      setPaginaAtual(paginaAtual - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Estilos reutilizáveis
  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: DARK_CARD,
    border: '1.5px solid #5a5248',
    borderRadius: 8,
    padding: '11px 16px',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23C9922A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    paddingRight: 36,
    cursor: 'pointer',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: GOLD,
    fontWeight: 700,
    fontSize: '0.95rem',
    marginBottom: 8,
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#E8E4DE' }}>
      <Header />

      {/* Hero da página */}
      <div
        className="w-full flex flex-col items-center justify-center py-14"
        style={{
          background: 'linear-gradient(180deg, #1a1a1a 0%, #2e2a24 100%)',
          borderBottom: `2px solid ${GOLD}`,
        }}
      >
        <div className="flex items-center gap-4 mb-3">
          {/* Ícone garfo/faca/prato */}
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <circle cx="26" cy="26" r="25" stroke={GOLD} strokeWidth="2" fill="none" />
            <path d="M18 14v8c0 2.2 1.8 4 4 4v10" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M20 14v6M22 14v6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <path d="M30 14c0 0 4 2 4 8s-4 8-4 8v8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <h1
            style={{
              color: GOLD,
              fontSize: 'clamp(2rem, 4vw, 2.8rem)',
              fontWeight: 700,
              fontFamily: "'Georgia', serif",
              margin: 0,
            }}
          >
            Restaurantes
          </h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>
          Descubra e reserve em nossos melhores restaurantes
        </p>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Alerta de erro */}
        {erro && (
          <div className="mb-6">
            <Alert type="error" message={erro} onClose={() => setErro('')} />
          </div>
        )}

        {/* Card de Filtros */}
        <div
          style={{
            backgroundColor: '#3a3630',
            borderRadius: 14,
            border: `1px solid ${GOLD}`,
            padding: '28px 32px',
            marginBottom: 32,
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          }}
        >
          {/* Título filtros */}
          <div className="flex items-center gap-2 mb-6">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '1.15rem', margin: 0 }}>Filtros</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
            {/* Buscar por Nome */}
            <div>
              <label style={labelStyle}>
                🔎 Buscar por Nome
              </label>
              <input
                type="text"
                placeholder="Ex: Pizza, Sushi..."
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setPaginaAtual(1); }}
                disabled={carregando}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = GOLD)}
                onBlur={e => (e.currentTarget.style.borderColor = '#5a5248')}
              />
            </div>

            {/* Cidade */}
            <div>
              <label style={labelStyle}>📍 Cidade</label>
              <select
                value={cidade}
                onChange={(e) => { setCidade(e.target.value); setPaginaAtual(1); }}
                disabled={carregando}
                style={selectStyle}
              >
                <option value="">Ex: São Paulo</option>
                <option value="São Paulo">São Paulo</option>
                <option value="Rio de Janeiro">Rio de Janeiro</option>
                <option value="Belo Horizonte">Belo Horizonte</option>
                <option value="Fortaleza">Fortaleza</option>
                <option value="Salvador">Salvador</option>
                <option value="Curitiba">Curitiba</option>
                <option value="Porto Alegre">Porto Alegre</option>
                <option value="Recife">Recife</option>
                <option value="Brasília">Brasília</option>
                <option value="Goiânia">Goiânia</option>
              </select>
            </div>

            {/* Estado */}
            <div>
              <label style={labelStyle}>🗺️ Estado</label>
              <select
                value={estado}
                onChange={(e) => { setEstado(e.target.value); setPaginaAtual(1); }}
                disabled={carregando}
                style={selectStyle}
              >
                <option value="">Todos</option>
                {estados.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>

            {/* Botão Buscar */}
            <div>
              <button
                onClick={carregarRestaurantes}
                disabled={carregando}
                style={{
                  width: '100%',
                  backgroundColor: GOLD,
                  border: `2px solid ${GOLD}`,
                  color: '#1a1a1a',
                  borderRadius: 8,
                  padding: '11px 16px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: carregando ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'background-color 0.2s',
                  opacity: carregando ? 0.7 : 1,
                }}
                onMouseEnter={e => { if (!carregando) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#b07e1e'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = GOLD; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                Buscar
              </button>
            </div>
          </div>
        </div>

        {/* Área de resultados — dentro de card escuro */}
        <div
          style={{
            backgroundColor: '#3a3630',
            borderRadius: 14,
            border: `1px solid #5a5248`,
            padding: '32px',
            minHeight: 300,
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          }}
        >
          {/* Carregando */}
          {carregando && (
            <div className="flex flex-col items-center justify-center py-20">
              <div
                className="animate-spin rounded-full"
                style={{ width: 48, height: 48, border: '4px solid #5a5248', borderTopColor: GOLD }}
              />
              <p style={{ color: '#aaa', marginTop: 16, fontWeight: 500 }}>Carregando restaurantes...</p>
            </div>
          )}

          {/* Sem resultados */}
          {!carregando && restaurantes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <span style={{ fontSize: '2rem' }}>😔</span>
              <p style={{ color: '#aaa', fontSize: '1rem' }}>
                Nenhum restaurante encontrado com esses critérios
              </p>
              <button
                onClick={handleLimparFiltros}
                style={{
                  backgroundColor: GOLD,
                  border: 'none',
                  color: '#1a1a1a',
                  borderRadius: 8,
                  padding: '10px 28px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                🔄 Limpar Filtros
              </button>
            </div>
          )}

          {/* Grid de Restaurantes */}
          {!carregando && restaurantes.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {restaurantes.map((restaurante) => (
                  <div
                    key={restaurante.id}
                    onClick={() => navigate(`/restaurantes/${restaurante.id}`)}
                    style={{
                      backgroundColor: DARK_CARD,
                      borderRadius: 12,
                      border: '1px solid #5a5248',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 28px rgba(0,0,0,0.3)`;
                      (e.currentTarget as HTMLDivElement).style.borderColor = GOLD;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                      (e.currentTarget as HTMLDivElement).style.borderColor = '#5a5248';
                    }}
                  >
                    {/* Imagem placeholder */}
                    <div
                      style={{
                        width: '100%',
                        height: 160,
                        background: 'linear-gradient(135deg, #2a1f0e 0%, #4a3520 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem',
                      }}
                    >
                      🍽️
                    </div>

                    {/* Conteúdo */}
                    <div style={{ padding: '18px 20px' }}>
                      <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: 6, fontFamily: "'Georgia', serif" }}>
                        {restaurante.nome}
                      </h3>
                      <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {restaurante.descricao || 'Sem descrição'}
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                        <span style={{ color: '#bbb', fontSize: '0.82rem' }}>📍 {restaurante.endereco}</span>
                        <span style={{ color: '#bbb', fontSize: '0.82rem' }}>🏙️ {restaurante.cidade}, {restaurante.estado}</span>
                        {restaurante.telefone && <span style={{ color: '#bbb', fontSize: '0.82rem' }}>📞 {restaurante.telefone}</span>}
                      </div>

                      <button
                        style={{
                          width: '100%',
                          backgroundColor: GOLD,
                          border: 'none',
                          color: '#1a1a1a',
                          borderRadius: 7,
                          padding: '9px',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                        }}
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginação */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handlePagAnterior}
                  disabled={paginaAtual === 1 || carregando}
                  style={{
                    backgroundColor: 'transparent',
                    border: `1.5px solid ${paginaAtual === 1 ? '#5a5248' : GOLD}`,
                    color: paginaAtual === 1 ? '#5a5248' : GOLD,
                    borderRadius: 8,
                    padding: '8px 20px',
                    fontWeight: 600,
                    cursor: paginaAtual === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  ← Anterior
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPaginas) }).map((_, i) => {
                    const pagina = i + 1;
                    return (
                      <button
                        key={pagina}
                        onClick={() => { setPaginaAtual(pagina); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 8,
                          border: `1.5px solid ${paginaAtual === pagina ? GOLD : '#5a5248'}`,
                          backgroundColor: paginaAtual === pagina ? GOLD : 'transparent',
                          color: paginaAtual === pagina ? '#1a1a1a' : '#aaa',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                        }}
                      >
                        {pagina}
                      </button>
                    );
                  })}
                  {totalPaginas > 5 && <span style={{ color: '#888' }}>...</span>}
                </div>

                <button
                  onClick={handleProxPagina}
                  disabled={paginaAtual >= totalPaginas || carregando}
                  style={{
                    backgroundColor: 'transparent',
                    border: `1.5px solid ${paginaAtual >= totalPaginas ? '#5a5248' : GOLD}`,
                    color: paginaAtual >= totalPaginas ? '#5a5248' : GOLD,
                    borderRadius: 8,
                    padding: '8px 20px',
                    fontWeight: 600,
                    cursor: paginaAtual >= totalPaginas ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  Próximo →
                </button>
              </div>

              <p className="text-center mt-4" style={{ color: '#888', fontSize: '0.85rem' }}>
                Página <strong style={{ color: '#ccc' }}>{paginaAtual}</strong> de <strong style={{ color: '#ccc' }}>{totalPaginas}</strong>
              </p>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Restaurants;