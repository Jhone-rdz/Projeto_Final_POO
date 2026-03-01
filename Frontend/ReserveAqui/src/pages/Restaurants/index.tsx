import { Header, Footer } from '../../components/layout';
import { Input, Button, Alert } from '../../components/common';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { restaurantesService } from '../../services/api';
import type { Restaurante, PaginatedResponse } from '../../types';

/**
 * Página de Restaurantes - Listagem completa com filtros e busca
 */
const Restaurants = () => {
  const navigate = useNavigate();

  // Estado de restaurantes
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  // Estado de filtros
  const [busca, setBusca] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Cidades e estados comuns
  const estados = ['SP', 'RJ', 'MG', 'BA', 'RS', 'PR', 'SC', 'PE', 'GO', 'DF'];

  // Carregar restaurantes ao montar ou quando filtros mudarem
  useEffect(() => {
    carregarRestaurantes();
  }, [paginaAtual, busca, cidade, estado]);

  // Carregar restaurantes com filtros
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

  // Resetar filtros
  const handleLimparFiltros = () => {
    setBusca('');
    setCidade('');
    setEstado('');
    setPaginaAtual(1);
  };

  // Ir para próxima página
  const handleProxPagina = () => {
    if (paginaAtual < totalPaginas) {
      setPaginaAtual(paginaAtual + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Ir para página anterior
  const handlePagAnterior = () => {
    if (paginaAtual > 1) {
      setPaginaAtual(paginaAtual - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        {/* Título */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900">🍽️ Restaurantes</h1>
          <p className="text-gray-600 mt-2">Descubra e reserve em nossos melhores restaurantes</p>
        </div>

        {/* Alertas */}
        {erro && <Alert type="error" message={erro} onClose={() => setErro('')} />}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">🔍 Filtros</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Input
                label="🔎 Buscar por Nome"
                placeholder="Ex: Pizza, Sushi..."
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPaginaAtual(1);
                }}
                disabled={carregando}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📍 Cidade
              </label>
              <input
                type="text"
                placeholder="Ex: São Paulo"
                value={cidade}
                onChange={(e) => {
                  setCidade(e.target.value);
                  setPaginaAtual(1);
                }}
                disabled={carregando}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🗺️ Estado
              </label>
              <select
                value={estado}
                onChange={(e) => {
                  setEstado(e.target.value);
                  setPaginaAtual(1);
                }}
                disabled={carregando}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="">Todos</option>
                {estados.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="secondary"
                size="md"
                onClick={handleLimparFiltros}
                disabled={carregando}
                className="w-full"
              >
                🔄 Limpar
              </Button>
            </div>
          </div>
        </div>

        {/* Carregando */}
        {carregando && (
          <div className="text-center py-24">
            <div className="inline-block">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600 font-medium">Carregando restaurantes...</p>
            </div>
          </div>
        )}

        {/* Lista de Restaurantes */}
        {!carregando && (
          <>
            {restaurantes.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-gray-600 text-lg mb-4">
                  😔 Nenhum restaurante encontrado com esses critérios
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleLimparFiltros}
                >
                  🔄 Limpar Filtros
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {restaurantes.map((restaurante) => (
                    <div
                      key={restaurante.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                      onClick={() => navigate(`/restaurantes/${restaurante.id}`)}
                    >
                      {/* Imagem */}
                      <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <span className="text-5xl">🍽️</span>
                      </div>

                      {/* Conteúdo */}
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
                          {restaurante.nome}
                        </h3>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {restaurante.descricao || 'Sem descrição'}
                        </p>

                        <div className="space-y-2 mb-6 text-sm text-gray-700">
                          <div className="flex items-start gap-2">
                            <span className="text-lg">📍</span>
                            <span className="line-clamp-2">{restaurante.endereco}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🏙️</span>
                            <span>
                              {restaurante.cidade}, {restaurante.estado} - {restaurante.cep}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📞</span>
                            <span>{restaurante.telefone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">✉️</span>
                            <span className="truncate">{restaurante.email}</span>
                          </div>
                        </div>

                        <Button
                          variant="primary"
                          size="md"
                          className="w-full"
                          onClick={() => navigate(`/restaurantes/${restaurante.id}`)}
                        >
                          👀 Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginação */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handlePagAnterior}
                    disabled={paginaAtual === 1 || carregando}
                  >
                    ← Anterior
                  </Button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPaginas) }).map((_, i) => {
                      const pagina = i + 1;
                      return (
                        <button
                          key={pagina}
                          onClick={() => {
                            setPaginaAtual(pagina);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            paginaAtual === pagina
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-600'
                          }`}
                        >
                          {pagina}
                        </button>
                      );
                    })}
                    {totalPaginas > 5 && <span className="text-gray-500">...</span>}
                  </div>

                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleProxPagina}
                    disabled={paginaAtual >= totalPaginas || carregando}
                  >
                    Próximo →
                  </Button>
                </div>

                {/* Info de Paginação */}
                <div className="text-center text-gray-600 text-sm">
                  Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong>
                </div>
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Restaurants;
