import { Header, Footer } from '../../../components/layout';
import { useEffect, useState, useCallback } from 'react';
import { mesasService, reservasService, restaurantesService } from '../../../services/api';
import type { Mesa, Reserva, Restaurante } from '../../../types';

const GOLD = '#C9922A';
const BG = '#F5F0EA';

const extrairLista = <T,>(r: unknown): T[] => {
  if (Array.isArray(r)) return r;
  if (r && typeof r === 'object' && 'results' in r) return (r as { results: T[] }).results;
  return [];
};

const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const diasAtrasISO = (dias: number) => {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return toISODate(data);
};
const formatarHora = (valor: string | undefined) => (valor ? valor.slice(0, 5) : '--:--');

/**
 * Dashboard do Funcionário — tema ReserveAqui
 */
const StaffDashboard = () => {
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [carregandoRestaurante, setCarregandoRestaurante] = useState(false);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [carregandoMesas, setCarregandoMesas] = useState(false);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [carregandoReservas, setCarregandoReservas] = useState(false);
  const [carregandoRelatorios, setCarregandoRelatorios] = useState(false);
  const [resumoRelatorio, setResumoRelatorio] = useState({
    reservasHoje: 0,
    confirmadasHoje: 0,
    pendentesHoje: 0,
    ocupacaoHoje: 0,
  });
  const [horariosPico, setHorariosPico] = useState<Array<{ horario: string; total: number; taxa: string }>>([]);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregandoAcao, setCarregandoAcao] = useState(false);

  const carregarRestaurante = useCallback(async () => {
    try {
      setCarregandoRestaurante(true);
      const response = await restaurantesService.meusRestaurantes();
      const lista = extrairLista<Restaurante>(response);
      if (lista.length > 0) setRestaurante(lista[0]);
    } catch { setErro('Erro ao carregar restaurante'); }
    finally { setCarregandoRestaurante(false); }
  }, []);

  const carregarMesas = useCallback(async () => {
    try {
      setCarregandoMesas(true);
      const response = await restaurantesService.meusRestaurantes();
      const lista = extrairLista<Restaurante>(response);
      if (lista.length > 0) {
        const mesasResponse = await mesasService.listar({ restaurante: lista[0].id });
        const mesas = extrairLista<Mesa>(mesasResponse);
        setMesas(mesas);
      }
    } catch { setErro('Erro ao carregar mesas'); }
    finally { setCarregandoMesas(false); }
  }, []);

  const carregarReservas = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setCarregandoReservas(true);
      const response = await restaurantesService.meusRestaurantes();
      const lista = extrairLista<Restaurante>(response);
      if (lista.length > 0) {
        const restauranteId = lista[0].id;
        const r = await reservasService.listar({ restaurante: restauranteId });
        const reservas = extrairLista<Reserva>(r);
        setReservas(reservas);
      }
    } catch { setErro('Erro ao carregar reservas'); }
    finally { if (!silencioso) setCarregandoReservas(false); }
  }, []);

  const carregarDados = useCallback(async () => {
    await Promise.all([carregarRestaurante(), carregarMesas(), carregarReservas()]);
  }, [carregarRestaurante, carregarMesas, carregarReservas]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const carregarRelatorios = useCallback(async (silencioso = false) => {
    if (!restaurante) return;

    try {
      if (!silencioso) setCarregandoRelatorios(true);

      const hoje = toISODate(new Date());
      const inicioSemana = diasAtrasISO(7);

      const [reservasHojeResp, ocupacaoResp, horariosResp] = await Promise.all([
        reservasService.reservasHoje(restaurante.id),
        reservasService.ocupacao({
          restaurante_id: restaurante.id,
          data_inicio: hoje,
          data_fim: hoje,
        }),
        reservasService.horariosMovimentados({
          restaurante_id: restaurante.id,
          data_inicio: inicioSemana,
          data_fim: hoje,
          top: 5,
        }),
      ]);

      const reservasHoje = extrairLista<Reserva>(reservasHojeResp);
      const confirmadasHoje = reservasHoje.filter(r => r.status === 'confirmada').length;
      const pendentesHoje = reservasHoje.filter(r => r.status === 'pendente').length;
      const ocupacaoHoje = Math.round(Number(ocupacaoResp?.dados?.[0]?.percentual_ocupacao || 0));

      setResumoRelatorio({
        reservasHoje: reservasHoje.length,
        confirmadasHoje,
        pendentesHoje,
        ocupacaoHoje,
      });

      setHorariosPico((horariosResp?.dados || []).map(item => ({
        horario: formatarHora(item.horario),
        total: item.total_reservas,
        taxa: `${Math.round(Number(item.taxa_confirmacao))}%`,
      })));
    } catch {
      if (!silencioso) setErro('Erro ao carregar relatório operacional');
    } finally {
      if (!silencioso) setCarregandoRelatorios(false);
    }
  }, [restaurante]);

  useEffect(() => { if (restaurante) carregarReservas(); }, [restaurante, carregarReservas]);

  // Atualização automática das reservas em segundo plano.
  useEffect(() => {
    if (!restaurante) return;

    const atualizar = () => {
      if (document.visibilityState === 'visible') {
        carregarReservas(true);
      }
    };

    atualizar();
    const intervalId = window.setInterval(atualizar, 10000);
    window.addEventListener('focus', atualizar);
    document.addEventListener('visibilitychange', atualizar);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', atualizar);
      document.removeEventListener('visibilitychange', atualizar);
    };
  }, [restaurante, carregarReservas]);

  // Atualização automática dos relatórios operacionais.
  useEffect(() => {
    if (!restaurante) return;

    const atualizar = () => {
      if (document.visibilityState === 'visible') {
        carregarRelatorios(true);
      }
    };

    carregarRelatorios();
    const intervalId = window.setInterval(atualizar, 20000);
    window.addEventListener('focus', atualizar);
    document.addEventListener('visibilitychange', atualizar);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', atualizar);
      document.removeEventListener('visibilitychange', atualizar);
    };
  }, [restaurante, carregarRelatorios]);

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

  const handleAbrirConfirmacao = (tipo: 'confirmar' | 'concluir' | 'cancelar', reserva: Reserva) => {
    if (tipo === 'confirmar') {
      handleConfirmarReservaDirecto(reserva);
    } else if (tipo === 'concluir') {
      handleConcluirReservaDirecto(reserva);
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

  const handleConcluirReservaDirecto = async (reserva: Reserva) => {
    try {
      setCarregandoAcao(true);
      await reservasService.concluir(reserva.id);
      setSucesso('Reserva concluída!');
      carregarReservas();
      setTimeout(() => setSucesso(''), 3000);
    } catch { setErro('Erro ao concluir reserva'); }
    finally { setCarregandoAcao(false); }
  };

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
          <>
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
                          {reserva.status === 'confirmada' && (
                            <button
                              onClick={() => handleAbrirConfirmacao('concluir', reserva)}
                              style={{ backgroundColor: '#3f3f46', border: 'none', color: '#fff', borderRadius: 7, padding: '6px 16px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                            >
                              Concluir
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

          <div style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>
              Relatório Operacional
            </h2>

            {carregandoRelatorios ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full" style={{ width: 32, height: 32, border: '4px solid #e5d9c8', borderTopColor: GOLD }} />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3" style={{ marginBottom: 12 }}>
                  {[
                    { label: 'Reservas Hoje', valor: resumoRelatorio.reservasHoje },
                    { label: 'Confirmadas Hoje', valor: resumoRelatorio.confirmadasHoje },
                    { label: 'Pendentes Hoje', valor: resumoRelatorio.pendentesHoje },
                    { label: 'Ocupação Hoje', valor: `${resumoRelatorio.ocupacaoHoje}%` },
                  ].map(item => (
                    <div key={item.label} style={{ backgroundColor: '#fff', border: '1px solid #e5ddd5', borderRadius: 10, padding: '14px 16px' }}>
                      <p style={{ color: GOLD, fontWeight: 700, fontSize: '1.45rem', lineHeight: 1, marginBottom: 6 }}>{item.valor}</p>
                      <p style={{ color: '#666', fontSize: '0.82rem' }}>{item.label}</p>
                    </div>
                  ))}
                </div>

                <div style={{ backgroundColor: '#fff', border: '1px solid #e5ddd5', borderRadius: 10, padding: '14px 16px' }}>
                  <p style={{ fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>Horários mais movimentados (7 dias)</p>
                  {horariosPico.length === 0 ? (
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Sem dados suficientes no período.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {horariosPico.map(item => (
                        <div key={item.horario} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f0e9df', borderRadius: 8, padding: '8px 10px' }}>
                          <span style={{ fontWeight: 700, color: '#333' }}>{item.horario}</span>
                          <span style={{ color: '#666', fontSize: '0.84rem' }}>{item.total} reserva(s)</span>
                          <span style={{ color: GOLD, fontWeight: 700, fontSize: '0.84rem' }}>{item.taxa} conf.</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default StaffDashboard;