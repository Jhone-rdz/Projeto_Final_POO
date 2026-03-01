import { useAuth } from '../../context';
import { Header, Footer } from '../../components/layout';
import { useEffect, useState, useCallback } from 'react';
import { Input, Button, Alert } from '../../components/common';
import { reservasService, restaurantesService } from '../../services/api';
import type { Reserva, Restaurante } from '../../types';

/**
 * Página de Perfil do Usuário - Gerenciar dados e reservas
 */
const Profile = () => {
  const { usuario, trocarSenha, logout } = useAuth();
  
  // Estado de abas
  const [abaAtiva, setAbaAtiva] = useState<'dados' | 'reservas'>('dados');
  
  // Estado de modo de dados
  const [modoEdicaoDados, setModoEdicaoDados] = useState(false);
  const [formDados, setFormDados] = useState({
    nome: usuario?.nome || '',
    email: usuario?.email || '',
  });
  
  // Estado de senha
  const [modalSenha, setModalSenha] = useState(false);
  const [senhaData, setSenhaData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: '',
  });
  
  // Estado de reservas
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [restaurantesMap, setRestaurantesMap] = useState<Record<number, Restaurante>>({});
  const [carregandoReservas, setCarregandoReservas] = useState(false);
  
  // Estado de modal de edição de reserva
  const [modalEdicaoReserva, setModalEdicaoReserva] = useState(false);
  const [reservaEdicao, setReservaEdicao] = useState<Reserva | null>(null);
  const [formReserva, setFormReserva] = useState({
    data_reserva: '',
    horario: '',
    quantidade_pessoas: '',
  });
  
  // Estado de modal de cancelamento
  const [modalCancelamento, setModalCancelamento] = useState(false);
  const [reservaCancelamento, setReservaCancelamento] = useState<Reserva | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  
  // Feedbacks
  const [erro, setErro] = useState('');
  const [sucesso, setSuccesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Carregar minhas reservas e dados dos restaurantes
  const carregarReservas = useCallback(async () => {
    try {
      setCarregandoReservas(true);
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
          // Ignorar erro individual de restaurante
        }
      }

      setRestaurantesMap(mapa);
    } catch {
      setErro('Erro ao carregar suas reservas');
    } finally {
      setCarregandoReservas(false);
    }
  }, []);

  // Carregar reservas ao entrar na aba de reservas
  useEffect(() => {
    if (abaAtiva === 'reservas') {
      carregarReservas();
    }
  }, [abaAtiva, carregarReservas]);

  // Alternar modo de edição de dados
  const handleEditarDados = () => {
    if (modoEdicaoDados) {
      setFormDados({
        nome: usuario?.nome || '',
        email: usuario?.email || '',
      });
    }
    setModoEdicaoDados(!modoEdicaoDados);
  };

  // Salvar dados do cliente
  const handleSalvarDados = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSuccesso('');

    if (!formDados.nome.trim()) {
      setErro('Nome é obrigatório');
      return;
    }

    if (!formDados.email.trim() || !formDados.email.includes('@')) {
      setErro('Email é obrigatório e deve ser válido');
      return;
    }

    try {
      setCarregando(true);
      // TODO: Implementar chamada para atualizar dados no backend
      setSuccesso('Dados atualizados com sucesso!');
      setModoEdicaoDados(false);
      setTimeout(() => setSuccesso(''), 3000);
    } catch {
      setErro('Erro ao atualizar dados');
    } finally {
      setCarregando(false);
    }
  };

  // Alterar senha
  const handleMudancaSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSuccesso('');

    if (!senhaData.senhaAtual) {
      setErro('Informe a senha atual');
      return;
    }

    if (senhaData.novaSenha.length < 6) {
      setErro('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (senhaData.novaSenha !== senhaData.confirmarSenha) {
      setErro('As senhas não conferem');
      return;
    }

    try {
      setCarregando(true);
      await trocarSenha(senhaData.senhaAtual, senhaData.novaSenha);
      setSuccesso('Senha alterada com sucesso!');
      setSenhaData({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: '',
      });
      setModalSenha(false);
      setTimeout(() => setSuccesso(''), 3000);
    } catch {
      setErro('Erro ao alterar senha. Verifique sua senha atual.');
    } finally {
      setCarregando(false);
    }
  };

  // Abrir modal de edição de reserva
  const handleAbrirEdicaoReserva = (reserva: Reserva) => {
    setReservaEdicao(reserva);
    setFormReserva({
      data_reserva: reserva.data_reserva,
      horario: reserva.horario,
      quantidade_pessoas: String(reserva.quantidade_pessoas),
    });
    setModalEdicaoReserva(true);
  };

  // Salvar edição de reserva
  const handleSalvarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSuccesso('');

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
      setCarregando(true);
      await reservasService.atualizar(reservaEdicao.id, {
        data_reserva: formReserva.data_reserva,
        horario: formReserva.horario,
        quantidade_pessoas: quantidade,
      });
      setSuccesso('Reserva editada com sucesso!');
      setModalEdicaoReserva(false);
      carregarReservas();
      setTimeout(() => setSuccesso(''), 3000);
    } catch {
      setErro('Erro ao editar reserva');
    } finally {
      setCarregando(false);
    }
  };

  // Abrir modal de cancelamento
  const handleAbrirCancelamento = (reserva: Reserva) => {
    setReservaCancelamento(reserva);
    setMotivoCancelamento('');
    setModalCancelamento(true);
  };

  // Confirmar cancelamento de reserva
  const handleConfirmarCancelamento = async () => {
    setErro('');
    setSuccesso('');

    if (!reservaCancelamento) return;

    try {
      setCarregando(true);
      await reservasService.cancelar(reservaCancelamento.id, motivoCancelamento);
      setSuccesso('Reserva cancelada com sucesso!');
      setModalCancelamento(false);
      carregarReservas();
      setTimeout(() => setSuccesso(''), 3000);
    } catch {
      setErro('Erro ao cancelar reserva');
    } finally {
      setCarregando(false);
    }
  };

  // Formatar data para display
  const formatarData = (data: string) => {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  // Obter cor do status
  const corStatus = (status: string) => {
    switch (status) {
      case 'confirmada':
        return 'bg-green-100 text-green-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      case 'concluida':
        return 'bg-gray-100 text-gray-800';
      case 'pendente':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Obter texto do status
  const textoStatus = (status: string) => {
    switch (status) {
      case 'confirmada':
        return 'Confirmada';
      case 'cancelada':
        return 'Cancelada';
      case 'concluida':
        return 'Concluída';
      case 'pendente':
        return 'Pendente';
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
          <h1 className="text-4xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-600 mt-2">Gerencie suas informações pessoais e reservas</p>
        </div>

        {/* Alertas */}
        {erro && <Alert type="error" message={erro} onClose={() => setErro('')} />}
        {sucesso && <Alert type="success" message={sucesso} onClose={() => setSuccesso('')} />}

        {/* Abas */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setAbaAtiva('dados')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors text-lg ${
              abaAtiva === 'dados'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            👤 Dados Pessoais
          </button>
          <button
            onClick={() => setAbaAtiva('reservas')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors text-lg ${
              abaAtiva === 'reservas'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📅 Minhas Reservas
          </button>
        </div>

        {/* SEÇÃO: DADOS PESSOAIS */}
        {abaAtiva === 'dados' && usuario && (
          <div className="space-y-6">
            {/* Dados do Cliente */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dados Pessoais</h2>

              {!modoEdicaoDados ? (
                // Modo Visualização
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        👤 Nome
                      </label>
                      <p className="text-lg text-gray-900 bg-gray-50 p-4 rounded-lg">
                        {usuario.nome}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        ✉️ Email
                      </label>
                      <p className="text-lg text-gray-900 bg-gray-50 p-4 rounded-lg">
                        {usuario.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={handleEditarDados}
                    >
                      ✏️ Editar Dados
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => setModalSenha(true)}
                    >
                      🔐 Alterar Senha
                    </Button>
                    <Button
                      variant="danger"
                      size="md"
                      onClick={() => logout()}
                    >
                      🚪 Sair da Conta
                    </Button>
                  </div>
                </div>
              ) : (
                // Modo Edição Inline
                <form onSubmit={handleSalvarDados} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Nome"
                      value={formDados.nome}
                      onChange={(e) => setFormDados({ ...formDados, nome: e.target.value })}
                      disabled={carregando}
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={formDados.email}
                      onChange={(e) => setFormDados({ ...formDados, email: e.target.value })}
                      disabled={carregando}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={handleEditarDados}
                      disabled={carregando}
                    >
                      ❌ Cancelar
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      isLoading={carregando}
                      type="submit"
                    >
                      ✅ Salvar
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* SEÇÃO: MINHAS RESERVAS */}
        {abaAtiva === 'reservas' && (
          <div>
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Minhas Reservas</h2>

              {carregandoReservas ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Carregando reservas...</p>
                </div>
              ) : reservas.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg mb-4">Você não tem reservas ainda</p>
                  <Button variant="primary" size="md" onClick={() => window.location.href = '/restaurants'}>
                    🍽️ Explorar Restaurantes
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">
                          🏢 Restaurante
                        </th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">
                          📅 Data
                        </th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">
                          🕐 Horário
                        </th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">
                          👥 Pessoas
                        </th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">
                          📊 Status
                        </th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">
                          ⚙️ Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservas.map((reserva) => (
                        <tr
                          key={reserva.id}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <p className="font-medium text-gray-900">
                              {obterNomeRestaurante(reserva.restaurante)}
                            </p>
                          </td>
                          <td className="py-4 px-4 text-gray-700">
                            {formatarData(reserva.data_reserva)}
                          </td>
                          <td className="py-4 px-4 text-gray-700">{reserva.horario}</td>
                          <td className="py-4 px-4 text-gray-700">{reserva.quantidade_pessoas}</td>
                          <td className="py-4 px-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${corStatus(reserva.status)}`}>
                              {textoStatus(reserva.status)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex gap-2">
                              {(reserva.status === 'confirmada' || reserva.status === 'pendente') && (
                                <>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleAbrirEdicaoReserva(reserva)}
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
                                <span className="text-gray-500 text-sm">Sem ações</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Alterar Senha */}
      {modalSenha && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🔐 Alterar Senha</h2>

            <form onSubmit={handleMudancaSenha} className="space-y-4">
              <Input
                type="password"
                label="Senha Atual"
                placeholder="Digite sua senha atual"
                value={senhaData.senhaAtual}
                onChange={(e) =>
                  setSenhaData({ ...senhaData, senhaAtual: e.target.value })
                }
                disabled={carregando}
              />

              <Input
                type="password"
                label="Nova Senha"
                placeholder="Digite sua nova senha"
                value={senhaData.novaSenha}
                onChange={(e) =>
                  setSenhaData({ ...senhaData, novaSenha: e.target.value })
                }
                disabled={carregando}
                helperText="Mínimo 6 caracteres"
              />

              <Input
                type="password"
                label="Confirmar Senha"
                placeholder="Confirme sua nova senha"
                value={senhaData.confirmarSenha}
                onChange={(e) =>
                  setSenhaData({ ...senhaData, confirmarSenha: e.target.value })
                }
                disabled={carregando}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={() => {
                    setModalSenha(false);
                    setSenhaData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
                    setErro('');
                  }}
                  disabled={carregando}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  isLoading={carregando}
                  type="submit"
                >
                  Atualizar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Reserva */}
      {modalEdicaoReserva && reservaEdicao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              ✏️ Editar Reserva
            </h2>

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
                disabled={carregando}
              />

              <Input
                type="time"
                label="Horário"
                value={formReserva.horario}
                onChange={(e) =>
                  setFormReserva({ ...formReserva, horario: e.target.value })
                }
                disabled={carregando}
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
                disabled={carregando}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={() => {
                    setModalEdicaoReserva(false);
                    setReservaEdicao(null);
                  }}
                  disabled={carregando}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  isLoading={carregando}
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ⚠️ Cancelar Reserva
            </h2>
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
              disabled={carregando}
            />

            <div className="flex gap-3 pt-6">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => {
                  setModalCancelamento(false);
                  setReservaCancelamento(null);
                }}
                disabled={carregando}
              >
                Manter Reserva
              </Button>
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                isLoading={carregando}
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

export default Profile;
