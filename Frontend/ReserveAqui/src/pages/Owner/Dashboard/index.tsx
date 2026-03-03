import { Header, Footer } from '../../../components/layout';
import { Button, Alert, Input } from '../../../components/common';
import { useAuth } from '../../../context';
import { useEffect, useState, useCallback } from 'react';
import { mesasService, reservasService, restaurantesService } from '../../../services/api';
import type { Mesa, Reserva, Restaurante } from '../../../types';import { Link } from 'react-router-dom';

const extrairRestaurantes = (response: unknown): Restaurante[] => {
  if (Array.isArray(response)) return response;
  if (
    response &&
    typeof response === 'object' &&
    'results' in response &&
    Array.isArray((response as { results: Restaurante[] }).results)
  ) {
    return (response as { results: Restaurante[] }).results;
  }
  return [];
};

const extrairLista = <T,>(response: unknown): T[] => {
  if (Array.isArray(response)) return response;
  if (
    response &&
    typeof response === 'object' &&
    'results' in response &&
    Array.isArray((response as { results: T[] }).results)
  ) {
    return (response as { results: T[] }).results;
  }
  return [];
};

/**
 * Dashboard do Proprietário - Gestão completa do restaurante
 */
const OwnerDashboard = () => {
  const { usuario } = useAuth();

  // Estado de restaurante
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [carregandoRestaurante, setCarregandoRestaurante] = useState(false);

  // Estado de mesas
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [carregandoMesas, setCarregandoMesas] = useState(false);

  // Estado de reservas
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [carregandoReservas, setCarregandoReservas] = useState(false);

  // Filtros
  const [filtroReservas, setFiltroReservas] = useState<'todas' | 'pendente' | 'confirmada' | 'hoje'>('todas');

  // Feedback
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregandoAcao, setCarregandoAcao] = useState(false);

  // Modal de adicionar mesa
  const [modalAdicionarMesa, setModalAdicionarMesa] = useState(false);
  const [numeroNovaMesa, setNumeroNovaMesa] = useState('');

  // Modal de confirmação de remoção
  const [modalRemoverMesa, setModalRemoverMesa] = useState(false);
  const [mesaParaRemover, setMesaParaRemover] = useState<Mesa | null>(null);

  // Modal de confirmação de ação em reserva
  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [acaoConfirmacao, setAcaoConfirmacao] = useState<{
    tipo: 'confirmar' | 'cancelar';
    reserva: Reserva | null;
  }>({ tipo: 'confirmar', reserva: null });

  // Carregar dados ao montar
  useEffect(() => {
    carregarDados();
  }, []);

  // Carregar todos os dados
  const carregarDados = async () => {
    await Promise.all([carregarRestaurante(), carregarMesas(), carregarReservas()]);
  };

  // Carregar restaurante do proprietário
  const carregarRestaurante = async () => {
    try {
      setCarregandoRestaurante(true);
      const response = await restaurantesService.meusRestaurantes();
      const restaurantes = extrairRestaurantes(response);
      if (restaurantes.length > 0) setRestaurante(restaurantes[0]);
      else setRestaurante(null);
    } catch {
      setErro('Erro ao carregar informações do restaurante');
    } finally {
      setCarregandoRestaurante(false);
    }
  };

  // Carregar mesas do restaurante
  const carregarMesas = useCallback(async () => {
    try {
      setCarregandoMesas(true);
      const response = await restaurantesService.meusRestaurantes();
      const restaurantes = extrairRestaurantes(response);
      if (restaurantes.length > 0) {
        const restauranteId = restaurantes[0].id;
        const mesasResponse = await mesasService.listar({ restaurante: restauranteId });
        setMesas(extrairLista<Mesa>(mesasResponse));
      } else {
        setMesas([]);
      }
    } catch {
      setErro('Erro ao carregar mesas');
    } finally {
      setCarregandoMesas(false);
    }
  }, []);

  // Carregar reservas do restaurante
  const carregarReservas = useCallback(async () => {
    try {
      setCarregandoReservas(true);
      const response = await restaurantesService.meusRestaurantes();
      const restaurantes = extrairRestaurantes(response);
      if (restaurantes.length > 0) {
        const restauranteId = restaurantes[0].id;
        
        let reservasResponse;
        if (filtroReservas === 'hoje') {
          reservasResponse = await reservasService.reservasHoje(restauranteId);
          setReservas(reservasResponse);
        } else {
          const params: { restaurante: number; status?: string } = { restaurante: restauranteId };
          if (filtroReservas !== 'todas') {
            params.status = filtroReservas;
          }
          reservasResponse = await reservasService.listar(params);
          setReservas(extrairLista<Reserva>(reservasResponse));
        }
      } else {
        setReservas([]);
      }
    } catch {
      setErro('Erro ao carregar reservas');
    } finally {
      setCarregandoReservas(false);
    }
  }, [filtroReservas]);

  // Atualizar reservas quando filtro muda
  useEffect(() => {
    if (restaurante) {
      carregarReservas();
    }
  }, [filtroReservas, restaurante, carregarReservas]);

  // Adicionar nova mesa
  const handleAdicionarMesa = async () => {
    setErro('');
    setSucesso('');

    if (!numeroNovaMesa || isNaN(Number(numeroNovaMesa))) {
      setErro('Digite um número válido para a mesa');
      return;
    }

    if (!restaurante) {
      setErro('Restaurante não encontrado');
      return;
    }

    // Verificar se o número já existe
    if (mesas.some(m => m.numero === Number(numeroNovaMesa))) {
      setErro('Já existe uma mesa com este número');
      return;
    }

    try {
      setCarregandoAcao(true);
      await mesasService.criar({
        restaurante: restaurante.id,
        numero: Number(numeroNovaMesa),
      });
      setSucesso(`Mesa ${numeroNovaMesa} adicionada com sucesso!`);
      setModalAdicionarMesa(false);
      setNumeroNovaMesa('');
      carregarMesas();
      setTimeout(() => setSucesso(''), 3000);
    } catch {
      setErro('Erro ao adicionar mesa');
    } finally {
      setCarregandoAcao(false);
    }
  };

  // Abrir modal para remover mesa
  const handleAbrirRemoverMesa = (mesa: Mesa) => {
    setMesaParaRemover(mesa);
    setModalRemoverMesa(true);
  };

  // Remover mesa
  const handleRemoverMesa = async () => {
    setErro('');
    setSucesso('');

    if (!mesaParaRemover) return;

    try {
      setCarregandoAcao(true);
      await mesasService.deletar(mesaParaRemover.id);
      setSucesso(`Mesa ${mesaParaRemover.numero} removida com sucesso!`);
      setModalRemoverMesa(false);
      setMesaParaRemover(null);
      carregarMesas();
      setTimeout(() => setSucesso(''), 3000);
    } catch {
      setErro('Erro ao remover mesa. Verifique se não há reservas ativas para esta mesa.');
    } finally {
      setCarregandoAcao(false);
    }
  };

  // Alterar status da mesa
  const handleAlterarStatusMesa = async (mesa: Mesa) => {
    setErro('');
    setSucesso('');

    const novoStatus: 'disponivel' | 'ocupada' =
      mesa.status === 'disponivel' ? 'ocupada' : 'disponivel';

    try {
      setCarregandoAcao(true);
      await mesasService.atualizar(mesa.id, { status: novoStatus });
      setSucesso(`Mesa ${mesa.numero} marcada como ${novoStatus === 'disponivel' ? 'disponível' : 'ocupada'}`);
      carregarMesas();
      setTimeout(() => setSucesso(''), 3000);
    } catch {
      setErro('Erro ao alterar status da mesa');
    } finally {
      setCarregandoAcao(false);
    }
  };

  // Abrir modal de confirmação de ação em reserva
  const handleAbrirConfirmacao = (tipo: 'confirmar' | 'cancelar', reserva: Reserva) => {
    setAcaoConfirmacao({ tipo, reserva });
    setModalConfirmacao(true);
  };

  // Confirmar reserva
  const handleConfirmarReserva = async () => {
    setErro('');
    setSucesso('');

    if (!acaoConfirmacao.reserva) return;

    try {
      setCarregandoAcao(true);
      await reservasService.confirmar(acaoConfirmacao.reserva.id);
      setSucesso('Reserva confirmada com sucesso!');
      setModalConfirmacao(false);
      carregarReservas();
      setTimeout(() => setSucesso(''), 3000);
    } catch {
      setErro('Erro ao confirmar reserva');
    } finally {
      setCarregandoAcao(false);
    }
  };

  // Cancelar reserva
  const handleCancelarReserva = async () => {
    setErro('');
    setSucesso('');

    if (!acaoConfirmacao.reserva) return;

    try {
      setCarregandoAcao(true);
      await reservasService.cancelar(acaoConfirmacao.reserva.id, 'Cancelada pelo proprietário');
      setSucesso('Reserva cancelada com sucesso!');
      setModalConfirmacao(false);
      carregarReservas();
      setTimeout(() => setSucesso(''), 3000);
    } catch {
      setErro('Erro ao cancelar reserva');
    } finally {
      setCarregandoAcao(false);
    }
  };

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
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      case 'concluida':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Texto de status
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            🏪 Dashboard do Proprietário
          </h1>
          <p className="text-gray-600 mt-2">
            Bem-vindo, <strong>{usuario?.nome}</strong>
          </p>
          {restaurante && (
            <p className="text-gray-700 mt-1">
              🏢 Restaurante: <strong>{restaurante.nome}</strong>
            </p>
          )}
        </div>

        {/* Alertas */}
        {erro && <Alert type="error" message={erro} onClose={() => setErro('')} />}
        {sucesso && <Alert type="success" message={sucesso} onClose={() => setSucesso('')} />}

        {/* Links Rápidos */}
        {!carregandoRestaurante && restaurante && (
          <div className="mb-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg mb-1">🎯 Acesso Rápido</h3>
                <p className="text-blue-100 text-sm">
                  Gerencie informações, funcionários e visualize relatórios
                </p>
              </div>
              <Link to="/owner/restaurant">
                <Button variant="secondary" size="md">
                  ⚙️ Gerenciar Restaurante
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Loading geral */}
        {carregandoRestaurante && (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Carregando...</p>
            </div>
          </div>
        )}

        {/* Conteúdo principal */}
        {!carregandoRestaurante && restaurante && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SEÇÃO: GESTÃO DE MESAS */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">🍽️ Gestão de Mesas</h2>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setModalAdicionarMesa(true)}
                  >
                    ➕ Adicionar
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={carregarMesas}
                    disabled={carregandoMesas}
                  >
                    🔄
                  </Button>
                </div>
              </div>

              {carregandoMesas ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Carregando mesas...</p>
                </div>
              ) : mesas.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">Nenhuma mesa cadastrada</p>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setModalAdicionarMesa(true)}
                  >
                    ➕ Adicionar primeira mesa
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {mesas.map((mesa) => (
                    <div
                      key={mesa.id}
                      className={`
                        relative p-6 rounded-lg border-2 transition-all
                        ${
                          mesa.status === 'disponivel'
                            ? 'border-green-400 bg-green-50'
                            : 'border-red-400 bg-red-50'
                        }
                      `}
                    >
                      {/* Botão de remover */}
                      <button
                        onClick={() => handleAbrirRemoverMesa(mesa)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold flex items-center justify-center transition-colors"
                        title="Remover mesa"
                      >
                        ✕
                      </button>

                      <div className="text-center mt-2">
                        <p className="text-3xl mb-2">
                          {mesa.status === 'disponivel' ? '✅' : '🔴'}
                        </p>
                        <p className="font-bold text-lg text-gray-900">
                          Mesa {mesa.numero}
                        </p>
                        <p
                          className={`text-sm mt-1 font-medium ${
                            mesa.status === 'disponivel'
                              ? 'text-green-700'
                              : 'text-red-700'
                          }`}
                        >
                          {mesa.status === 'disponivel' ? 'Disponível' : 'Ocupada'}
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                          👥 {mesa.capacidade} pessoas
                        </p>

                        {/* Botão alterar status */}
                        <button
                          onClick={() => handleAlterarStatusMesa(mesa)}
                          className={`mt-3 w-full px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            mesa.status === 'disponivel'
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          {mesa.status === 'disponivel' ? '→ Ocupar' : '→ Liberar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Legenda */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  💡 <strong>Clique no botão</strong> para alterar o status da mesa
                </p>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-green-400 rounded"></span>
                    <span className="text-gray-700">Disponível</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-red-400 rounded"></span>
                    <span className="text-gray-700">Ocupada</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO: ESTATÍSTICAS RÁPIDAS */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Estatísticas</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <p className="text-blue-600 text-sm font-semibold mb-1">Total de Mesas</p>
                  <p className="text-3xl font-bold text-blue-900">{mesas.length}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <p className="text-green-600 text-sm font-semibold mb-1">Disponíveis</p>
                  <p className="text-3xl font-bold text-green-900">
                    {mesas.filter((m) => m.status === 'disponivel').length}
                  </p>
                </div>

                <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                  <p className="text-red-600 text-sm font-semibold mb-1">Ocupadas</p>
                  <p className="text-3xl font-bold text-red-900">
                    {mesas.filter((m) => m.status === 'ocupada').length}
                  </p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                  <p className="text-yellow-600 text-sm font-semibold mb-1">Reservas Hoje</p>
                  <p className="text-3xl font-bold text-yellow-900">
                    {reservas.filter((r) => r.data_reserva === new Date().toISOString().split('T')[0]).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO: GESTÃO DE RESERVAS */}
        {!carregandoRestaurante && restaurante && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">📆 Gestão de Reservas</h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={carregarReservas}
                disabled={carregandoReservas}
              >
                🔄 Atualizar
              </Button>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-3 mb-6">
              {['todas', 'hoje', 'pendente', 'confirmada'].map((filtro) => (
                <button
                  key={filtro}
                  onClick={() =>
                    setFiltroReservas(filtro as 'todas' | 'pendente' | 'confirmada' | 'hoje')
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filtroReservas === filtro
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {filtro === 'todas' && '📊 Todas'}
                  {filtro === 'hoje' && '📅 Hoje'}
                  {filtro === 'pendente' && '⏳ Pendentes'}
                  {filtro === 'confirmada' && '✅ Confirmadas'}
                </button>
              ))}
            </div>

            {/* Lista de Reservas */}
            {carregandoReservas ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Carregando reservas...</p>
              </div>
            ) : reservas.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Nenhuma reserva encontrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reservas.map((reserva) => (
                  <div
                    key={reserva.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                      {/* Cliente */}
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600 font-semibold">👤 Cliente</p>
                        <p className="text-lg text-gray-900 font-bold">
                          {reserva.nome_cliente}
                        </p>
                        <p className="text-sm text-gray-600">{reserva.telefone_cliente}</p>
                      </div>

                      {/* Data/Hora */}
                      <div>
                        <p className="text-sm text-gray-600 font-semibold">📅 Data</p>
                        <p className="text-gray-900">{formatarData(reserva.data_reserva)}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 font-semibold">🕐 Horário</p>
                        <p className="text-gray-900">{reserva.horario}</p>
                      </div>

                      {/* Pessoas */}
                      <div>
                        <p className="text-sm text-gray-600 font-semibold">👥 Pessoas</p>
                        <p className="text-gray-900">{reserva.quantidade_pessoas}</p>
                      </div>

                      {/* Status */}
                      <div>
                        <p className="text-sm text-gray-600 font-semibold mb-1">📊 Status</p>
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
                      <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm text-gray-700">
                          <strong>📝 Obs:</strong> {reserva.observacoes}
                        </p>
                      </div>
                    )}

                    {/* Ações */}
                    {(reserva.status === 'pendente' || reserva.status === 'confirmada') && (
                      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                        {reserva.status === 'pendente' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAbrirConfirmacao('confirmar', reserva)}
                          >
                            ✅ Confirmar
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleAbrirConfirmacao('cancelar', reserva)}
                        >
                          ❌ Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sem restaurante */}
        {!carregandoRestaurante && !restaurante && (
          <div className="text-center py-24">
            <p className="text-gray-600 text-lg mb-4">
              😔 Você não é proprietário de nenhum restaurante
            </p>
            <p className="text-gray-500">
              Entre em contato com o administrador do sistema
            </p>
          </div>
        )}
      </main>

      {/* MODAL: Adicionar Mesa */}
      {modalAdicionarMesa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">➕ Adicionar Mesa</h2>

            <p className="text-gray-600 mb-6">
              Digite o número da nova mesa que deseja adicionar ao restaurante.
            </p>

            <div className="mb-6">
              <Input
                type="number"
                label="Número da Mesa"
                value={numeroNovaMesa}
                onChange={(e) => setNumeroNovaMesa(e.target.value)}
                placeholder="Ex: 10"
                min="1"
                autoFocus
              />
              <p className="text-sm text-gray-500 mt-2">
                💡 A mesa será criada com capacidade de 4 pessoas e status disponível
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => {
                  setModalAdicionarMesa(false);
                  setNumeroNovaMesa('');
                }}
                disabled={carregandoAcao}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                isLoading={carregandoAcao}
                onClick={handleAdicionarMesa}
              >
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Remover Mesa */}
      {modalRemoverMesa && mesaParaRemover && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🗑️ Remover Mesa</h2>

            <p className="text-gray-600 mb-6">
              Tem certeza que deseja remover a <strong>Mesa {mesaParaRemover.numero}</strong>?
            </p>

            <div className="bg-yellow-50 rounded-lg p-4 mb-6 border border-yellow-200">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Atenção:</strong> Esta ação não poderá ser desfeita. Certifique-se de que não há reservas ativas para esta mesa.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => {
                  setModalRemoverMesa(false);
                  setMesaParaRemover(null);
                }}
                disabled={carregandoAcao}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                isLoading={carregandoAcao}
                onClick={handleRemoverMesa}
              >
                Remover
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirmação de Ação em Reserva */}
      {modalConfirmacao && acaoConfirmacao.reserva && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {acaoConfirmacao.tipo === 'confirmar' ? '✅ Confirmar Reserva' : '❌ Cancelar Reserva'}
            </h2>

            <p className="text-gray-600 mb-6">
              {acaoConfirmacao.tipo === 'confirmar'
                ? 'Tem certeza que deseja confirmar esta reserva?'
                : 'Tem certeza que deseja cancelar esta reserva?'}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <strong>Cliente:</strong> {acaoConfirmacao.reserva.nome_cliente}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Data:</strong> {formatarData(acaoConfirmacao.reserva.data_reserva)}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Horário:</strong> {acaoConfirmacao.reserva.horario}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Pessoas:</strong> {acaoConfirmacao.reserva.quantidade_pessoas}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setModalConfirmacao(false)}
                disabled={carregandoAcao}
              >
                Cancelar
              </Button>
              <Button
                variant={acaoConfirmacao.tipo === 'confirmar' ? 'primary' : 'danger'}
                size="md"
                className="flex-1"
                isLoading={carregandoAcao}
                onClick={
                  acaoConfirmacao.tipo === 'confirmar'
                    ? handleConfirmarReserva
                    : handleCancelarReserva
                }
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

export default OwnerDashboard;
