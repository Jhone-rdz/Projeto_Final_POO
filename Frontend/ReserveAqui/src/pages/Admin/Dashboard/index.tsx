import { Header, Footer } from '../../../components/layout';
import { Button, Alert, Input } from '../../../components/common';
import { useAuth } from '../../../context';
import { useEffect, useState, useCallback } from 'react';
import { restaurantesService, reservasService } from '../../../services/api';
import type { Restaurante, CriarRestauranteDTO } from '../../../types';

type TabType = 'restaurantes' | 'relatorios';

/**
 * Dashboard do Administrador - Gestão global da plataforma
 */
const AdminDashboard = () => {
  const { usuario } = useAuth();
  const [tabAtiva, setTabAtiva] = useState<TabType>('restaurantes');

  // Estado de restaurantes
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [carregandoRestaurantes, setCarregandoRestaurantes] = useState(false);

  // Formulário de restaurante
  const [modalRestaurante, setModalRestaurante] = useState(false);
  const [restauranteEditando, setRestauranteEditando] = useState<Restaurante | null>(null);
  const [formRestaurante, setFormRestaurante] = useState<CriarRestauranteDTO>({
    nome: '',
    descricao: '',
    localizacao: '',
    horario_funcionamento: '',
    imagem: '',
    quantidade_mesas: 10,
  });

  // Modal de confirmação de remoção
  const [modalRemover, setModalRemover] = useState(false);
  const [restauranteRemover, setRestauranteRemover] = useState<Restaurante | null>(null);

  // Estatísticas gerais
  const [estatisticas, setEstatisticas] = useState<any>(null);
  const [carregandoEstatisticas, setCarregandoEstatisticas] = useState(false);
  const [periodoEstatisticas, setPeriodoEstatisticas] = useState({
    inicio: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    fim: new Date().toISOString().split('T')[0],
  });

  // Feedback
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregandoAcao, setCarregandoAcao] = useState(false);

  // Carregar dados ao montar
  useEffect(() => {
    carregarRestaurantes();
  }, []);

  // Carregar estatísticas ao trocar para tab de relatórios
  useEffect(() => {
    if (tabAtiva === 'relatorios') {
      carregarEstatisticas();
    }
  }, [tabAtiva]);

  // Carregar restaurantes
  const carregarRestaurantes = useCallback(async () => {
    try {
      setCarregandoRestaurantes(true);
      const response = await restaurantesService.listar();
      setRestaurantes(response.results || []);
    } catch {
      setErro('Erro ao carregar restaurantes');
    } finally {
      setCarregandoRestaurantes(false);
    }
  }, []);

  // Abrir modal para adicionar/editar restaurante
  const handleAbrirModalRestaurante = (restaurante?: Restaurante) => {
    if (restaurante) {
      setRestauranteEditando(restaurante);
      setFormRestaurante({
        nome: restaurante.nome,
        descricao: restaurante.descricao || '',
        localizacao: restaurante.localizacao,
        horario_funcionamento: restaurante.horario_funcionamento || '',
        imagem: restaurante.imagem || '',
        quantidade_mesas: restaurante.quantidade_mesas || 10,
      });
    } else {
      setRestauranteEditando(null);
      setFormRestaurante({
        nome: '',
        descricao: '',
        localizacao: '',
        horario_funcionamento: '',
        imagem: '',
        quantidade_mesas: 10,
      });
    }
    setModalRestaurante(true);
  };

  // Salvar restaurante (criar ou editar)
  const handleSalvarRestaurante = async () => {
    setErro('');
    setSucesso('');

    if (!formRestaurante.nome || !formRestaurante.localizacao) {
      setErro('Nome e localização são obrigatórios');
      return;
    }

    if (formRestaurante.quantidade_mesas < 1) {
      setErro('Quantidade de mesas deve ser pelo menos 1');
      return;
    }

    try {
      setCarregandoAcao(true);

      if (restauranteEditando) {
        // Editar
        await restaurantesService.atualizar(restauranteEditando.id, formRestaurante);
        setSucesso('Restaurante atualizado com sucesso!');
      } else {
        // Criar
        await restaurantesService.criar(formRestaurante);
        setSucesso('Restaurante cadastrado com sucesso!');
      }

      setModalRestaurante(false);
      carregarRestaurantes();
      setTimeout(() => setSucesso(''), 3000);
    } catch {
      setErro('Erro ao salvar restaurante');
    } finally {
      setCarregandoAcao(false);
    }
  };

  // Abrir modal de confirmação de remoção
  const handleAbrirRemover = (restaurante: Restaurante) => {
    setRestauranteRemover(restaurante);
    setModalRemover(true);
  };

  // Remover restaurante
  const handleRemoverRestaurante = async () => {
    setErro('');
    setSucesso('');

    if (!restauranteRemover) return;

    try {
      setCarregandoAcao(true);
      await restaurantesService.deletar(restauranteRemover.id);
      setSucesso('Restaurante removido com sucesso!');
      setModalRemover(false);
      setRestauranteRemover(null);
      carregarRestaurantes();
      setTimeout(() => setSucesso(''), 3000);
    } catch {
      setErro(
        'Erro ao remover restaurante. Verifique se não há reservas ou mesas ativas.'
      );
    } finally {
      setCarregandoAcao(false);
    }
  };

  // Carregar estatísticas gerais
  const carregarEstatisticas = useCallback(async () => {
    try {
      setCarregandoEstatisticas(true);

      // Carregar todos os restaurantes para estatísticas
      const restaurantesResp = await restaurantesService.listar();
      const todosRestaurantes = restaurantesResp.results || [];

      // Carregar relatórios de cada restaurante
      const relatoriosPromises = todosRestaurantes.map(async (rest) => {
        try {
          const relatorio = await reservasService.relatorioOcupacao(
            rest.id,
            periodoEstatisticas.inicio,
            periodoEstatisticas.fim
          );
          return {
            restaurante: rest,
            relatorio,
          };
        } catch {
          return {
            restaurante: rest,
            relatorio: null,
          };
        }
      });

      const relatorios = await Promise.all(relatoriosPromises);

      // Calcular estatísticas agregadas
      let totalReservas = 0;
      let totalOcupacao = 0;
      let restaurantesComDados = 0;

      const restaurantesMaisReservados = relatorios
        .filter((r) => r.relatorio?.total_reservas)
        .map((r) => ({
          nome: r.restaurante.nome,
          reservas: r.relatorio.total_reservas,
          ocupacao: r.relatorio.taxa_ocupacao || 0,
        }))
        .sort((a, b) => b.reservas - a.reservas)
        .slice(0, 5);

      relatorios.forEach((r) => {
        if (r.relatorio) {
          totalReservas += r.relatorio.total_reservas || 0;
          if (r.relatorio.taxa_ocupacao) {
            totalOcupacao += r.relatorio.taxa_ocupacao;
            restaurantesComDados++;
          }
        }
      });

      const taxaMediaOcupacao =
        restaurantesComDados > 0 ? totalOcupacao / restaurantesComDados : 0;

      setEstatisticas({
        totalRestaurantes: todosRestaurantes.length,
        totalReservas,
        taxaMediaOcupacao,
        restaurantesMaisReservados,
      });
    } catch {
      setErro('Erro ao carregar estatísticas');
    } finally {
      setCarregandoEstatisticas(false);
    }
  }, [periodoEstatisticas]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            🔧 Dashboard do Administrador
          </h1>
          <p className="text-gray-600 mt-2">
            Bem-vindo, <strong>{usuario?.nome}</strong> - Gestão global da plataforma
          </p>
        </div>

        {/* Alertas */}
        {erro && <Alert type="error" message={erro} onClose={() => setErro('')} />}
        {sucesso && <Alert type="success" message={sucesso} onClose={() => setSucesso('')} />}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          <button
            onClick={() => setTabAtiva('restaurantes')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              tabAtiva === 'restaurantes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-blue-600'
            }`}
          >
            🏬 Restaurantes
          </button>
          <button
            onClick={() => setTabAtiva('relatorios')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              tabAtiva === 'relatorios'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-blue-600'
            }`}
          >
            📊 Relatórios Gerais
          </button>
        </div>

        {/* TAB: Gestão de Restaurantes */}
        {tabAtiva === 'restaurantes' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🏬 Gestão de Restaurantes</h2>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAbrirModalRestaurante()}
              >
                ➕ Adicionar Restaurante
              </Button>
            </div>

            {carregandoRestaurantes ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Carregando restaurantes...</p>
              </div>
            ) : restaurantes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Nenhum restaurante cadastrado</p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleAbrirModalRestaurante()}
                >
                  ➕ Cadastrar primeiro restaurante
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {restaurantes.map((rest) => (
                  <div
                    key={rest.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-6">
                      {/* Imagem */}
                      <div className="flex-shrink-0">
                        <img
                          src={rest.imagem || 'https://via.placeholder.com/120x120?text=Restaurante'}
                          alt={rest.nome}
                          className="w-24 h-24 rounded-lg object-cover border border-gray-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://via.placeholder.com/120x120?text=Restaurante';
                          }}
                        />
                      </div>

                      {/* Informações */}
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-gray-900 mb-2">{rest.nome}</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>📍 <strong>Localização:</strong> {rest.localizacao}</p>
                          {rest.descricao && (
                            <p>📝 <strong>Descrição:</strong> {rest.descricao}</p>
                          )}
                          {rest.horario_funcionamento && (
                            <p>🕐 <strong>Horário:</strong> {rest.horario_funcionamento}</p>
                          )}
                          <p>🪑 <strong>Mesas:</strong> {rest.quantidade_mesas}</p>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAbrirModalRestaurante(rest)}
                        >
                          ✏️ Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleAbrirRemover(rest)}
                        >
                          🗑️ Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Relatórios Gerais */}
        {tabAtiva === 'relatorios' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">📊 Relatórios Gerais do Sistema</h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={carregarEstatisticas}
                disabled={carregandoEstatisticas}
              >
                🔄 Atualizar
              </Button>
            </div>

            {/* Filtro de período */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div>
                <Input
                  type="date"
                  label="Data Início"
                  value={periodoEstatisticas.inicio}
                  onChange={(e) =>
                    setPeriodoEstatisticas({ ...periodoEstatisticas, inicio: e.target.value })
                  }
                />
              </div>
              <div>
                <Input
                  type="date"
                  label="Data Fim"
                  value={periodoEstatisticas.fim}
                  onChange={(e) =>
                    setPeriodoEstatisticas({ ...periodoEstatisticas, fim: e.target.value })
                  }
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="primary"
                  size="md"
                  onClick={carregarEstatisticas}
                  isLoading={carregandoEstatisticas}
                  className="w-full"
                >
                  🔍 Consultar
                </Button>
              </div>
            </div>

            {carregandoEstatisticas ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Carregando estatísticas...</p>
              </div>
            ) : estatisticas ? (
              <div className="space-y-8">
                {/* Cards de métricas gerais */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <p className="text-blue-600 text-sm font-semibold mb-1">
                      Total de Restaurantes
                    </p>
                    <p className="text-3xl font-bold text-blue-900">
                      {estatisticas.totalRestaurantes}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <p className="text-green-600 text-sm font-semibold mb-1">
                      Total de Reservas
                    </p>
                    <p className="text-3xl font-bold text-green-900">
                      {estatisticas.totalReservas}
                    </p>
                    <p className="text-xs text-green-700 mt-1">No período selecionado</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                    <p className="text-purple-600 text-sm font-semibold mb-1">
                      Taxa Média de Ocupação
                    </p>
                    <p className="text-3xl font-bold text-purple-900">
                      {estatisticas.taxaMediaOcupacao.toFixed(1)}%
                    </p>
                    <p className="text-xs text-purple-700 mt-1">Média da plataforma</p>
                  </div>
                </div>

                {/* Restaurantes mais reservados */}
                {estatisticas.restaurantesMaisReservados &&
                  estatisticas.restaurantesMaisReservados.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        🏆 Top 5 Restaurantes Mais Reservados
                      </h3>
                      <div className="space-y-3">
                        {estatisticas.restaurantesMaisReservados.map(
                          (item: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg border border-blue-200"
                            >
                              {/* Posição */}
                              <div className="flex-shrink-0">
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                                    index === 0
                                      ? 'bg-yellow-400 text-yellow-900'
                                      : index === 1
                                      ? 'bg-gray-300 text-gray-800'
                                      : index === 2
                                      ? 'bg-orange-300 text-orange-900'
                                      : 'bg-blue-200 text-blue-900'
                                  }`}
                                >
                                  {index + 1}
                                </div>
                              </div>

                              {/* Nome */}
                              <div className="flex-1">
                                <p className="font-bold text-gray-900">{item.nome}</p>
                                <div className="flex gap-4 text-sm text-gray-600 mt-1">
                                  <span>📅 {item.reservas} reservas</span>
                                  <span>📊 {item.ocupacao.toFixed(1)}% ocupação</span>
                                </div>
                              </div>

                              {/* Barra de progresso */}
                              <div className="flex-1">
                                <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full"
                                    style={{
                                      width: `${
                                        (item.reservas /
                                          estatisticas.restaurantesMaisReservados[0]
                                            .reservas) *
                                        100
                                      }%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Mensagem quando não há dados */}
                {estatisticas.totalReservas === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-600">
                      📊 Nenhuma reserva encontrada no período selecionado
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  Selecione um período e clique em Consultar para ver os relatórios
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: Cadastrar/Editar Restaurante */}
      {modalRestaurante && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8 my-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {restauranteEditando ? '✏️ Editar Restaurante' : '➕ Adicionar Restaurante'}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <Input
                  label="Nome do Restaurante *"
                  value={formRestaurante.nome}
                  onChange={(e) =>
                    setFormRestaurante({ ...formRestaurante, nome: e.target.value })
                  }
                  placeholder="Ex: Restaurante Sabor & Arte"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formRestaurante.descricao}
                  onChange={(e) =>
                    setFormRestaurante({ ...formRestaurante, descricao: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Descreva o restaurante..."
                />
              </div>

              <div>
                <Input
                  label="Localização *"
                  value={formRestaurante.localizacao}
                  onChange={(e) =>
                    setFormRestaurante({ ...formRestaurante, localizacao: e.target.value })
                  }
                  placeholder="Ex: Rua das Flores, 123, Centro"
                />
              </div>

              <div>
                <Input
                  label="Horário de Funcionamento"
                  value={formRestaurante.horario_funcionamento}
                  onChange={(e) =>
                    setFormRestaurante({
                      ...formRestaurante,
                      horario_funcionamento: e.target.value,
                    })
                  }
                  placeholder="Ex: Seg-Sex: 11h-23h, Sáb-Dom: 12h-00h"
                />
              </div>

              <div>
                <Input
                  type="number"
                  label="Quantidade de Mesas *"
                  value={formRestaurante.quantidade_mesas.toString()}
                  onChange={(e) =>
                    setFormRestaurante({
                      ...formRestaurante,
                      quantidade_mesas: parseInt(e.target.value) || 0,
                    })
                  }
                  min="1"
                  placeholder="10"
                />
              </div>

              <div>
                <Input
                  label="URL da Imagem"
                  value={formRestaurante.imagem}
                  onChange={(e) =>
                    setFormRestaurante({ ...formRestaurante, imagem: e.target.value })
                  }
                  placeholder="https://exemplo.com/imagem.jpg"
                />
                {formRestaurante.imagem && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    <img
                      src={formRestaurante.imagem}
                      alt="Preview"
                      className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://via.placeholder.com/400x200?text=Imagem+Indisponível';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setModalRestaurante(false)}
                disabled={carregandoAcao}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                isLoading={carregandoAcao}
                onClick={handleSalvarRestaurante}
              >
                {restauranteEditando ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Remover Restaurante */}
      {modalRemover && restauranteRemover && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🗑️ Remover Restaurante</h2>

            <p className="text-gray-600 mb-6">
              Tem certeza que deseja remover o restaurante{' '}
              <strong>{restauranteRemover.nome}</strong>?
            </p>

            <div className="bg-red-50 rounded-lg p-4 mb-6 border border-red-200">
              <p className="text-sm text-red-800">
                ⚠️ <strong>Atenção:</strong> Esta ação não poderá ser desfeita. Todos os dados
                relacionados (mesas, reservas) serão removidos.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => {
                  setModalRemover(false);
                  setRestauranteRemover(null);
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
                onClick={handleRemoverRestaurante}
              >
                Remover
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminDashboard;
