import { useEffect, useState } from 'react';
import { Header, Footer } from '../../components/layout';
import { RestauranteCard } from '../../components/features';
import { restaurantesService } from '../../services/api';
import type { Restaurante } from '../../types';
import { Button } from '../../components/common';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';

/**
 * Página Home - Tela inicial do sistema
 */
export const Home = () => {
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    carregarRestaurantes();
  }, []);

  const carregarRestaurantes = async () => {
    try {
      setCarregando(true);
      setErro('');
      const resposta = await restaurantesService.listar({ page: 1 });
      setRestaurantes(resposta.results || []);
    } catch (error) {
      console.error('Erro ao carregar restaurantes:', error);
      setErro('Não foi possível carregar os restaurantes. Tente novamente mais tarde.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="w-full relative h-96 bg-gradient-to-r from-blue-600 to-blue-800 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        {/* Conteúdo */}
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="w-full md:w-1/2">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">Reservas Fáceis</h1>
            <p className="text-xl text-blue-100 mb-8">
              Encontre e reserve sua mesa em restaurantes incríveis com apenas alguns cliques.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/restaurants')}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Explorar Restaurantes
              </Button>
              {!isAuthenticated && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate('/register')}
                  className="border-white text-white hover:bg-white hover:text-blue-600"
                >
                  Cadastre-se Agora
                </Button>
              )}
            </div>
          </div>

          {/* Ilustração */}
          <div className="hidden md:flex md:w-1/2 justify-center items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-white rounded-3xl opacity-10 blur-3xl"></div>
              <svg
                className="relative w-80 h-80 text-white opacity-80"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Restaurantes */}
      <section className="w-full flex-1 py-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Título */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Restaurantes em Destaque</h2>
            <p className="text-lg text-gray-600">
              Confira alguns dos melhores restaurantes cadastrados em nosso sistema
            </p>
          </div>

          {/* Carregando */}
          {carregando && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m0 0h6M6 12a6 6 0 11-12 0 6 6 0 0112 0z"
                  />
                </svg>
              </div>
              <span className="ml-3 text-gray-600 font-medium">Carregando restaurantes...</span>
            </div>
          )}

          {/* Erro */}
          {erro && !carregando && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-800">{erro}</p>
              <button
                onClick={carregarRestaurantes}
                className="mt-4 text-red-600 hover:text-red-800 font-medium underline"
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
                  />
                ))}
              </div>

              {/* Ver Mais */}
              <div className="text-center">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/restaurants')}
                >
                  Ver Todos os Restaurantes
                </Button>
              </div>
            </>
          )}

          {/* Sem Restaurantes */}
          {!carregando && restaurantes.length === 0 && !erro && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-12 text-center">
              <svg className="w-16 h-16 text-blue-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4"
                />
              </svg>
              <p className="text-gray-600 text-lg">Nenhum restaurante disponível no momento</p>
            </div>
          )}
        </div>
      </section>

      {/* Seção de Features */}
      <section className="w-full bg-white py-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Por que usar ReserveAqui?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Rápido e Fácil</h3>
              <p className="text-gray-600">Reserve sua mesa em segundos com nossa plataforma intuitiva</p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmação Instantânea</h3>
              <p className="text-gray-600">Receba confirmação imediata da sua reserva por email</p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Melhor Preço</h3>
              <p className="text-gray-600">Encontre as melhores ofertas e promoções exclusivas</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
