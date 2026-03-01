import { Header, Footer } from '../../components/layout';
import { Input, Button, Alert } from '../../components/common';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { reservasService, restaurantesService } from '../../services/api';
import type { Reserva, Restaurante } from '../../types';

/**
 * Página de Reservas do Usuário - Gerenciar minhas reservas
 */
const Reservations = () => {
  const navigate = useNavigate();

  // Estado de reservas
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [restaurantesMap, setRestaurantesMap] = useState<Record<number, Restaurante>>({});
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Filtro de status
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'confirmada' | 'pendente' | 'cancelada' | 'concluida'>('todos');

  // Modal de edição
  const [modalEdicao, setModalEdicao] = useState(false);
  const [reservaEdicao, setReservaEdicao] = useState<Reserva | null>(null);
  const [formReserva, setFormReserva] = useState({
    data_reserva: '',
    horario: '',
    quantidade_pessoas: '',
  });

  // Modal de cancelamento
  const [modalCancelamento, setModalCancelamento] = useState(false);
  const [reservaCancelamento, setReservaCancelamento] = useState<Reserva | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');

  const [carregandoAcao, setCarregandoAcao] = useState(false);

  // Carregar reservas ao montar
  useEffect(() => {
    carregarReservas();
  }, []);

  // Carregar minhas reservas
  const carregarReservas = async () => {
    try {
      setCarregando(true);
      setErro('');
      const response = await reservasService.minhasReservas();
      setReservas(response.results || []);

      // Carregar dados dos restaurantes
      const restauranteIds = Array.from(
        new Set((response.results || []).map((r) => r.restaurante))
      );
      const mapa: Record<number, Restaurante> = {};

      for (const id of restauranteIds) {
        try {
          const restaurante = await restaurantesService.obter(id);
          mapa[id] = restaurante;
        } catch {
          // Ignorar erro individual
        }
      }

      setRestaurantesMap(mapa);
    } catch {
      setErro('Erro ao carregar suas reservas');
    } finally {
      setCarregando(false);
    }
  };

  // Abrir modal de edição
  const handleAbrirEdicao = (reserva: Reserva) => {
    setReservaEdicao(reserva);
    setFormReserva({
      data_reserva: reserva.data_reserva,
      horario: reserva.horario,
      quantidade_pessoas: String(reserva.quantidade_pessoas),
    });
    setModalEdicao(true);
  };

  // Salvar edição
  const handleSalvarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!reservaEdicao) return;

    if (!formReserva.data_reserva || !formReserva.horario || !formReserva.quantidade_pessoas) {
      setErro('Preencha todos os campos');
      return;
    }

    const quantidade = parseInt(formReserva.quantidade_pessoas);
    if (quantidade < 1 || quantidade > 20) {
      setErro('Quantidade deve estar entre 1 e 20 pessoas');
      return;
    }

    try {
      setCarregandoAcao(true);
      await reservasService.atualizar(reservaEdicao.id, {
        data_reserva: formReserva.data_reserva,
        horario: formReserva.horario,
        quantidade_pessoas: quantidade,
      });
      setSucesso('Reserva editada com sucesso!');
      setModalEdicao(false);
      carregarReservas();
      setTimeout(() => setSucesso(''), 3000);
    } catch {
      setErro('Erro ao editar reserva');
    } finally {
      setCarregandoAcao(false);
    }
  };

  // Abrir modal de cancelamento
  const handleAbrirCancelamento = (reserva: Reserva) => {
    setReservaCancelamento(reserva);
    setMotivoCancelamento('');
    setModalCancelamento(true);
  };

  // Confirmar cancelamento
  const handleConfirmarCancelamento = async () => {
    setErro('');
    setSucesso('');

    if (!reservaCancelamento) return;

    try {
      setCarregandoAcao(true);
      await reservasService.cancelar(reservaCancelamento.id, motivoCancelamento);
      setSucesso('Reserva cancelada com sucesso!');
      setModalCancelamento(false);
      carregarReservas();
      setTimeout(() => setSucesso(''), 3000);
    } catch {
      setErro('Erro ao cancelar reserva');
    } finally {
      setCarregandoAcao(false);
    }
  };

  // Filtrar reservas
  const reservasFiltradas =
    statusFiltro === 'todos'
      ? reservas
      : reservas.filter((r) => r.status === statusFiltro);

  // Formatar data
  const formatarData = (data: string) => {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  // Cores de status
  const corStatus = (status: string) => {
    switch (status) {
      case 'confirmada':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-blue-100 text-blue-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      case 'concluida':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Textos de status
  const textoStatus = (status: string) => {
    switch (status) {
      case 'confirmada':
        return 'Confirmada';
      case 'pendente':
        return 'Pendente';
      case 'cancelada':
        return 'Cancelada';
      case 'concluida':
        return 'Concluída';
      default:
        return status;
    }
  };

  // Obter nome do restaurante
  const obterNomeRestaurante = (restauranteId: number) => {
    return restaurantesMap[restauranteId]?.nome || 'Restaurante';
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        {/* Título */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">📅 Minhas Reservas</h1>
          <p className="text-gray-600 mt-2">Consulte e gerencie suas reservas</p>
        </div>

        {/* Alertas */}
        {erro && <Alert type="error" message={erro} onClose={() => setErro('')} />}
        {sucesso && <Alert type="success" message={sucesso} onClose={() => setSucesso('')} />}

        {/* Filtro de Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🔍 Filtrar por Status</h2>
          <div className="flex flex-wrap gap-3">
            {['todos', 'confirmada', 'pendente', 'cancelada', 'concluida'].map((status) => (
              <button
                key={status}
                onClick={() =>
                  setStatusFiltro(status as 'todos' | 'confirmada' | 'pendente' | 'cancelada' | 'concluida')
                }
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFiltro === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status === 'todos' ? '📊 Todas' : `${textoStatus(status)}`}
              </button>
            ))}
          </div>
        </div>

        {/* Carregando */}
        {carregando && (
          <div className="text-center py-24">
            <div className="inline-block">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600 font-medium">Carregando reservas...</p>
            </div>
          </div>
        )}

        {/* Lista de Reservas */}
        {!carregando && (
          <>
            {reservasFiltradas.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-600 text-lg mb-6">
                  {reservas.length === 0
                    ? '😔 Você não tem reservas ainda'
                    : `😔 Nenhuma reserva com status "${statusFiltro}"`}
                </p>
                {reservas.length === 0 && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate('/restaurants')}
                  >
                    🍽️ Explorar Restaurantes
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {reservasFiltradas.map((reserva) => (
                  <div
                    key={reserva.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start mb-6">
                      {/* Restaurante */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          🏢 Restaurante
                        </label>
                        <p className="text-lg text-gray-900 font-bold">
                          {obterNomeRestaurante(reserva.restaurante)}
                        </p>
                      </div>

                      {/* Data */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          📅 Data
                        </label>
                        <p className="text-lg text-gray-900">
                          {formatarData(reserva.data_reserva)}
                        </p>
                      </div>

                      {/* Horário */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          🕐 Horário
                        </label>
                        <p className="text-lg text-gray-900">{reserva.horario}</p>
                      </div>

                      {/* Pessoas */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          👥 Pessoas
                        </label>
                        <p className="text-lg text-gray-900">
                          {reserva.quantidade_pessoas}
                        </p>
                      </div>

                      {/* Status */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          📊 Status
                        </label>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${corStatus(
                            reserva.status
                          )}`}
                        >
                          {textoStatus(reserva.status)}
                        </span>
                      </div>
                    </div>

                    {/* Observações */}
                    {reserva.observacoes && (
                      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-gray-700">
                          <strong>📝 Observações:</strong> {reserva.observacoes}
                        </p>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex gap-3">
                      {(reserva.status === 'confirmada' || reserva.status === 'pendente') && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAbrirEdicao(reserva)}
                          >
                            ✏️ Editar
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleAbrirCancelamento(reserva)}
                          >
                            ❌ Cancelar
                          </Button>
                        </>
                      )}
                      {(reserva.status === 'cancelada' || reserva.status === 'concluida') && (
                        <span className="text-gray-500 text-sm pt-2">Sem ações disponíveis</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL: Editar Reserva */}
      {modalEdicao && reservaEdicao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">✏️ Editar Reserva</h2>

            <form onSubmit={handleSalvarReserva} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurante
                </label>
                <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded">
                  {obterNomeRestaurante(reservaEdicao.restaurante)}
                </p>
              </div>

              <Input
                type="date"
                label="Data"
                value={formReserva.data_reserva}
                onChange={(e) =>
                  setFormReserva({ ...formReserva, data_reserva: e.target.value })
                }
                disabled={carregandoAcao}
              />

              <Input
                type="time"
                label="Horário"
                value={formReserva.horario}
                onChange={(e) =>
                  setFormReserva({ ...formReserva, horario: e.target.value })
                }
                disabled={carregandoAcao}
              />

              <Input
                type="number"
                label="Quantidade de Pessoas"
                min="1"
                max="20"
                value={formReserva.quantidade_pessoas}
                onChange={(e) =>
                  setFormReserva({ ...formReserva, quantidade_pessoas: e.target.value })
                }
                disabled={carregandoAcao}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={() => setModalEdicao(false)}
                  disabled={carregandoAcao}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  isLoading={carregandoAcao}
                  type="submit"
                >
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirmar Cancelamento */}
      {modalCancelamento && reservaCancelamento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">⚠️ Cancelar Reserva</h2>
            <p className="text-gray-600 mb-6 text-sm">
              Tem certeza que deseja cancelar a reserva em{' '}
              <strong>{obterNomeRestaurante(reservaCancelamento.restaurante)}</strong> para{' '}
              <strong>{formatarData(reservaCancelamento.data_reserva)}</strong> às{' '}
              <strong>{reservaCancelamento.horario}</strong>?
            </p>

            <Input
              label="Motivo do Cancelamento (opcional)"
              placeholder="Ex: Compromisso imprevisto"
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
              disabled={carregandoAcao}
            />

            <div className="flex gap-3 pt-6">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setModalCancelamento(false)}
                disabled={carregandoAcao}
              >
                Manter Reserva
              </Button>
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                isLoading={carregandoAcao}
                onClick={handleConfirmarCancelamento}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Reservations;
