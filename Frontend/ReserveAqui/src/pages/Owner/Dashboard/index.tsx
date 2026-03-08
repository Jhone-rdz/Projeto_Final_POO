import { Header, Footer } from '../../../components/layout';
import { useAuth } from '../../../context';
import { useEffect, useState, useCallback } from 'react';
import { mesasService, reservasService, restaurantesService } from '../../../services/api';
import type { Mesa, Reserva, Restaurante } from '../../../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const GOLD = '#C9922A';
const BEGE = '#f5f0ea';

type Aba = 'mesas' | 'reservas' | 'perfil' | 'funcionarios' | 'relatorios' | 'meu-perfil';

interface Funcionario { id: number; nome: string; email: string; cargo: string; }

const extrairLista = <T,>(r: unknown): T[] => {
  if (Array.isArray(r)) return r;
  if (r && typeof r === 'object' && 'results' in r) return (r as { results: T[] }).results;
  return [];
};

// ── Estilos reutilizáveis ──
const inputStyle: React.CSSProperties = { width: '100%', backgroundColor: BEGE, border: '1px solid #e0d8ce', borderRadius: 8, padding: '10px 14px', color: '#1a1a1a', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', color: '#1a1a1a', fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 };
const btnGold: React.CSSProperties = { backgroundColor: GOLD, border: 'none', color: '#fff', borderRadius: 8, padding: '9px 22px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' };
const btnOutline: React.CSSProperties = { backgroundColor: 'transparent', border: '1.5px solid #ccc', color: '#555', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' };
const cardStyle: React.CSSProperties = { border: '1px solid #e5ddd5', borderRadius: 10, padding: '14px 18px', backgroundColor: '#fff' };
const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const diasAtrasISO = (dias: number) => {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return toISODate(data);
};
const formatarHora = (valor: string | undefined) => (valor ? valor.slice(0, 5) : '--:--');
const abreviarData = (dataISO: string) => {
  const data = new Date(`${dataISO}T00:00:00`);
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

/**
 * Dashboard do Proprietário — tema ReserveAqui (todas as abas em 1 arquivo)
 */
const OwnerDashboard = () => {
  const { usuario, trocarSenha, atualizarDados } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState<Aba>('mesas');

  // ── Restaurante ──
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [formRestaurante, setFormRestaurante] = useState({ nome: '', localizacao: '', descricao: '', horario: '' });

  // ── Mesas ──
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [carregandoMesas, setCarregandoMesas] = useState(false);

  // ── Reservas ──
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [carregandoReservas, setCarregandoReservas] = useState(false);

  // ── Relatórios ──
  const [carregandoRelatorios, setCarregandoRelatorios] = useState(false);
  const [kpisRelatorio, setKpisRelatorio] = useState({
    taxaOcupacaoMedia: 0,
    horarioPico: '--:--',
    reservasMesAtual: 0,
  });
  const [dadosDia, setDadosDia] = useState<Array<{ dia: string; taxa: number }>>([]);
  const [dadosMes, setDadosMes] = useState<Array<{ mes: string; reservas: number }>>([]);

  // ── Funcionários ──
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [modalFuncionario, setModalFuncionario] = useState(false);
  const [formFuncionario, setFormFuncionario] = useState({ nome: '', email: '', cargo: '' });
  const [editandoFuncionario, setEditandoFuncionario] = useState<Funcionario | null>(null);

  // ── Meu Perfil ──
  const [modoEdicaoPerfil, setModoEdicaoPerfil] = useState(false);
  const [formPerfil, setFormPerfil] = useState({ nome: usuario?.nome || '', email: usuario?.email || '', telefone: '' });
  const [modalSenha, setModalSenha] = useState(false);
  const [senhaData, setSenhaData] = useState({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });

  // ── Feedback ──
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregandoAcao, setCarregandoAcao] = useState(false);

  const feedback = (ok: string) => { setSucesso(ok); setTimeout(() => setSucesso(''), 3000); };

  const carregarRestaurante = useCallback(async () => {
    try {
      const r = await restaurantesService.meusRestaurantes();
      const lista = extrairLista<Restaurante>(r);
      if (lista.length > 0) {
        setRestaurante(lista[0]);
        setFormRestaurante({ nome: lista[0].nome || '', localizacao: lista[0].endereco || '', descricao: lista[0].descricao || '', horario: lista[0].horario_funcionamento || '' });
      }
    } catch { setErro('Erro ao carregar restaurante'); }
  }, []);

  const carregarMesas = useCallback(async () => {
    try {
      setCarregandoMesas(true);
      const r = await restaurantesService.meusRestaurantes();
      const lista = extrairLista<Restaurante>(r);
      if (lista.length > 0) {
        const m = await mesasService.listar({ restaurante: lista[0].id });
        setMesas(extrairLista<Mesa>(m));
      }
    } catch { setErro('Erro ao carregar mesas'); }
    finally { setCarregandoMesas(false); }
  }, []);

  const carregarReservas = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setCarregandoReservas(true);
      const r = await restaurantesService.meusRestaurantes();
      const lista = extrairLista<Restaurante>(r);
      if (lista.length > 0) {
        const res = await reservasService.listar({ restaurante: lista[0].id });
        setReservas(extrairLista<Reserva>(res));
      }
    } catch { setErro('Erro ao carregar reservas'); }
    finally { if (!silencioso) setCarregandoReservas(false); }
  }, []);

  // Atualização automática das reservas enquanto a aba está aberta.
  useEffect(() => {
    if (abaAtiva !== 'reservas') return;

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
  }, [abaAtiva, carregarReservas]);

  const carregarFuncionariosMock = () => {
    setFuncionarios([
      { id: 1, nome: 'Fernando Almeida', email: 'fernando@restaurante.com', cargo: 'Garçom' },
      { id: 2, nome: 'Luciana Pereira', email: 'luciana@restaurante.com', cargo: 'Hostess' },
      { id: 3, nome: 'Ricardo Souza', email: 'ricardo@restaurante.com', cargo: 'Gerente' },
    ]);
  };

  // ── Dados iniciais ──
  const carregarTudo = useCallback(async () => {
    await Promise.all([carregarRestaurante(), carregarMesas(), carregarReservas()]);
    carregarFuncionariosMock();
  }, [carregarMesas, carregarReservas, carregarRestaurante]);

  useEffect(() => { carregarTudo(); }, [carregarTudo]);

  const carregarRelatorios = useCallback(async () => {
    if (!restaurante) return;

    try {
      setCarregandoRelatorios(true);

      const hoje = toISODate(new Date());
      const inicioSemana = diasAtrasISO(6);
      const inicioUltimos30Dias = diasAtrasISO(30);

      const [ocupacaoResp, horariosResp, estatisticasResp] = await Promise.all([
        reservasService.ocupacao({
          restaurante_id: restaurante.id,
          data_inicio: inicioSemana,
          data_fim: hoje,
        }),
        reservasService.horariosMovimentados({
          restaurante_id: restaurante.id,
          data_inicio: inicioUltimos30Dias,
          data_fim: hoje,
          top: 6,
        }),
        reservasService.estatisticasPeriodo({
          restaurante_id: restaurante.id,
          data_inicio: inicioUltimos30Dias,
          data_fim: hoje,
          tipo_periodo: 'dia',
        }),
      ]);

      const dadosOcupacao = ocupacaoResp?.dados || [];
      const serieDia = dadosOcupacao.map(item => ({
        dia: abreviarData(item.data),
        taxa: Number(item.percentual_ocupacao),
      }));

      const dadosPorDia = estatisticasResp?.dados || [];
      const serieMes = dadosPorDia.map(item => ({
        mes: item.periodo,
        reservas: item.total_reservas,
      }));

      // Calcular taxa média de ocupação com fallback para taxa de confirmação
      let taxaMedia = 0;
      
      if (dadosOcupacao.length > 0) {
        const ocupacaoValida = dadosOcupacao.filter(item => Number(item.percentual_ocupacao) > 0);
        if (ocupacaoValida.length > 0) {
          taxaMedia = ocupacaoValida.reduce((acc, item) => acc + Number(item.percentual_ocupacao), 0) / ocupacaoValida.length;
        }
      }
      
      // Fallback: usar taxa de confirmação se ocupação não disponível
      if (taxaMedia === 0 && dadosPorDia.length > 0) {
        const totalReservas = dadosPorDia.reduce((acc, item) => acc + item.total_reservas, 0);
        const totalConfirmadas = dadosPorDia.reduce((acc, item) => acc + item.reservas_confirmadas, 0);
        if (totalReservas > 0) {
          taxaMedia = (totalConfirmadas / totalReservas) * 100;
        }
      }

      const horarioPico = formatarHora(horariosResp?.dados?.[0]?.horario);
      
      // Total de reservas dos últimos 30 dias
      const reservasMesAtual = dadosPorDia.reduce((acc, item) => acc + item.total_reservas, 0);

      setKpisRelatorio({
        taxaOcupacaoMedia: Math.round(taxaMedia),
        horarioPico,
        reservasMesAtual,
      });
      setDadosDia(serieDia);
      setDadosMes(serieMes);
    } catch {
      setErro('Erro ao carregar relatórios');
    } finally {
      setCarregandoRelatorios(false);
    }
  }, [restaurante]);

  useEffect(() => {
    if (abaAtiva !== 'relatorios' || !restaurante) return;

    const atualizar = () => {
      if (document.visibilityState === 'visible') {
        carregarRelatorios();
      }
    };

    atualizar();
    const intervalId = window.setInterval(atualizar, 15000);
    window.addEventListener('focus', atualizar);
    document.addEventListener('visibilitychange', atualizar);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', atualizar);
      document.removeEventListener('visibilitychange', atualizar);
    };
  }, [abaAtiva, restaurante, carregarRelatorios]);



  // ── Mesas: ações ──
  const handleStatusMesa = async (mesa: Mesa) => {
    try {
      setCarregandoAcao(true);
      const novo: 'disponivel' | 'ocupada' = mesa.status === 'disponivel' ? 'ocupada' : 'disponivel';
      await mesasService.atualizar(mesa.id, { status: novo });
      carregarMesas();
      feedback(`Mesa ${mesa.numero} marcada como ${novo}`);
    } catch { setErro('Erro ao alterar status'); }
    finally { setCarregandoAcao(false); }
  };

  const handleRemoverMesa = async (mesa: Mesa) => {
    try {
      setCarregandoAcao(true);
      await mesasService.deletar(mesa.id);
      carregarMesas();
      feedback('Mesa removida!');
    } catch { setErro('Erro ao remover mesa'); }
    finally { setCarregandoAcao(false); }
  };

  const handleAdicionarMesa = async () => {
    if (!restaurante) return;
    try {
      setCarregandoAcao(true);
      const proximoNumero = mesas.length > 0 ? Math.max(...mesas.map(m => m.numero)) + 1 : 1;
      await mesasService.criar({ restaurante: restaurante.id, numero: proximoNumero });
      carregarMesas();
      feedback('Mesa adicionada!');
    } catch { setErro('Erro ao adicionar mesa'); }
    finally { setCarregandoAcao(false); }
  };

  // ── Reservas: ações ──
  const handleConfirmarReserva = async (reserva: Reserva) => {
    try {
      setCarregandoAcao(true);
      await reservasService.confirmar(reserva.id);
      carregarReservas();
      feedback('Reserva confirmada!');
    } catch { setErro('Erro ao confirmar'); }
    finally { setCarregandoAcao(false); }
  };

  const handleCancelarReserva = async (reserva: Reserva) => {
    try {
      setCarregandoAcao(true);
      await reservasService.cancelar(reserva.id, 'Cancelada pelo proprietário');
      carregarReservas();
      feedback('Reserva cancelada!');
    } catch { setErro('Erro ao cancelar'); }
    finally { setCarregandoAcao(false); }
  };

  const handleConcluirReserva = async (reserva: Reserva) => {
    try {
      setCarregandoAcao(true);
      await reservasService.concluir(reserva.id);
      carregarReservas();
      feedback('Reserva concluída!');
    } catch { setErro('Erro ao concluir'); }
    finally { setCarregandoAcao(false); }
  };

  // ── Perfil: ações ──
  const handleSalvarRestaurante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurante) return;
    try {
      setCarregandoAcao(true);
      await restaurantesService.atualizar(restaurante.id, {
        nome: formRestaurante.nome,
        endereco: formRestaurante.localizacao,
        descricao: formRestaurante.descricao,
        horario_funcionamento: formRestaurante.horario || ''
      });
      await carregarRestaurante();
      feedback('Restaurante atualizado!');
    } catch { setErro('Erro ao salvar restaurante'); }
    finally { setCarregandoAcao(false); }
  };

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCarregandoAcao(true);
      await atualizarDados({
        nome: formPerfil.nome,
        email: formPerfil.email
      });
      setModoEdicaoPerfil(false);
      feedback('Perfil atualizado!');
    } catch { setErro('Erro ao salvar perfil'); }
    finally { setCarregandoAcao(false); }
  };

  const handleSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (senhaData.novaSenha !== senhaData.confirmarSenha) { setErro('Senhas não conferem'); return; }
    try {
      setCarregandoAcao(true);
      await trocarSenha(senhaData.senhaAtual, senhaData.novaSenha);
      setModalSenha(false);
      setSenhaData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
      feedback('Senha alterada!');
    } catch { setErro('Senha atual incorreta'); }
    finally { setCarregandoAcao(false); }
  };

  // ── Status badge ──
  const statusStyle = (s: string): React.CSSProperties => {
    switch (s) {
      case 'confirmada': return { backgroundColor: GOLD, color: '#fff' };
      case 'ativa':      return { backgroundColor: GOLD, color: '#fff' };
      case 'pendente':   return { backgroundColor: 'transparent', border: '1.5px solid #ccc', color: '#666' };
      case 'cancelada':  return { backgroundColor: '#e05555', color: '#fff' };
      case 'concluida':  return { backgroundColor: 'transparent', border: '1.5px solid #ccc', color: '#666' };
      default:           return { backgroundColor: '#eee', color: '#555' };
    }
  };
  const textoStatus = (s: string) => ({ confirmada: 'Confirmada', ativa: 'Ativa', pendente: 'Pendente', cancelada: 'Cancelada', concluida: 'Concluída' }[s] || s);

  // ── Abas ──
  const abas: { key: Aba; label: string; emoji: string }[] = [
    { key: 'mesas', label: 'Mesas', emoji: '🪑' },
    { key: 'reservas', label: 'Reservas', emoji: '📅' },
    { key: 'perfil', label: 'Perfil', emoji: '🏠' },
    { key: 'funcionarios', label: 'Funcionários', emoji: '👥' },
    { key: 'relatorios', label: 'Relatórios', emoji: '📊' },
    { key: 'meu-perfil', label: 'Meu Perfil', emoji: '👤' },
  ];

  return (
    <div className="w-full flex flex-col min-h-screen" style={{ backgroundColor: '#fff' }}>
      <Header />

      <main className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Título */}
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>Dashboard do Proprietário</h1>
        {restaurante && <p style={{ color: '#888', fontSize: '0.95rem', marginBottom: 24 }}>{restaurante.nome}</p>}

        {/* Feedback */}
        {erro && (
          <div style={{ backgroundColor: '#6b1a1a', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#fff', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem' }}>{erro}</span>
            <button onClick={() => setErro('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>✕</button>
          </div>
        )}
        {sucesso && <div style={{ backgroundColor: '#1e4d2b', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>✅ {sucesso}</div>}

        {/* ── Tab bar ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, border: '1px solid #e0d8ce', borderRadius: 10, padding: '6px 10px', marginBottom: 28, backgroundColor: '#faf8f5', width: 'fit-content' }}>
          {abas.map(a => (
            <button
              key={a.key}
              onClick={() => setAbaAtiva(a.key)}
              style={{
                backgroundColor: abaAtiva === a.key ? '#fff' : 'transparent',
                border: abaAtiva === a.key ? '1px solid #e0d8ce' : 'none',
                borderRadius: 7, padding: '6px 14px', fontWeight: abaAtiva === a.key ? 700 : 500,
                fontSize: '0.88rem', color: '#1a1a1a', cursor: 'pointer',
                boxShadow: abaAtiva === a.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {a.emoji} {a.label}
            </button>
          ))}
        </div>

        {/* ═══════════════ ABA: MESAS ═══════════════ */}
        {abaAtiva === 'mesas' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a' }}>Gestão de mesas</h2>
              <button onClick={handleAdicionarMesa} disabled={carregandoAcao} style={{ ...btnGold, display: 'flex', alignItems: 'center', gap: 6 }}>
                + Adicionar mesa
              </button>
            </div>

            {carregandoMesas ? (
              <div className="flex justify-center py-10"><div className="animate-spin rounded-full" style={{ width: 36, height: 36, border: '4px solid #e5d9c8', borderTopColor: GOLD }} /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {mesas.map(mesa => {
                  const isOcupada = mesa.status === 'ocupada';
                  return (
                    <div key={mesa.id} style={{ ...cardStyle, backgroundColor: isOcupada ? '#fce8e8' : '#e8f5e9', border: `1px solid ${isOcupada ? '#f5c0c0' : '#c0e0c8'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '0.95rem', marginBottom: 2 }}>Mesa {mesa.numero}</p>
                        <p style={{ color: '#555', fontSize: '0.82rem' }}>{mesa.capacidade} lugares • {isOcupada ? 'Ocupada' : 'Disponível'}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => handleStatusMesa(mesa)} disabled={carregandoAcao} style={{ backgroundColor: isOcupada ? GOLD : 'transparent', border: `1.5px solid ${isOcupada ? GOLD : '#999'}`, color: isOcupada ? '#fff' : '#333', borderRadius: 7, padding: '5px 14px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                          {isOcupada ? 'Liberar' : 'Ocupar'}
                        </button>
                        <button onClick={() => handleRemoverMesa(mesa)} disabled={carregandoAcao} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e05555', fontSize: '1rem', padding: 4 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e05555" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
                {mesas.length === 0 && <p className="col-span-3 text-center py-10" style={{ color: '#888' }}>Nenhuma mesa cadastrada</p>}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ ABA: RESERVAS ═══════════════ */}
        {abaAtiva === 'reservas' && (
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a', marginBottom: 20 }}>Gestão de reservas</h2>
            {carregandoReservas ? (
              <div className="flex justify-center py-10"><div className="animate-spin rounded-full" style={{ width: 36, height: 36, border: '4px solid #e5d9c8', borderTopColor: GOLD }} /></div>
            ) : reservas.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '32px 0' }}>Nenhuma reserva encontrada</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reservas.map(r => (
                  <div key={r.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '0.95rem', marginBottom: 3 }}>{r.nome_cliente}</p>
                      <p style={{ color: '#888', fontSize: '0.82rem' }}>{r.data_reserva} às {r.horario} • {r.quantidade_pessoas} pessoa(s)</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {r.status === 'pendente' && (
                        <button onClick={() => handleConfirmarReserva(r)} disabled={carregandoAcao} style={{ ...btnGold, padding: '5px 14px', fontSize: '0.82rem' }}>Confirmar</button>
                      )}
                      {r.status === 'confirmada' && (
                        <button onClick={() => handleConcluirReserva(r)} disabled={carregandoAcao} style={{ backgroundColor: '#3f3f46', border: 'none', color: '#fff', borderRadius: 7, padding: '5px 14px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>Concluir</button>
                      )}
                      {(r.status === 'pendente' || r.status === 'confirmada') && (
                        <button onClick={() => handleCancelarReserva(r)} disabled={carregandoAcao} style={{ backgroundColor: '#e05555', border: 'none', color: '#fff', borderRadius: 7, padding: '5px 14px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>Cancelar</button>
                      )}
                      <span style={{ ...statusStyle(r.status), borderRadius: 7, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700 }}>{textoStatus(r.status)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ ABA: PERFIL DO RESTAURANTE ═══════════════ */}
        {abaAtiva === 'perfil' && (
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a', marginBottom: 24 }}>Informações do restaurante</h2>
            <form onSubmit={handleSalvarRestaurante}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label style={labelStyle}>Nome</label>
                  <input value={formRestaurante.nome} onChange={e => setFormRestaurante({ ...formRestaurante, nome: e.target.value })} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = '#e0d8ce')} />
                </div>
                <div>
                  <label style={labelStyle}>Localização</label>
                  <input value={formRestaurante.localizacao} onChange={e => setFormRestaurante({ ...formRestaurante, localizacao: e.target.value })} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = '#e0d8ce')} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Descrição</label>
                <input value={formRestaurante.descricao} onChange={e => setFormRestaurante({ ...formRestaurante, descricao: e.target.value })} style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = '#e0d8ce')} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Horário</label>
                <input value={formRestaurante.horario} onChange={e => setFormRestaurante({ ...formRestaurante, horario: e.target.value })} style={{ ...inputStyle, maxWidth: 320 }}
                  onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = '#e0d8ce')} placeholder="11:00 - 23:00" />
              </div>
              <button type="submit" disabled={carregandoAcao} style={btnGold}>Salvar alterações</button>
            </form>
          </div>
        )}

        {/* ═══════════════ ABA: FUNCIONÁRIOS ═══════════════ */}
        {abaAtiva === 'funcionarios' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a' }}>Funcionários</h2>
              <button onClick={() => { setEditandoFuncionario(null); setFormFuncionario({ nome: '', email: '', cargo: '' }); setModalFuncionario(true); }} style={{ ...btnGold, display: 'flex', alignItems: 'center', gap: 6 }}>
                + Cadastrar
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {funcionarios.map(f => (
                <div key={f.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '0.95rem', marginBottom: 2 }}>{f.nome}</p>
                    <p style={{ color: '#888', fontSize: '0.82rem' }}>{f.email} • {f.cargo}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => { setEditandoFuncionario(f); setFormFuncionario({ nome: f.nome, email: f.email, cargo: f.cargo }); setModalFuncionario(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                    <button onClick={() => setFuncionarios(prev => prev.filter(x => x.id !== f.id))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e05555" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                    </button>
                  </div>
                </div>
              ))}
              {funcionarios.length === 0 && <p style={{ color: '#888', textAlign: 'center', padding: '32px 0' }}>Nenhum funcionário cadastrado</p>}
            </div>
          </div>
        )}

        {/* ═══════════════ ABA: RELATÓRIOS ═══════════════ */}
        {abaAtiva === 'relatorios' && (
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a', marginBottom: 24 }}>Relatórios e Métricas</h2>

            {carregandoRelatorios ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full" style={{ width: 36, height: 36, border: '4px solid #e5d9c8', borderTopColor: GOLD }} />
              </div>
            ) : (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {[
                    { valor: `${kpisRelatorio.taxaOcupacaoMedia}%`, label: 'Taxa Média de Ocupação' },
                    { valor: kpisRelatorio.horarioPico, label: 'Horário de Pico' },
                    { valor: String(kpisRelatorio.reservasMesAtual), label: 'Reservas no Mês Atual' },
                  ].map(k => (
                    <div key={k.label} style={{ ...cardStyle, textAlign: 'center', padding: '24px 16px' }}>
                      <p style={{ color: GOLD, fontSize: '2.2rem', fontWeight: 700, marginBottom: 6 }}>{k.valor}</p>
                      <p style={{ color: '#666', fontSize: '0.9rem' }}>{k.label}</p>
                    </div>
                  ))}
                </div>

                {/* Gráficos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div style={{ ...cardStyle, padding: '20px 24px' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#555', marginBottom: 16 }}>Taxa de Ocupação por Dia</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={dadosDia}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
                        <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5ddd5' }} />
                        <Bar dataKey="taxa" fill={GOLD} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ ...cardStyle, padding: '20px 24px' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#555', marginBottom: 16 }}>Reservas por Mês</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={dadosMes}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
                        <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5ddd5' }} />
                        <Line type="monotone" dataKey="reservas" stroke={GOLD} strokeWidth={2.5} dot={{ fill: GOLD, r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {dadosDia.length === 0 && dadosMes.length === 0 && (
                  <p style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>
                    Ainda não há dados suficientes para montar os gráficos.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══════════════ ABA: MEU PERFIL ═══════════════ */}
        {abaAtiva === 'meu-perfil' && (
          <div className="flex justify-center">
            <div style={{ ...cardStyle, maxWidth: 540, width: '100%', padding: '28px 32px' }}>
              {/* Header do card */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a' }}>
                  {modoEdicaoPerfil ? 'Dados Pessoais' : 'Dados pessoais'}
                </h2>
                {modoEdicaoPerfil ? (
                  <button onClick={() => setModoEdicaoPerfil(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', fontWeight: 500 }}>
                    ✏️ Cancelar
                  </button>
                ) : (
                  <button onClick={() => setModoEdicaoPerfil(true)} style={btnGold}>Editar perfil</button>
                )}
              </div>

              {modoEdicaoPerfil ? (
                <form onSubmit={handleSalvarPerfil}>
                  {[{ key: 'nome', label: 'Nome', type: 'text' }, { key: 'email', label: 'Email', type: 'email' }, { key: 'telefone', label: 'Telefone', type: 'text' }].map(f => (
                    <div key={f.key} style={{ marginBottom: 14 }}>
                      <label style={labelStyle}>{f.label}</label>
                      <input type={f.type} value={formPerfil[f.key as keyof typeof formPerfil]} onChange={e => setFormPerfil({ ...formPerfil, [f.key]: e.target.value })} style={inputStyle}
                        onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = '#e0d8ce')} />
                    </div>
                  ))}
                  <button type="submit" disabled={carregandoAcao} style={{ ...btnGold, marginBottom: 12 }}>Salvar</button>
                  <div><button type="button" onClick={() => setModalSenha(true)} style={btnOutline}>Alterar Senha</button></div>
                </form>
              ) : (
                <div>
                  {[{ l: 'Nome', v: usuario?.nome }, { l: 'Email', v: usuario?.email }, { l: 'Telefone', v: formPerfil.telefone || '(88) 91234-5678' }].map(i => (
                    <p key={i.l} style={{ color: '#888', fontSize: '0.95rem', marginBottom: 8 }}>
                      {i.l}: <strong style={{ color: '#1a1a1a' }}>{i.v}</strong>
                    </p>
                  ))}
                  <button onClick={() => setModalSenha(true)} style={{ ...btnOutline, marginTop: 8 }}>Alterar senha</button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>



      {/* ══ MODAL: Funcionário ══ */}
      {modalFuncionario && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ backgroundColor: BEGE, borderRadius: 14, padding: '28px 32px', maxWidth: 440, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button onClick={() => setModalFuncionario(false)} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#888' }}>✕</button>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a', marginBottom: 20 }}>{editandoFuncionario ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
            {[{ key: 'nome', label: 'Nome', type: 'text' }, { key: 'email', label: 'Email', type: 'email' }, { key: 'cargo', label: 'Cargo', type: 'text' }].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={labelStyle}>{f.label}</label>
                <input type={f.type} value={formFuncionario[f.key as keyof typeof formFuncionario]} onChange={e => setFormFuncionario({ ...formFuncionario, [f.key]: e.target.value })} style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = '#e0d8ce')} autoFocus={f.key === 'nome'} />
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button onClick={() => setModalFuncionario(false)} style={btnOutline}>Cancelar</button>
              <button onClick={() => {
                if (editandoFuncionario) {
                  setFuncionarios(prev => prev.map(f => f.id === editandoFuncionario.id ? { ...f, ...formFuncionario } : f));
                } else {
                  setFuncionarios(prev => [...prev, { id: Date.now(), ...formFuncionario }]);
                }
                setModalFuncionario(false);
                feedback(editandoFuncionario ? 'Funcionário atualizado!' : 'Funcionário cadastrado!');
              }} style={btnGold}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Alterar Senha ══ */}
      {modalSenha && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ backgroundColor: BEGE, borderRadius: 14, padding: '28px 32px', maxWidth: 440, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button onClick={() => { setModalSenha(false); setSenhaData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' }); }} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#888' }}>✕</button>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a', marginBottom: 20 }}>Alterar Senha</h2>
            <form onSubmit={handleSenha}>
              {[{ key: 'senhaAtual', label: 'Senha Atual' }, { key: 'novaSenha', label: 'Nova Senha' }, { key: 'confirmarSenha', label: 'Confirmar Nova Senha' }].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>{f.label}</label>
                  <input type="password" value={senhaData[f.key as keyof typeof senhaData]} onChange={e => setSenhaData({ ...senhaData, [f.key]: e.target.value })} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = '#e0d8ce')} />
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => { setModalSenha(false); setSenhaData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' }); }} style={btnOutline}>Cancelar</button>
                <button type="submit" disabled={carregandoAcao} style={btnGold}>{carregandoAcao ? '...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default OwnerDashboard;