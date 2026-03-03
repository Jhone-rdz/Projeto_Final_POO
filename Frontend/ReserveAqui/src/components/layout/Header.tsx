import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context';
import { Button } from '../common';
import { notificacoesService } from '../../services/api';
import type { Notificacao } from '../../types';

/**
 * Componente de Header/Navbar — tema escuro ReservaFácil
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

  const isCliente = usuario?.papeis?.some(p => p.tipo === 'cliente');
  const isFuncionario = usuario?.papeis?.some(p => p.tipo === 'funcionario');
  const isProprietario = usuario?.papeis?.some(p => p.tipo === 'admin_secundario');
  const isAdminSistema = usuario?.papeis?.some(p => p.tipo === 'admin_sistema');
  const isPainelInterno = Boolean(isFuncionario || isProprietario || isAdminSistema);

  const dashboardPath = isAdminSistema
    ? '/admin/dashboard'
    : isProprietario
      ? '/owner/dashboard'
      : isFuncionario
        ? '/staff/dashboard'
        : '/';

  const paginasAuthenticacao = ['/login', '/register', '/recuperar-senha', '/confirmacao-recuperacao', '/redefinir-senha'];
  const ocultarHeader = paginasAuthenticacao.includes(location.pathname);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setNotificacoesAbertas(false);
      }
    };
    if (notificacoesAbertas) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, [notificacoesAbertas]);

  useEffect(() => {
    if (notificacoesAbertas && isCliente) carregarNotificacoes();
  }, [notificacoesAbertas, isCliente]);

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
      setNotificacoes(prev => prev.map(n => (n.id === notifId ? { ...n, lido: true } : n)));
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
      case 'confirmacao': return '✅';
      case 'cancelamento': return '❌';
      case 'lembranca': return '⏰';
      case 'atualizacao': return '🔄';
      default: return '📢';
    }
  };

  if (ocultarHeader) return null;

  // ── Estilos do tema ──
  const GOLD = '#C9922A';
  const headerBg = '#1a1a1a';
  const borderGold = `1px solid ${GOLD}`;

  return (
    <header
      className="w-full sticky top-0 z-50"
      style={{ backgroundColor: headerBg, borderBottom: `2px solid ${GOLD}` }}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to={dashboardPath} className="flex items-center gap-2 no-underline">
            {/* Ícone calendário/reserva */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="4" width="24" height="22" rx="3" stroke={GOLD} strokeWidth="2" fill="none" />
              <path d="M2 10h24" stroke={GOLD} strokeWidth="2" />
              <rect x="7" y="2" width="3" height="5" rx="1.5" fill={GOLD} />
              <rect x="18" y="2" width="3" height="5" rx="1.5" fill={GOLD} />
              <path d="M8 16l3 3 6-6" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span
              style={{
                color: GOLD,
                fontWeight: 700,
                fontSize: '1.2rem',
                fontFamily: "'Georgia', serif",
                letterSpacing: '0.01em',
              }}
            >
              ReservaFácil
            </span>
          </Link>

          {/* Nav Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {!isPainelInterno && (
              <>
                <Link
                  to="/"
                  style={{ color: '#ccc', fontWeight: 500, textDecoration: 'none', fontSize: '0.95rem' }}
                  onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                  onMouseLeave={e => (e.currentTarget.style.color = '#ccc')}
                >
                  Inicio
                </Link>
                <Link
                  to="/restaurants"
                  style={{ color: '#ccc', fontWeight: 500, textDecoration: 'none', fontSize: '0.95rem' }}
                  onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                  onMouseLeave={e => (e.currentTarget.style.color = '#ccc')}
                >
                  Restaurantes
                </Link>
              </>
            )}
            {isAuthenticated && isCliente && !isPainelInterno && (
              <Link
                to="/reservations"
                style={{ color: '#ccc', fontWeight: 500, textDecoration: 'none', fontSize: '0.95rem' }}
                onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                onMouseLeave={e => (e.currentTarget.style.color = '#ccc')}
              >
                Minhas Reservas
              </Link>
            )}
          </nav>

          {/* Ações à direita */}
          <div className="flex items-center gap-3">

            {/* Notificações */}
            {isAuthenticated && isCliente && (
              <div className="relative" ref={notifDropdownRef}>
                <button
                  onClick={() => setNotificacoesAbertas(!notificacoesAbertas)}
                  className="relative p-2"
                  style={{ color: '#ccc', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {countNaoLidas > 0 && (
                    <span
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold"
                      style={{ backgroundColor: GOLD }}
                    >
                      {countNaoLidas > 9 ? '9+' : countNaoLidas}
                    </span>
                  )}
                </button>

                {notificacoesAbertas && (
                  <div
                    className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl z-50 overflow-hidden"
                    style={{ backgroundColor: '#222', border: `1px solid #444` }}
                  >
                    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #333' }}>
                      <h3 className="font-semibold" style={{ color: '#fff' }}>Notificações</h3>
                      {countNaoLidas > 0 && (
                        <button
                          onClick={handleMarcarTodasComoLidas}
                          className="text-xs"
                          style={{ color: GOLD, background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Marcar todas como lidas
                        </button>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {carregandoNotificacoes ? (
                        <div className="p-8 text-center" style={{ color: '#aaa' }}>Carregando...</div>
                      ) : notificacoes.length === 0 ? (
                        <div className="p-8 text-center" style={{ color: '#aaa' }}>Nenhuma notificação</div>
                      ) : (
                        notificacoes.map(notif => (
                          <div
                            key={notif.id}
                            className="px-4 py-3 cursor-pointer"
                            style={{
                              borderBottom: '1px solid #333',
                              backgroundColor: !notif.lido ? '#2a2a2a' : 'transparent',
                            }}
                            onClick={() => !notif.lido && handleMarcarComoLida(notif.id)}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-xl flex-shrink-0">{getIconeNotificacao(notif.tipo)}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                  <h4 className="font-semibold text-sm" style={{ color: '#fff' }}>{notif.titulo}</h4>
                                  {!notif.lido && (
                                    <span className="w-2 h-2 rounded-full flex-shrink-0 ml-2 mt-1" style={{ backgroundColor: GOLD }} />
                                  )}
                                </div>
                                <p className="text-sm line-clamp-2" style={{ color: '#aaa' }}>{notif.mensagem}</p>
                                <p className="text-xs mt-1" style={{ color: '#666' }}>{formatarDataRelativa(notif.data_criacao)}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {notificacoes.length > 0 && (
                      <div className="px-4 py-2" style={{ borderTop: '1px solid #333', backgroundColor: '#1a1a1a' }}>
                        <p className="text-xs text-center" style={{ color: '#666' }}>
                          Total: {notificacoes.length} notifica{notificacoes.length === 1 ? 'ção' : 'ções'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Usuário autenticado */}
            {isAuthenticated && usuario ? (
              <div className="relative">
                <button
                  onClick={() => setPerfilAberto(!perfilAberto)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: 'none', border: borderGold, cursor: 'pointer' }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ backgroundColor: GOLD, color: '#1a1a1a' }}
                  >
                    {usuario.nome.charAt(0).toUpperCase()}
                  </div>
                  <svg className="w-3 h-3" style={{ color: GOLD }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {perfilAberto && (
                  <div
                    className="absolute right-0 mt-2 w-52 rounded-xl shadow-2xl py-2 z-50"
                    style={{ backgroundColor: '#222', border: '1px solid #444' }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid #333' }}>
                      <p className="font-semibold" style={{ color: '#fff', fontSize: '0.9rem' }}>{usuario.nome}</p>
                      <p className="text-xs" style={{ color: '#888' }}>{usuario.email}</p>
                    </div>

                    {usuario.papeis?.some(p => p.tipo === 'funcionario') && (
                      <Link to="/staff/dashboard" onClick={() => setPerfilAberto(false)}
                        className="block px-4 py-2 text-sm font-medium"
                        style={{ color: '#ddd', textDecoration: 'none' }}
                      >👔 Dashboard Funcionário</Link>
                    )}
                    {usuario.papeis?.some(p => p.tipo === 'admin_secundario') && (
                      <>
                        <Link to="/owner/dashboard" onClick={() => setPerfilAberto(false)}
                          className="block px-4 py-2 text-sm font-medium"
                          style={{ color: '#ddd', textDecoration: 'none' }}
                        >🏪 Dashboard</Link>
                        <Link to="/owner/restaurant" onClick={() => setPerfilAberto(false)}
                          className="block px-4 py-2 text-sm font-medium"
                          style={{ color: '#ddd', textDecoration: 'none' }}
                        >⚙️ Gerenciar Restaurante</Link>
                      </>
                    )}
                    {usuario.papeis?.some(p => p.tipo === 'admin_sistema') && (
                      <Link to="/admin/dashboard" onClick={() => setPerfilAberto(false)}
                        className="block px-4 py-2 text-sm font-medium"
                        style={{ color: '#ddd', textDecoration: 'none' }}
                      >🔧 Dashboard Admin</Link>
                    )}
                    <Link to="/profile" onClick={() => setPerfilAberto(false)}
                      className="block px-4 py-2 text-sm font-medium"
                      style={{ color: '#ddd', textDecoration: 'none' }}
                    >👤 Meu Perfil</Link>
                    <button
                      onClick={() => { logout(); setPerfilAberto(false); }}
                      className="w-full text-left px-4 py-2 text-sm font-medium"
                      style={{ color: '#e05555', background: 'none', border: 'none', cursor: 'pointer' }}
                    >🚪 Sair</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login">
                  <button
                    style={{
                      background: 'none',
                      border: borderGold,
                      color: GOLD,
                      borderRadius: 8,
                      padding: '7px 20px',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = GOLD; (e.currentTarget as HTMLButtonElement).style.color = '#1a1a1a'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = GOLD; }}
                  >
                    Entrar
                  </button>
                </Link>
                <Link to="/register">
                  <button
                    style={{
                      backgroundColor: GOLD,
                      border: borderGold,
                      color: '#fff',
                      borderRadius: 8,
                      padding: '7px 20px',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#b07e1e'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = GOLD; }}
                  >
                    Cadastrar
                  </button>
                </Link>
              </div>
            )}

            {/* Menu Mobile toggle */}
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="md:hidden p-2 rounded-lg"
              style={{ color: GOLD, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {menuAberto && (
          <div className="md:hidden py-4" style={{ borderTop: '1px solid #333' }}>
            {!isPainelInterno && (
              <>
                <Link to="/" className="block px-4 py-2 font-medium" style={{ color: '#ccc', textDecoration: 'none' }}>Home</Link>
                <Link to="/restaurants" className="block px-4 py-2 font-medium" style={{ color: '#ccc', textDecoration: 'none' }}>Restaurantes</Link>
              </>
            )}
            {isAuthenticated && isCliente && !isPainelInterno && (
              <Link to="/reservations" className="block px-4 py-2 font-medium" style={{ color: '#ccc', textDecoration: 'none' }}>Minhas Reservas</Link>
            )}
            {!isAuthenticated && (
              <div className="flex gap-2 px-4 pt-3">
                <Link to="/login" className="flex-1">
                  <button className="w-full py-2 rounded-lg font-bold" style={{ background: 'none', border: `1px solid ${GOLD}`, color: GOLD, cursor: 'pointer' }}>Entrar</button>
                </Link>
                <Link to="/register" className="flex-1">
                  <button className="w-full py-2 rounded-lg font-bold" style={{ backgroundColor: GOLD, border: 'none', color: '#fff', cursor: 'pointer' }}>Cadastrar</button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};