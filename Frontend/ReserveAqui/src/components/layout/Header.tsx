import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context';
import { Button } from '../common';
import { notificacoesService } from '../../services/api';
import type { Notificacao } from '../../types';

/**
 * Componente de Header/Navbar
 */
export const Header = () => {
  const { isAuthenticated, usuario, logout } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const [perfilAberto, setPerfilAberto] = useState(false);
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregandoNotificacoes, setCarregandoNotificacoes] = useState(false);
  const [countNaoLidas, setCountNaoLidas] = useState(0);
  const location = useLocation();

  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Verificar se o usuário é cliente
  const isCliente = usuario?.papeis?.some(p => p.tipo === 'cliente');

  // Não mostrar header nas páginas de autenticação
  const paginasAuthenticacao = ['/login', '/register', '/recuperar-senha', '/confirmacao-recuperacao', '/redefinir-senha'];
  if (paginasAuthenticacao.includes(location.pathname)) {
    return null;
  }

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setNotificacoesAbertas(false);
      }
    };

    if (notificacoesAbertas) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificacoesAbertas]);

  // Carregar notificações quando abrir o dropdown
  useEffect(() => {
    if (notificacoesAbertas && isCliente) {
      carregarNotificacoes();
    }
  }, [notificacoesAbertas, isCliente]);

  // Polling para atualizar contador de não lidas (a cada 30 segundos)
  useEffect(() => {
    if (isAuthenticated && isCliente) {
      carregarContadorNaoLidas();
      const interval = setInterval(carregarContadorNaoLidas, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isCliente]);

  const carregarNotificacoes = async () => {
    try {
      setCarregandoNotificacoes(true);
      const response = await notificacoesService.listar();
      setNotificacoes(response.results || []);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setCarregandoNotificacoes(false);
    }
  };

  const carregarContadorNaoLidas = async () => {
    try {
      const response = await notificacoesService.contarNaoLidas();
      setCountNaoLidas(response.count || 0);
    } catch (error) {
      console.error('Erro ao carregar contador de notificações:', error);
    }
  };

  const handleMarcarComoLida = async (notifId: number) => {
    try {
      await notificacoesService.marcarComoLida(notifId);
      // Atualizar localmente
      setNotificacoes(prev =>
        prev.map(n => (n.id === notifId ? { ...n, lido: true } : n))
      );
      setCountNaoLidas(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const handleMarcarTodasComoLidas = async () => {
    try {
      await notificacoesService.marcarTodasComoLidas();
      setNotificacoes(prev => prev.map(n => ({ ...n, lido: true })));
      setCountNaoLidas(0);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const formatarDataRelativa = (dataStr: string) => {
    const data = new Date(dataStr);
    const agora = new Date();
    const diffMs = agora.getTime() - data.getTime();
    const diffMinutos = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMinutos / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMinutos < 1) return 'Agora';
    if (diffMinutos < 60) return `${diffMinutos}m atrás`;
    if (diffHoras < 24) return `${diffHoras}h atrás`;
    if (diffDias < 7) return `${diffDias}d atrás`;
    return data.toLocaleDateString('pt-BR');
  };

  const getIconeNotificacao = (tipo: string) => {
    switch (tipo) {
      case 'confirmacao':
        return '✅';
      case 'cancelamento':
        return '❌';
      case 'lembranca':
        return '⏰';
      case 'atualizacao':
        return '🔄';
      default:
        return '📢';
    }
  };

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              R
            </div>
            <span className="font-bold text-xl text-gray-900">ReserveAqui</span>
          </Link>

          {/* Menu Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium">
              Home
            </Link>
            <Link to="/restaurants" className="text-gray-600 hover:text-blue-600 font-medium">
              Restaurantes
            </Link>
            {isAuthenticated && isCliente && (
              <Link to="/reservations" className="text-gray-600 hover:text-blue-600 font-medium">
                Minhas Reservas
              </Link>
            )}
          </nav>

          {/* Ações à direita */}
          <div className="flex items-center gap-4">
            {/* Notificações - Apenas para Clientes */}
            {isAuthenticated && isCliente && (
              <div className="relative" ref={notifDropdownRef}>
                <button
                  onClick={() => setNotificacoesAbertas(!notificacoesAbertas)}
                  className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {countNaoLidas > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 rounded-full text-white text-xs font-bold flex items-center justify-center">
                      {countNaoLidas > 9 ? '9+' : countNaoLidas}
                    </span>
                  )}
                </button>

                {/* Dropdown de Notificações */}
                {notificacoesAbertas && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-hidden flex flex-col">
                    {/* Cabeçalho */}
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                      <h3 className="font-bold text-gray-900">🔔 Notificações</h3>
                      {notificacoes.some(n => !n.lido) && (
                        <button
                          onClick={handleMarcarTodasComoLidas}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Marcar todas como lidas
                        </button>
                      )}
                    </div>

                    {/* Lista de Notificações */}
                    <div className="overflow-y-auto flex-1">
                      {carregandoNotificacoes ? (
                        <div className="p-8 text-center">
                          <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                          <p className="mt-2 text-sm text-gray-600">Carregando...</p>
                        </div>
                      ) : notificacoes.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="text-4xl mb-2">📭</div>
                          <p className="text-gray-600">Você não tem notificações</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {notificacoes.map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                                !notif.lido ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => !notif.lido && handleMarcarComoLida(notif.id)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="text-2xl flex-shrink-0">
                                  {getIconeNotificacao(notif.tipo)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-1">
                                    <h4 className="font-semibold text-gray-900 text-sm">
                                      {notif.titulo}
                                    </h4>
                                    {!notif.lido && (
                                      <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2 mt-1"></span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {notif.mensagem}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {formatarDataRelativa(notif.data_criacao)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Rodapé */}
                    {notificacoes.length > 0 && (
                      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                        <p className="text-xs text-gray-500 text-center">
                          Total: {notificacoes.length} notifica{notificacoes.length === 1 ? 'ção' : 'ções'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Menu Usuário */}
            {isAuthenticated && usuario ? (
              <div className="relative">
                <button
                  onClick={() => setPerfilAberto(!perfilAberto)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {usuario.nome.charAt(0).toUpperCase()}
                  </div>
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>

                {/* Menu Perfil Dropdown */}
                {perfilAberto && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="font-medium text-gray-900">{usuario.nome}</p>
                      <p className="text-sm text-gray-600">{usuario.email}</p>
                    </div>

                    {/* Link do Dashboard para Funcionário */}
                    {usuario.papeis?.some(p => p.tipo === 'funcionario') && (
                      <Link
                        to="/staff/dashboard"
                        onClick={() => setPerfilAberto(false)}
                        className="block px-4 py-2 hover:bg-gray-100 text-gray-700 font-medium"
                      >
                        👔 Dashboard Funcionário
                      </Link>
                    )}

                    {/* Link do Dashboard para Proprietário */}
                    {usuario.papeis?.some(p => p.tipo === 'admin_secundario') && (
                      <>
                        <Link
                          to="/owner/dashboard"
                          onClick={() => setPerfilAberto(false)}
                          className="block px-4 py-2 hover:bg-gray-100 text-gray-700 font-medium"
                        >
                          🏪 Dashboard
                        </Link>
                        <Link
                          to="/owner/restaurant"
                          onClick={() => setPerfilAberto(false)}
                          className="block px-4 py-2 hover:bg-gray-100 text-gray-700 font-medium"
                        >
                          ⚙️ Gerenciar Restaurante
                        </Link>
                      </>
                    )}

                    {/* Link do Dashboard para Admin */}
                    {usuario.papeis?.some(p => p.tipo === 'admin_sistema') && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setPerfilAberto(false)}
                        className="block px-4 py-2 hover:bg-gray-100 text-gray-700 font-medium"
                      >
                        🔧 Dashboard Admin
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      onClick={() => setPerfilAberto(false)}
                      className="block px-4 py-2 hover:bg-gray-100 text-gray-700 font-medium"
                    >
                      👤 Meu Perfil
                    </Link>

                    <button
                      onClick={() => {
                        logout();
                        setPerfilAberto(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 font-medium"
                    >
                      🚪 Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Botões Entrar/Cadastrar */
              <div className="hidden sm:flex items-center gap-3">
                <Link to="/login">
                  <Button variant="secondary" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Cadastrar
                  </Button>
                </Link>
              </div>
            )}

            {/* Menu Mobile */}
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {menuAberto && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <Link to="/" className="block px-4 py-2 text-gray-600 hover:text-blue-600 font-medium">
              Home
            </Link>
            <Link to="/restaurants" className="block px-4 py-2 text-gray-600 hover:text-blue-600 font-medium">
              Restaurantes
            </Link>
            {isAuthenticated && isCliente && (
              <Link to="/reservations" className="block px-4 py-2 text-gray-600 hover:text-blue-600 font-medium">
                Minhas Reservas
              </Link>
            )}

            {!isAuthenticated && (
              <div className="flex gap-2 px-4 py-4">
                <Link to="/login" className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full">
                    Entrar
                  </Button>
                </Link>
                <Link to="/register" className="flex-1">
                  <Button variant="primary" size="sm" className="w-full">
                    Cadastrar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
