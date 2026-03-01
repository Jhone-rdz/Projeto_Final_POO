import { Header, Footer } from '../../../components/layout';
import { Button, Alert, Input } from '../../../components/common';
import { useAuth } from '../../../context';
import { useEffect, useState, useCallback } from 'react';
import { 
  restaurantesService, 
  usuariosService, 
  reservasService 
} from '../../../services/api';
import type { Restaurante, Usuario } from '../../../types';

type TabType = 'info' | 'funcionarios' | 'relatorios';

/**
 * Perfil do Restaurante - Gerenciamento completo
 */
const RestaurantProfile = () => {
  const { usuario } = useAuth();
  const [tabAtiva, setTabAtiva] = useState<TabType>('info');

  // Estado de restaurante
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [carregandoRestaurante, setCarregandoRestaurante] = useState(false);

  // Estado de funcionários
  const [funcionarios, setFuncionarios] = useState<Usuario[]>([]);
  const [carregandoFuncionarios, setCarregandoFuncionarios] = useState(false);

  // Formulário de edição de restaurante
  const [editandoInfo, setEditandoInfo] = useState(false);
  const [formRestaurante, setFormRestaurante] = useState({
    nome: '',
    descricao: '',
    localizacao: '',
    horario_funcionamento: '',
    imagem: '',
  });

  // Formulário de funcionário
  const [modalFuncionario, setModalFuncionario] = useState(false);
  const [funcionarioEditando, setFuncionarioEditando] = useState<Usuario | null>(null);
  const [formFuncionario, setFormFuncionario] = useState({
    nome: '',
    email: '',
    username: '',
    senha: '',
  });

  // Modal de confirmação de remoção
  const [modalRemover, setModalRemover] = useState(false);
  const [funcionarioRemover, setFuncionarioRemover] = useState<Usuario | null>(null);

  // Relatórios
  const [relatorio, setRelatorio] = useState<any>(null);
  const [carregandoRelatorio, setCarregandoRelatorio] = useState(false);
  const [periodoRelatorio, setPeriodoRelatorio] = useState({
    inicio: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    fim: new Date().toISOString().split('T')[0],
  });

  // Feedback
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregandoAcao, setCarregandoAcao] = useState(false);

  // Carregar dados ao montar
  useEffect(() => {
    carregarRestaurante();
  }, []);

  // Carregar funcionários ao trocar para tab de funcionários
  useEffect(() => {
    if (tabAtiva === 'funcionarios' && restaurante) {
      carregarFuncionarios();
    }
  }, [tabAtiva, restaurante]);

  // Carregar relatório ao trocar para tab de relatórios
  useEffect(() => {
    if (tabAtiva === 'relatorios' && restaurante) {
      carregarRelatorio();
    }
  }, [tabAtiva, restaurante]);

  // Carregar restaurante
  const carregarRestaurante = async () => {
    try {
      setCarregandoRestaurante(true);
      const response = await restaurantesService.meusRestaurantes();
      if (response.results && response.results.length > 0) {
        const rest = response.results[0];
        setRestaurante(rest);
        setFormRestaurante({
          nome: rest.nome || '',
          descricao: rest.descricao || '',
          localizacao: rest.localizacao || '',
          horario_funcionamento: rest.horario_funcionamento || '',
          imagem: rest.imagem || '',
        });
      }
    } catch {
      setErro('Erro ao carregar informações do restaurante');
    } finally {
      setCarregandoRestaurante(false);
    }
  };

  // Atualizar informações do restaurante
  const handleSalvarInfoRestaurante = async () => {
    setErro('');
    setSucesso('');

    if (!restaurante) return;

    if (!formRestaurante.nome || !formRestaurante.localizacao) {
      setErro('Nome e localização são obrigatórios');
      return;
    }

    try {
      setCarregandoAcao(true);
      await restaurantesService.atualizar(restaurante.id, formRestaurante);
      setSucesso('Informações do restaurante atualizadas com sucesso!');
      setEditandoInfo(false);
      carregarRestaurante();
      setTimeout(() => setSucesso(''), 3000);
    } catch {
      setErro('Erro ao atualizar informações do restaurante');
    } finally {
      setCarregandoAcao(false);
    }
  };

  // Carregar funcionários
  const carregarFuncionarios = useCallback(async () => {
    try {
      setCarregandoFuncionarios(true);
      // Assumindo que o backend filtra funcionários por restaurante
      // Ajustar conforme implementação do backend
      const response = await usuariosService.listar({
        papel: 'funcionario',
        restaurante: restaurante?.id,
      });
      setFuncionarios(response.results || []);
    } catch {
      setErro('Erro ao carregar funcionários');
    } finally {
      setCarregandoFuncionarios(false);
    }
  }, [restaurante]);

  // Abrir modal para adicionar funcionário
  const handleAbrirModalFuncionario = (funcionario?: Usuario) => {
    if (funcionario) {
      setFuncionarioEditando(funcionario);
      setFormFuncionario({
        nome: funcionario.nome,
        email: funcionario.email,
        username: funcionario.username,
        senha: '',
      });
    } else {
      setFuncionarioEditando(null);
      setFormFuncionario({
        nome: '',
        email: '',
        username: '',
        senha: '',
      });
    }
    setModalFuncionario(true);
  };

  // Salvar funcionário (criar ou editar)
  const handleSalvarFuncionario = async () => {
    setErro('');
    setSucesso('');

    if (!formFuncionario.nome || !formFuncionario.email || !formFuncionario.username) {
      setErro('Preencha todos os campos obrigatórios');
      return;
    }

    if (!funcionarioEditando && !formFuncionario.senha) {
      setErro('Senha é obrigatória para novos funcionários');
      return;
    }

    try {
      setCarregandoAcao(true);

      if (funcionarioEditando) {
        // Editar
        await usuariosService.atualizar(funcionarioEditando.id, {
          nome: formFuncionario.nome,
          email: formFuncionario.email,
          username: formFuncionario.username,
        });
        setSucesso('Funcionário atualizado com sucesso!');
      } else {
        // Criar
        await usuariosService.criar({
          nome: formFuncionario.nome,
          email: formFuncionario.email,
          username: formFuncionario.username,
          senha: formFuncionario.senha,
          papel: 'funcionario',
          restaurante: restaurante?.id,
        });
        setSucesso('Funcionário cadastrado com sucesso!');
      }

      setModalFuncionario(false);
      carregarFuncionarios();
      setTimeout(() => setSucesso(''), 3000);
    } catch {
      setErro('Erro ao salvar funcionário');
    } finally {
      setCarregandoAcao(false);
    }
  };

  // Abrir modal de confirmação de remoção
  const handleAbrirRemover = (funcionario: Usuario) => {
    setFuncionarioRemover(funcionario);
    setModalRemover(true);
  };

  // Remover funcionário
  const handleRemoverFuncionario = async () => {
    setErro('');
    setSucesso('');

    if (!funcionarioRemover) return;

    try {
      setCarregandoAcao(true);
      await usuariosService.deletar(funcionarioRemover.id);
      setSucesso('Funcionário removido com sucesso!');
      setModalRemover(false);
      setFuncionarioRemover(null);
      carregarFuncionarios();
      setTimeout(() => setSucesso(''), 3000);
    } catch {
      setErro('Erro ao remover funcionário');
    } finally {
      setCarregandoAcao(false);
    }
  };

  // Carregar relatório
  const carregarRelatorio = useCallback(async () => {
    if (!restaurante) return;

    try {
      setCarregandoRelatorio(true);
      const data = await reservasService.relatorioOcupacao(
        restaurante.id,
        periodoRelatorio.inicio,
        periodoRelatorio.fim
      );
      setRelatorio(data);
    } catch {
      setErro('Erro ao carregar relatório');
    } finally {
      setCarregandoRelatorio(false);
    }
  }, [restaurante, periodoRelatorio]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            🏪 Gerenciamento do Restaurante
          </h1>
          <p className="text-gray-600 mt-2">
            Administre informações, equipe e visualize métricas
          </p>
          {restaurante && (
            <p className="text-gray-700 mt-1">
              📍 <strong>{restaurante.nome}</strong>
            </p>
          )}
        </div>

        {/* Alertas */}
        {erro && <Alert type="error" message={erro} onClose={() => setErro('')} />}
        {sucesso && <Alert type="success" message={sucesso} onClose={() => setSucesso('')} />}

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
          <div>
            {/* Tabs */}
            <div className="flex gap-2 mb-8 border-b border-gray-200">
              <button
                onClick={() => setTabAtiva('info')}
                className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                  tabAtiva === 'info'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-blue-600'
                }`}
              >
                🏢 Informações
              </button>
              <button
                onClick={() => setTabAtiva('funcionarios')}
                className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                  tabAtiva === 'funcionarios'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-blue-600'
                }`}
              >
                👥 Funcionários
              </button>
              <button
                onClick={() => setTabAtiva('relatorios')}
                className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                  tabAtiva === 'relatorios'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-blue-600'
                }`}
              >
                📊 Relatórios
              </button>
            </div>

            {/* TAB: Informações do Restaurante */}
            {tabAtiva === 'info' && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    🏢 Informações do Restaurante
                  </h2>
                  {!editandoInfo ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setEditandoInfo(true)}
                    >
                      ✏️ Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditandoInfo(false);
                          setFormRestaurante({
                            nome: restaurante.nome || '',
                            descricao: restaurante.descricao || '',
                            localizacao: restaurante.localizacao || '',
                            horario_funcionamento: restaurante.horario_funcionamento || '',
                            imagem: restaurante.imagem || '',
                          });
                        }}
                        disabled={carregandoAcao}
                      >
                        ❌ Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSalvarInfoRestaurante}
                        isLoading={carregandoAcao}
                      >
                        💾 Salvar
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <Input
                      label="Nome do Restaurante *"
                      value={formRestaurante.nome}
                      onChange={(e) =>
                        setFormRestaurante({ ...formRestaurante, nome: e.target.value })
                      }
                      disabled={!editandoInfo}
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
                      disabled={!editandoInfo}
                      rows={4}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        !editandoInfo ? 'bg-gray-100' : ''
                      }`}
                      placeholder="Descreva seu restaurante..."
                    />
                  </div>

                  <div>
                    <Input
                      label="Localização *"
                      value={formRestaurante.localizacao}
                      onChange={(e) =>
                        setFormRestaurante({ ...formRestaurante, localizacao: e.target.value })
                      }
                      disabled={!editandoInfo}
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
                      disabled={!editandoInfo}
                      placeholder="Ex: Seg-Sex: 11h-23h, Sáb-Dom: 12h-00h"
                    />
                  </div>

                  <div>
                    <Input
                      label="URL da Imagem"
                      value={formRestaurante.imagem}
                      onChange={(e) =>
                        setFormRestaurante({ ...formRestaurante, imagem: e.target.value })
                      }
                      disabled={!editandoInfo}
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
              </div>
            )}

            {/* TAB: Gestão de Funcionários */}
            {tabAtiva === 'funcionarios' && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">👥 Gestão de Funcionários</h2>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAbrirModalFuncionario()}
                  >
                    ➕ Cadastrar Funcionário
                  </Button>
                </div>

                {carregandoFuncionarios ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">Carregando funcionários...</p>
                  </div>
                ) : funcionarios.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">Nenhum funcionário cadastrado</p>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleAbrirModalFuncionario()}
                    >
                      ➕ Cadastrar primeiro funcionário
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {funcionarios.map((func) => (
                      <div
                        key={func.id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                              {func.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-lg text-gray-900">{func.nome}</p>
                              <p className="text-sm text-gray-600">📧 {func.email}</p>
                              <p className="text-sm text-gray-600">👤 @{func.username}</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleAbrirModalFuncionario(func)}
                            >
                              ✏️ Editar
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleAbrirRemover(func)}
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

            {/* TAB: Relatórios e Métricas */}
            {tabAtiva === 'relatorios' && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">📊 Relatórios e Métricas</h2>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={carregarRelatorio}
                    disabled={carregandoRelatorio}
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
                      value={periodoRelatorio.inicio}
                      onChange={(e) =>
                        setPeriodoRelatorio({ ...periodoRelatorio, inicio: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Input
                      type="date"
                      label="Data Fim"
                      value={periodoRelatorio.fim}
                      onChange={(e) =>
                        setPeriodoRelatorio({ ...periodoRelatorio, fim: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={carregarRelatorio}
                      isLoading={carregandoRelatorio}
                      className="w-full"
                    >
                      🔍 Consultar
                    </Button>
                  </div>
                </div>

                {carregandoRelatorio ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">Carregando relatório...</p>
                  </div>
                ) : relatorio ? (
                  <div className="space-y-8">
                    {/* Cards de métricas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                        <p className="text-blue-600 text-sm font-semibold mb-1">
                          Taxa de Ocupação
                        </p>
                        <p className="text-3xl font-bold text-blue-900">
                          {relatorio.taxa_ocupacao
                            ? `${relatorio.taxa_ocupacao.toFixed(1)}%`
                            : 'N/A'}
                        </p>
                      </div>

                      <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                        <p className="text-green-600 text-sm font-semibold mb-1">
                          Total de Reservas
                        </p>
                        <p className="text-3xl font-bold text-green-900">
                          {relatorio.total_reservas || 0}
                        </p>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                        <p className="text-purple-600 text-sm font-semibold mb-1">
                          Pessoas Atendidas
                        </p>
                        <p className="text-3xl font-bold text-purple-900">
                          {relatorio.total_pessoas || 0}
                        </p>
                      </div>
                    </div>

                    {/* Horários de pico */}
                    {relatorio.horarios_pico && relatorio.horarios_pico.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                          ⏰ Horários de Pico
                        </h3>
                        <div className="space-y-2">
                          {relatorio.horarios_pico.map((item: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg"
                            >
                              <span className="font-bold text-gray-900 w-20">
                                {item.horario}
                              </span>
                              <div className="flex-1">
                                <div className="bg-gray-200 rounded-full h-6 overflow-hidden">
                                  <div
                                    className="bg-blue-600 h-full rounded-full flex items-center justify-end pr-2"
                                    style={{
                                      width: `${
                                        (item.quantidade / relatorio.horarios_pico[0].quantidade) *
                                        100
                                      }%`,
                                    }}
                                  >
                                    <span className="text-white text-xs font-bold">
                                      {item.quantidade}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reservas por dia */}
                    {relatorio.reservas_por_dia && relatorio.reservas_por_dia.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                          📅 Reservas por Dia
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Data
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Reservas
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Pessoas
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {relatorio.reservas_por_dia.map((item: any, index: number) => (
                                <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {item.quantidade}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {item.total_pessoas}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
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
          </div>
        )}

        {/* Sem restaurante */}
        {!carregandoRestaurante && !restaurante && (
          <div className="text-center py-24">
            <p className="text-gray-600 text-lg mb-4">
              😔 Você não é proprietário de nenhum restaurante
            </p>
            <p className="text-gray-500">Entre em contato com o administrador do sistema</p>
          </div>
        )}
      </main>

      {/* MODAL: Cadastrar/Editar Funcionário */}
      {modalFuncionario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {funcionarioEditando ? '✏️ Editar Funcionário' : '➕ Cadastrar Funcionário'}
            </h2>

            <div className="space-y-4 mb-6">
              <Input
                label="Nome Completo *"
                value={formFuncionario.nome}
                onChange={(e) => setFormFuncionario({ ...formFuncionario, nome: e.target.value })}
                placeholder="Ex: João Silva"
              />

              <Input
                type="email"
                label="Email *"
                value={formFuncionario.email}
                onChange={(e) =>
                  setFormFuncionario({ ...formFuncionario, email: e.target.value })
                }
                placeholder="joao@exemplo.com"
              />

              <Input
                label="Username *"
                value={formFuncionario.username}
                onChange={(e) =>
                  setFormFuncionario({ ...formFuncionario, username: e.target.value })
                }
                placeholder="joaosilva"
              />

              {!funcionarioEditando && (
                <Input
                  type="password"
                  label="Senha *"
                  value={formFuncionario.senha}
                  onChange={(e) =>
                    setFormFuncionario({ ...formFuncionario, senha: e.target.value })
                  }
                  placeholder="••••••••"
                />
              )}

              {funcionarioEditando && (
                <p className="text-sm text-gray-500">
                  💡 Para alterar a senha, o funcionário deve usar a opção de redefinir senha no login
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setModalFuncionario(false)}
                disabled={carregandoAcao}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                isLoading={carregandoAcao}
                onClick={handleSalvarFuncionario}
              >
                {funcionarioEditando ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Remover Funcionário */}
      {modalRemover && funcionarioRemover && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🗑️ Remover Funcionário</h2>

            <p className="text-gray-600 mb-6">
              Tem certeza que deseja remover o funcionário{' '}
              <strong>{funcionarioRemover.nome}</strong>?
            </p>

            <div className="bg-yellow-50 rounded-lg p-4 mb-6 border border-yellow-200">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Atenção:</strong> Esta ação não poderá ser desfeita e o funcionário
                perderá acesso ao sistema.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => {
                  setModalRemover(false);
                  setFuncionarioRemover(null);
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
                onClick={handleRemoverFuncionario}
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

export default RestaurantProfile;
