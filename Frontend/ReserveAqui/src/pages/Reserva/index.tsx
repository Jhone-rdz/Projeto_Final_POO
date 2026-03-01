import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header, Footer } from '../../components/layout';
import { Input, Button, Alert } from '../../components/common';
import { restaurantesService, mesasService, reservasService } from '../../services/api';
import type { Restaurante, Mesa } from '../../types';
import { useAuth } from '../../context';

/**
 * Página de Realização de Reserva
 */
const Reserva = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario, isAuthenticated } = useAuth();

  // Estados
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mesasDisponibilidade, setMesasDisponibilidade] = useState<{ disponivel: boolean; mesas_necessarias: number; mensagem?: string } | null>(null);
  const [carregandoRestaurante, setCarregandoRestaurante] = useState(true);
  const [carregandoReserva, setCarregandoReserva] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSuccesso] = useState(false);

  // Formulário
  const [formData, setFormData] = useState({
    quantidadePessoas: 1,
    data: '',
    horario: '19:00',
  });

  // Carregamento inicial
  useEffect(() => {
    if (id) {
      carregarRestaurante();
    }
  }, [id]);

  // Validação de disponibilidade em tempo real
  useEffect(() => {
    if (restaurante && formData.data && formData.horario) {
      validarDisponibilidade();
    }
  }, [restaurante, formData.quantidadePessoas, formData.data, formData.horario]);

  const carregarRestaurante = async () => {
    try {
      setCarregandoRestaurante(true);
      setErro('');

      const restauranteData = await restaurantesService.obter(Number(id));
      setRestaurante(restauranteData);

      const mesasResponse = await mesasService.listar({
        restaurante: Number(id),
        ativa: true,
      });
      setMesas(mesasResponse.results || []);
    } catch (error) {
      console.error('Erro ao carregar restaurante:', error);
      setErro('Não foi possível carregar os detalhes do restaurante.');
    } finally {
      setCarregandoRestaurante(false);
    }
  };

  const validarDisponibilidade = async () => {
    try {
      // Verificar mesas disponíveis para a data e horário selecionados
      const disponibilidade = await mesasService.verificarDisponibilidade(
        Number(id),
        formData.data,
        formData.horario,
        formData.quantidadePessoas
      );

      setMesasDisponibilidade(disponibilidade);
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      setMesasDisponibilidade(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantidadePessoas' ? parseInt(value) : value,
    }));
  };

  const handleReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSuccesso(false);

    // Validações
    if (formData.quantidadePessoas < 1) {
      setErro('Informe uma quantidade válida de pessoas');
      return;
    }

    if (!formData.data) {
      setErro('Selecione uma data');
      return;
    }

    if (!mesasDisponibilidade?.disponivel) {
      setErro('Nenhuma mesa disponível para este horário');
      return;
    }

    // Validar se a data é futura
    const dataReserva = new Date(formData.data);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (dataReserva < hoje) {
      setErro('Selecione uma data futura');
      return;
    }

    try {
      setCarregandoReserva(true);

      // Criar reserva
      await reservasService.criar({
        restaurante: Number(id),
        data_reserva: formData.data,
        horario: formData.horario,
        quantidade_pessoas: formData.quantidadePessoas,
        nome_cliente: usuario?.nome || '',
        telefone_cliente: '11999999999', // TODO: Buscar do usuário
        email_cliente: usuario?.email || '',
        observacoes: '',
      });

      setSuccesso(true);

      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/reservations');
      }, 2000);
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      setErro('Erro ao processar sua reserva. Tente novamente.');
    } finally {
      setCarregandoReserva(false);
    }
  };

  // Se não estiver autenticado
  if (!isAuthenticated) {
    return (
      <div className="w-full flex flex-col min-h-screen bg-gray-50">
        <Header />

        <main className="w-full flex-1 flex items-center justify-center py-16">
          <div className="bg-white rounded-lg shadow-md p-12 max-w-md text-center">
            <svg className="w-16 h-16 text-blue-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h2>
            <p className="text-gray-600 mb-8">Você precisa estar logado para fazer uma reserva.</p>
            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Entrar
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/register')}
                className="w-full"
              >
                Cadastrar
              </Button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Carregando
  if (carregandoRestaurante) {
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
            <p className="text-gray-600 font-medium">Carregando informações do restaurante...</p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Erro ou restaurante não encontrado
  if (erro && !restaurante) {
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
            <p className="text-red-800 text-lg mb-6">{erro}</p>
            <Button variant="primary" size="md" onClick={() => navigate('/')} className="w-full">
              Voltar para Home
            </Button>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="w-full flex-1 py-16">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Título */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Fazer Reserva</h1>
            <p className="text-gray-600 mt-2">
              Complete os dados abaixo para reservar sua mesa em <span className="font-semibold">{restaurante?.nome}</span>
            </p>
          </div>

          {/* Sucesso */}
          {sucesso && (
            <Alert
              type="success"
              message="✓ Reserva realizada com sucesso! Você será redirecionado para suas reservas..."
            />
          )}

          {/* Erro */}
          {erro && (
            <Alert type="error" message={erro} onClose={() => setErro('')} />
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Formulário */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-8">
                <form onSubmit={handleReserva}>
                  {/* Dados do Usuário */}
                  <div className="mb-8 pb-8 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Seus Dados</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Nome"
                        value={usuario?.nome || ''}
                        disabled
                        className="bg-gray-50"
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={usuario?.email || ''}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* Dados da Reserva */}
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Detalhes da Reserva</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Data */}
                      <Input
                        type="date"
                        label="Data"
                        name="data"
                        value={formData.data}
                        onChange={handleInputChange}
                        required
                        disabled={carregandoReserva}
                      />

                      {/* Horário */}
                      <Input
                        type="time"
                        label="Horário"
                        name="horario"
                        value={formData.horario}
                        onChange={handleInputChange}
                        required
                        disabled={carregandoReserva}
                      />
                    </div>

                    {/* Quantidade de Pessoas */}
                    <Input
                      type="number"
                      label="Quantidade de Pessoas"
                      name="quantidadePessoas"
                      value={formData.quantidadePessoas}
                      onChange={handleInputChange}
                      min="1"
                      max="20"
                      required
                      disabled={carregandoReserva}
                    />
                  </div>

                  {/* Botão de Envio */}
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      size="md"
                      type="button"
                      onClick={() => navigate(-1)}
                      disabled={carregandoReserva}
                      className="flex-1"
                    >
                      Voltar
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      type="submit"
                      isLoading={carregandoReserva}
                      disabled={!mesasDisponibilidade?.disponivel || carregandoReserva}
                      className="flex-1"
                    >
                      {!mesasDisponibilidade?.disponivel ? 'Sem Mesas Disponíveis' : 'Confirmar Reserva'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* Resumo */}
            <div>
              {/* Resumo do Restaurante */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Resumo</h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Restaurante</p>
                    <p className="font-semibold text-gray-900">{restaurante?.nome}</p>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-600">Data Selecionada</p>
                    <p className="font-semibold text-gray-900">
                      {formData.data
                        ? new Date(formData.data).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Não selecionada'}
                    </p>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-600">Horário</p>
                    <p className="font-semibold text-gray-900">{formData.horario}</p>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-600">Quantidade de Pessoas</p>
                    <p className="font-semibold text-gray-900">{formData.quantidadePessoas}</p>
                  </div>
                </div>
              </div>

              {/* Disponibilidade */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Mesas Disponíveis</h3>

                {mesasDisponibilidade?.disponivel ? (
                  <div>
                    <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-green-800 font-semibold">✓ Mesas Disponíveis</p>
                      <p className="text-2xl font-bold text-green-600 mt-2">
                        {mesasDisponibilidade.mesas_necessarias}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">Clique em "Confirmar Reserva" para prosseguir</p>
                  </div>
                ) : (
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-orange-800 font-semibold">⚠ Sem Disponibilidade</p>
                    <p className="text-sm text-orange-700 mt-2">
                      Nenhuma mesa disponível para este horário. Tente outra data ou horário.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Reserva;
