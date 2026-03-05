import { Header, Footer } from '../../../components/layout';
import { useAuth } from '../../../context';
import { useEffect, useState, useCallback } from 'react';
import { mesasService, reservasService, restaurantesService } from '../../../services/api';
import type { Mesa, Reserva, Restaurante } from '../../../types';

const GOLD = '#C9922A';
const BG = '#F5F0EA';

/**
 * Dashboard do Funcionário — tema ReserveAqui
 */
const StaffDashboard = () => {
  const { usuario } = useAuth();

  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [carregandoRestaurante, setCarregandoRestaurante] = useState(false);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [carregandoMesas, setCarregandoMesas] = useState(false);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [carregandoReservas, setCarregandoReservas] = useState(false);
  const [filtroReservas, setFiltroReservas] = useState<'todas' | 'pendente' | 'confirmada' | 'hoje'>('todas');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregandoAcao, setCarregandoAcao] = useState(false);

  useEffect(() => { carregarDados(); }, []);

  const carregarDados = async () => {
    await Promise.all([carregarRestaurante(), carregarMesas(), carregarReservas()]);
  };

  const carregarRestaurante = async () => {
    try {
      setCarregandoRestaurante(true);
      const response = await restaurantesService.meusRestaurantes();
      if (response.results?.length > 0) setRestaurante(response.results[0]);
    } catch { setErro('Erro ao carregar restaurante'); }
    finally { setCarregandoRestaurante(false); }
  };

  const carregarMesas = useCallback(async () => {
    try {
      setCarregandoMesas(true);
      const response = await restaurantesService.meusRestaurantes();
      if (response.results?.length > 0) {
        const mesasResponse = await mesasService.listar({ restaurante: response.results[0].id });
        // Lidar com array direto ou objeto com results
        const mesas = Array.isArray(mesasResponse) ? mesasResponse : (mesasResponse.results || []);
        setMesas(mesas);
      }
    } catch { setErro('Erro ao carregar mesas'); }
    finally { setCarregandoMesas(false); }
  }, []);

  const carregarReservas = useCallback(async () => {
    try {
      setCarregandoReservas(true);
      const response = await restaurantesService.meusRestaurantes();
      if (response.results?.length > 0) {
        const restauranteId = response.results[0].id;
        if (filtroReservas === 'hoje') {
          const r = await reservasService.reservasHoje(restauranteId);
          const reservas = Array.isArray(r) ? r : (r.results || []);
          setReservas(reservas);
        } else {
          const params: any = { restaurante: restauranteId };
          if (filtroReservas !== 'todas') params.status = filtroReservas;
          const r = await reservasService.listar(params);
          const reservas = Array.isArray(r) ? r : (r.results || []);
          setReservas(reservas);
        }
      }
    } catch { setErro('Erro ao carregar reservas'); }
    finally { setCarregandoReservas(false); }
  }, [filtroReservas]);

  useEffect(() => { if (restaurante) carregarReservas(); }, [filtroReservas, restaurante, carregarReservas]);

  const handleAlterarStatusMesa = async (mesa: Mesa) => {
    setErro(''); setSucesso('');
    const novoStatus: 'disponivel' | 'ocupada' = mesa.status === 'disponivel' ? 'ocupada' : 'disponivel';
    try {
      setCarregandoAcao(true);
      await mesasService.atualizar(mesa.id, { status: novoStatus });
      setSucesso(`Mesa ${mesa.numero} marcada como ${novoStatus === 'disponivel' ? 'disponível' : 'ocupada'}`);
      carregarMesas();
      setTimeout(() => setSucesso(''), 3000);
    } catch { setErro('Erro ao alterar status da mesa'); }
    finally { setCarregandoAcao(false); }
  };

  const handleAbrirConfirmacao = (tipo: 'confirmar' | 'cancelar', reserva: Reserva) => {
    if (tipo === 'confirmar') {
      handleConfirmarReservaDirecto(reserva);
    } else {
      handleCancelarReservaDirecto(reserva);
    }
  };

  const handleConfirmarReservaDirecto = async (reserva: Reserva) => {
    try {
      setCarregandoAcao(true);
      await reservasService.confirmar(reserva.id);
      setSucesso('Reserva confirmada!');
      carregarReservas();
      setTimeout(() => setSucesso(''), 3000);
    } catch { setErro('Erro ao confirmar reserva'); }
    finally { setCarregandoAcao(false); }
  };

  const handleCancelarReservaDirecto = async (reserva: Reserva) => {
    try {
      setCarregandoAcao(true);
      await reservasService.cancelar(reserva.id, 'Cancelada pelo funcionário');
      setSucesso('Reserva cancelada!');
      carregarReservas();
      setTimeout(() => setSucesso(''), 3000);
    } catch { setErro('Erro ao cancelar reserva'); }
    finally { setCarregandoAcao(false); }
  };

  const formatarData = (data: string) => new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');

  // ── Badge de status da reserva ──
  const statusStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'confirmada': return { backgroundColor: GOLD, color: '#fff' };
      case 'pendente':   return { backgroundColor: 'transparent', border: '1.5px solid #999', color: '#555' };
      case 'cancelada':  return { backgroundColor: '#e05555', color: '#fff' };
      case 'concluida':  return { backgroundColor: 'transparent', border: '1.5px solid #999', color: '#555' };
      default:           return { backgroundColor: '#ccc', color: '#333' };
    }
  };

  const textoStatus = (status: string) => {
    switch (status) {
      case 'confirmada': return 'Confirmada';
      case 'pendente':   return 'Pendente';
      case 'cancelada':  return 'Cancelada';
      case 'concluida':  return 'Concluída';
      default: return status;
    }
  };

  // Botão de ação da mesa
  const MesaBtn = ({ mesa }: { mesa: Mesa }) => {
    const isOcupada = mesa.status === 'ocupada';
    return (
      <button
        onClick={() => handleAlterarStatusMesa(mesa)}
        disabled={carregandoAcao}
        style={{
          backgroundColor: isOcupada ? GOLD : 'transparent',
          border: `1.5px solid ${isOcupada ? GOLD : '#999'}`,
          color: isOcupada ? '#fff' : '#333',
          borderRadius: 8,
          padding: '6px 16px',
          fontWeight: 700,
          fontSize: '0.85rem',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {isOcupada ? 'Liberar' : 'Ocupar'}
      </button>
    );
  };

  return (
    <div className="w-full flex flex-col min-h-screen" style={{ backgroundColor: BG }}>
      <Header />

      <main className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Título */}
        <div className="mb-8">
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>
            Dashboard do Funcionário
          </h1>
          {restaurante && (
            <p style={{ color: '#666', fontSize: '0.95rem', fontWeight: 500 }}>{restaurante.nome}</p>
          )}
        </div>

        {/* Feedback */}
        {erro && (
          <div style={{ backgroundColor: '#6b1a1a', border: '1px solid #9b2c2c', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>⚠️</span> <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{erro}</span>
            <button onClick={() => setErro('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
          </div>
        )}
        {sucesso && (
          <div style={{ backgroundColor: '#1e4d2b', border: '1px solid #2d7a40', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
            ✅ {sucesso}
          </div>
        )}

        {carregandoRestaurante && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full" style={{ width: 44, height: 44, border: '4px solid #e5d9c8', borderTopColor: GOLD }} />
          </div>
        )}

        {!carregandoRestaurante && !restaurante && (
          <div className="text-center py-24">
            <p style={{ color: '#666', fontSize: '1rem' }}>😔 Você não está atribuído a nenhum restaurante</p>
            <p style={{ color: '#999', fontSize: '0.9rem', marginTop: 4 }}>Entre em contato com o administrador</p>
          </div>
        )}

        {!carregandoRestaurante && restaurante && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* ── COLUNA ESQUERDA: Mesas ── */}
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: GOLD, marginBottom: 16 }}>
                Mesas do restaurante
              </h2>

              {carregandoMesas ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full" style={{ width: 36, height: 36, border: '4px solid #e5d9c8', borderTopColor: GOLD }} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {mesas.map(mesa => {
                    const isOcupada = mesa.status === 'ocupada';
                    return (
                      <div
                        key={mesa.id}
                        style={{
                          backgroundColor: isOcupada ? '#fce8e8' : '#e8f5e9',
                          borderRadius: 10,
                          padding: '14px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: `1px solid ${isOcupada ? '#f5c0c0' : '#c0e0c8'}`,
                        }}
                      >
                        <div>
                          <p style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '0.95rem', marginBottom: 2 }}>
                            Mesa {mesa.numero}
                          </p>
                          <p style={{ color: '#555', fontSize: '0.82rem' }}>
                            {mesa.capacidade} lugares • {isOcupada ? 'Ocupada' : 'Disponível'}
                          </p>
                        </div>
                        <MesaBtn mesa={mesa} />
                      </div>
                    );
                  })}
                  {mesas.length === 0 && (
                    <div className="col-span-2 text-center py-8" style={{ color: '#888' }}>
                      Nenhuma mesa cadastrada
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── COLUNA DIREITA: Reservas ── */}
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>
                Reservas
              </h2>

              {carregandoReservas ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full" style={{ width: 36, height: 36, border: '4px solid #e5d9c8', borderTopColor: GOLD }} />
                </div>
              ) : reservas.length === 0 ? (
                <div className="text-center py-12" style={{ color: '#888' }}>
                  Nenhuma reserva encontrada
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {reservas.map(reserva => (
                    <div
                      key={reserva.id}
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: 10,
                        border: '1px solid #e5ddd5',
                        padding: '14px 18px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                      }}
                    >
                      {/* Cabeçalho: nome + badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <p style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '0.95rem' }}>
                          {reserva.nome_cliente}
                        </p>
                        <span style={{ ...statusStyle(reserva.status), borderRadius: 6, padding: '3px 10px', fontSize: '0.78rem', fontWeight: 700 }}>
                          {textoStatus(reserva.status)}
                        </span>
                      </div>

                      {/* Data + pessoas */}
                      <p style={{ color: '#777', fontSize: '0.82rem', marginBottom: 8 }}>
                        {reserva.data_reserva} às {reserva.horario} • {reserva.quantidade_pessoas} pessoa(s)
                      </p>

                      {/* Botões de ação */}
                      {(reserva.status === 'pendente' || reserva.status === 'confirmada') && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          {reserva.status === 'pendente' && (
                            <button
                              onClick={() => handleAbrirConfirmacao('confirmar', reserva)}
                              style={{ backgroundColor: GOLD, border: 'none', color: '#fff', borderRadius: 7, padding: '6px 16px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                            >
                              Confirmar
                            </button>
                          )}
                          <button
                            onClick={() => handleAbrirConfirmacao('cancelar', reserva)}
                            style={{ backgroundColor: '#e05555', border: 'none', color: '#fff', borderRadius: 7, padding: '6px 16px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default StaffDashboard;