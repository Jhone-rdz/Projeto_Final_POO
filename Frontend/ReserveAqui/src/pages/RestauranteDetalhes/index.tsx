import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header, Footer } from '../../components/layout';
import { Button, Alert } from '../../components/common';
import { restaurantesService, mesasService } from '../../services/api';
import type { Restaurante, Mesa } from '../../types';
import { useAuth } from '../../context';

/**
 * Página de Detalhes do Restaurante
 */
const RestauranteDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (id) {
      carregarDetalhes();
    }
  }, [id]);

  const carregarDetalhes = async () => {
    try {
      setCarregando(true);
      setErro('');

      // Carregar restaurante
      const restauranteData = await restaurantesService.obter(Number(id));
      setRestaurante(restauranteData);

      // Carregar mesas
      const mesasResponse = await mesasService.listar({
        restaurante: Number(id),
      });
      setMesas(mesasResponse.results || []);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      setErro('Não foi possível carregar os detalhes do restaurante. Tente novamente mais tarde.');
    } finally {
      setCarregando(false);
    }
  };

  const contarMesasDisponiveis = () => {
    return mesas.filter((mesa) => mesa.status === 'disponivel').length;
  };

  const handleFazerReserva = () => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: { returnTo: `/restaurantes/${id}` },
      });
    } else {
      navigate(`/reserva/${id}`);
    }
  };

  // Carregando
  if (carregando) {
    return (
      <div className="w-full flex flex-col min-h-screen bg-gray-50">
        <Header />

        <main className="w-full flex-1 flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
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
            <p className="text-gray-600 font-medium">Carregando detalhes do restaurante...</p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Erro ou restaurante não encontrado
  if (erro || !restaurante) {
    return (
      <div className="w-full flex flex-col min-h-screen bg-gray-50">
        <Header />

        <main className="w-full flex-1 flex items-center justify-center py-16">
          <div className="bg-red-50 border border-red-200 rounded-lg p-12 max-w-md text-center">
            <svg className="w-16 h-16 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-800 text-lg mb-6">{erro || 'Restaurante não encontrado'}</p>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Voltar para Home
            </Button>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const mesasDisponiveis = contarMesasDisponiveis();
  const totalMesas = mesas.length;

  return (
    <div className="w-full flex flex-col min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="w-full relative h-80 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        {/* Conteúdo */}
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center gap-8">
          {/* Imagem */}
          <div className="hidden md:flex md:w-1/3 justify-center">
            <div className="w-64 h-64 bg-white rounded-lg shadow-lg flex items-center justify-center overflow-hidden">
              <svg className="w-32 h-32 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
              </svg>
            </div>
          </div>

          {/* Informações */}
          <div className="flex-1">
            <h1 className="text-5xl font-bold mb-4">{restaurante.nome}</h1>
            <p className="text-xl text-blue-100 mb-4">{restaurante.descricao}</p>

            {/* Localização */}
            <div className="flex items-start gap-3 text-blue-100">
              <svg className="w-6 h-6 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">{restaurante.endereco}</p>
                <p>{restaurante.cidade}, {restaurante.estado} - CEP: {restaurante.cep}</p>
              </div>
            </div>

            {/* Contato */}
            <div className="mt-6 flex gap-6">
              <a href={`tel:${restaurante.telefone}`} className="flex items-center gap-2 hover:text-blue-200 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.26.559.738 1.272 1.469 2.002.73.73 1.443 1.209 2.002 1.469l.773-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 4 14.18 4 9.5V5a1 1 0 01-1-1H3z" />
                </svg>
                <span>{restaurante.telefone}</span>
              </a>
              <a href={`mailto:${restaurante.email}`} className="flex items-center gap-2 hover:text-blue-200 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Disponibilidade */}
      <section className="w-full flex-1 py-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Título */}
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Disponibilidade de Mesas</h2>
            <p className="text-lg text-gray-600">Confira a quantidade de mesas disponíveis e reserve agora</p>
          </div>

          {/* Cards de Disponibilidade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Card: Total de Mesas */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Total de Mesas</h3>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a1 1 0 011-1h14a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V6zM4 4a2 2 0 100-4 2 2 0 000 4zM14 4a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-gray-900">{totalMesas}</p>
            </div>

            {/* Card: Mesas Disponíveis */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Disponíveis Agora</h3>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-green-600">{mesasDisponiveis}</p>
            </div>

            {/* Card: Mesas Ocupadas */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Ocupadas</h3>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 2.526a6 6 0 008.367 8.367A6 6 0 0113.477 14.89z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-red-600">{totalMesas - mesasDisponiveis}</p>
            </div>
          </div>

          {/* Status e Botão de Reserva */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Status */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pronto para Reservar?</h3>
                {mesasDisponiveis > 0 ? (
                  <p className="text-lg text-green-600 font-medium">✓ Temos mesas disponíveis!</p>
                ) : (
                  <p className="text-lg text-orange-600 font-medium">⚠ Nenhuma mesa disponível no momento</p>
                )}
              </div>

              {/* Botão */}
              <Button
                variant={mesasDisponiveis > 0 ? 'primary' : 'secondary'}
                size="md"
                onClick={handleFazerReserva}
                disabled={mesasDisponiveis === 0}
              >
                {isAuthenticated ? 'Fazer Reserva' : 'Fazer Login para Reservar'}
              </Button>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Capacidade das Mesas */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Capacidade das Mesas</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">4</span>
                </div>
                <div>
                  <p className="text-gray-600">Cada mesa acomoda</p>
                  <p className="text-2xl font-bold text-gray-900">4 pessoas</p>
                </div>
              </div>
            </div>

            {/* Próximos Passos */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Próximos Passos</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Escolha a data e horário da sua reserva</li>
                <li>Selecione a quantidade de pessoas</li>
                <li>Confirme sua reserva</li>
                <li>Receba confirmação por email</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RestauranteDetalhes;
