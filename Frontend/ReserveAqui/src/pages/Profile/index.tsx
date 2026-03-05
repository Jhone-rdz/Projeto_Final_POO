import { useAuth } from '../../context';
import { Header, Footer } from '../../components/layout';
import { useEffect, useState, useCallback } from 'react';
import { reservasService, restaurantesService } from '../../services/api';
import type { Reserva, Restaurante } from '../../types';

const GOLD = '#C9922A';
const BG = '#fff';
const BEGE = '#f5f0ea';

/**
 * Página de Perfil — tema ReservaFácil (todos os perfis)
 */
const Profile = () => {
  const { usuario, trocarSenha, atualizarDados } = useAuth();

  const [modoEdicaoDados, setModoEdicaoDados] = useState(false);
  const [formDados, setFormDados] = useState({ nome: usuario?.nome || '', email: usuario?.email || '' });
  const [modalSenha, setModalSenha] = useState(false);
  const [senhaData, setSenhaData] = useState({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [restaurantesMap, setRestaurantesMap] = useState<Record<number, Restaurante>>({});
  const [carregandoReservas, setCarregandoReservas] = useState(false);
  const [modalCancelamento, setModalCancelamento] = useState(false);
  const [reservaCancelamento, setReservaCancelamento] = useState<Reserva | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [modalEdicaoReserva, setModalEdicaoReserva] = useState(false);
  const [reservaEdicao, setReservaEdicao] = useState<Reserva | null>(null);
  const [formReserva, setFormReserva] = useState({ data_reserva: '', horario: '', quantidade_pessoas: '' });
  const [erro, setErro] = useState('');
  const [sucesso, setSuccesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Estilos comuns
  const inputStyle: React.CSSProperties = {
    width: '100%', backgroundColor: BEGE, border: '1px solid #e0d8ce',
    borderRadius: 8, padding: '10px 14px', color: '#1a1a1a',
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = { display: 'block', color: '#1a1a1a', fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 };
  const btnGold: React.CSSProperties = { backgroundColor: GOLD, border: 'none', color: '#fff', borderRadius: 8, padding: '9px 22px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' };
  const btnOutline: React.CSSProperties = { backgroundColor: 'transparent', border: '1.5px solid #ccc', color: '#555', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' };

  const carregarReservas = useCallback(async () => {
    try {
      setCarregandoReservas(true);
      const response = await reservasService.minhasReservas();
      console.log('Resposta de minhasReservas:', response);
      
      // Aceitar tanto formato paginado quanto array direto
      const reservasData = Array.isArray(response) ? response : (response.results || []);
      setReservas(reservasData);
      
      const ids = Array.from(new Set(reservasData.map((r: Reserva) => r.restaurante)));
      const mapa: Record<number, Restaurante> = {};
      for (const id of ids) {
        try { mapa[id as number] = await restaurantesService.obter(id as number); } catch {}
      }
      setRestaurantesMap(mapa);
    } catch (error) { 
      console.error('Erro ao carregar reservas:', error);
      setErro('Erro ao carregar reservas'); 
    }
    finally { setCarregandoReservas(false); }
  }, []);

  useEffect(() => { carregarReservas(); }, [carregarReservas]);

  const handleSalvarDados = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(''); setSuccesso('');
    if (!formDados.nome.trim()) { setErro('Nome é obrigatório'); return; }
    try {
      setCarregando(true);
      await atualizarDados(formDados);
      setSuccesso('Dados atualizados!');
      setModoEdicaoDados(false);
      setTimeout(() => setSuccesso(''), 3000);
    } catch { setErro('Erro ao atualizar dados'); }
    finally { setCarregando(false); }
  };

  const handleMudancaSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(''); setSuccesso('');
    if (!senhaData.senhaAtual) { setErro('Informe a senha atual'); return; }
    if (senhaData.novaSenha.length < 6) { setErro('Senha deve ter mínimo 6 caracteres'); return; }
    if (senhaData.novaSenha !== senhaData.confirmarSenha) { setErro('As senhas não conferem'); return; }
    try {
      setCarregando(true);
      await trocarSenha(senhaData.senhaAtual, senhaData.novaSenha);
      setSuccesso('Senha alterada!');
      setSenhaData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
      setModalSenha(false);
      setTimeout(() => setSuccesso(''), 3000);
    } catch { setErro('Senha atual incorreta'); }
    finally { setCarregando(false); }
  };

  const handleConfirmarCancelamento = async () => {
    if (!reservaCancelamento) return;
    try {
      setCarregando(true);
      await reservasService.cancelar(reservaCancelamento.id, motivoCancelamento);
      setSuccesso('Reserva cancelada!');
      setModalCancelamento(false);
      setReservaCancelamento(null);
      setMotivoCancelamento('');
      carregarReservas();
      setTimeout(() => setSuccesso(''), 3000);
    } catch (error: any) { 
      const mensagemErro = error.response?.data?.error || 'Erro ao cancelar reserva';
      setErro(mensagemErro);
      setModalCancelamento(false);
    }
    finally { setCarregando(false); }
  };

  const handleSalvarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservaEdicao) return;
    try {
      setCarregando(true);
      await reservasService.atualizar(reservaEdicao.id, {
        data_reserva: formReserva.data_reserva,
        horario: formReserva.horario,
        quantidade_pessoas: parseInt(formReserva.quantidade_pessoas),
      });
      setSuccesso('Reserva editada!');
      setModalEdicaoReserva(false);
      carregarReservas();
      setTimeout(() => setSuccesso(''), 3000);
    } catch { setErro('Erro ao editar reserva'); }
    finally { setCarregando(false); }
  };

  const obterNomeRestaurante = (id: number) => restaurantesMap[id]?.nome || `Restaurante #${id}`;
  const formatarData = (data: string) => new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');

  const statusStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'confirmada': case 'ativa': return { backgroundColor: GOLD, color: '#fff' };
      case 'pendente':   return { backgroundColor: 'transparent', border: '1.5px solid #ccc', color: '#888' };
      case 'cancelada':  return { backgroundColor: '#e05555', color: '#fff' };
      case 'concluida':  return { backgroundColor: 'transparent', border: '1.5px solid #ccc', color: '#888' };
      default:           return { backgroundColor: '#eee', color: '#666' };
    }
  };

  const textoStatus = (status: string) => {
    switch (status) {
      case 'confirmada': return 'Ativa';
      case 'pendente':   return 'Pendente';
      case 'cancelada':  return 'Cancelada';
      case 'concluida':  return 'Concluída';
      default: return status;
    }
  };

  return (
    <div className="w-full flex flex-col min-h-screen" style={{ backgroundColor: BG }}>
      <Header />

      <main className="w-full flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Título */}
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a1a1a', marginBottom: 24 }}>Meu perfil</h1>

        {/* Feedback */}
        {erro && (
          <div style={{ backgroundColor: '#6b1a1a', border: '1px solid #9b2c2c', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1 }}>{erro}</span>
            <button onClick={() => setErro('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>✕</button>
          </div>
        )}
        {sucesso && (
          <div style={{ backgroundColor: '#1e4d2b', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
            ✅ {sucesso}
          </div>
        )}

        {/* ── Card: Dados Pessoais ── */}
        <div style={{ backgroundColor: BG, borderRadius: 14, border: '1px solid #e5ddd5', padding: '24px 28px', marginBottom: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>

          {/* Cabeçalho */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a', margin: 0 }}>
              {modoEdicaoDados ? 'Dados Pessoais' : 'Dados pessoais'}
            </h2>
            {modoEdicaoDados ? (
              <button
                onClick={() => { setModoEdicaoDados(false); setFormDados({ nome: usuario?.nome || '', email: usuario?.email || '' }); }}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', fontWeight: 500 }}
              >
                ✏️ Cancelar
              </button>
            ) : (
              <button onClick={() => setModoEdicaoDados(true)} style={btnGold}>
                Editar perfil
              </button>
            )}
          </div>

          {modoEdicaoDados ? (
            /* Modo edição */
            <form onSubmit={handleSalvarDados}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Nome</label>
                <input value={formDados.nome} onChange={e => setFormDados({ ...formDados, nome: e.target.value })} style={inputStyle} disabled={carregando}
                  onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = '#e0d8ce')} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Email</label>
                <input type="email" value={formDados.email} onChange={e => setFormDados({ ...formDados, email: e.target.value })} style={inputStyle} disabled={carregando}
                  onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = '#e0d8ce')} />
              </div>
              <button type="submit" disabled={carregando} style={btnGold}>Salvar</button>
              <div style={{ marginTop: 12 }}>
                <button type="button" onClick={() => setModalSenha(true)} style={btnOutline}>Alterar Senha</button>
              </div>
            </form>
          ) : (
            /* Modo visualização */
            <div>
              <p style={{ color: '#555', fontSize: '0.95rem', marginBottom: 6 }}>
                Nome: <strong style={{ color: '#1a1a1a' }}>{usuario?.nome}</strong>
              </p>
              <p style={{ color: '#555', fontSize: '0.95rem', marginBottom: 16 }}>
                Email: <strong style={{ color: '#1a1a1a' }}>{usuario?.email}</strong>
              </p>
              <button onClick={() => setModalSenha(true)} style={btnOutline}>Alterar senha</button>
            </div>
          )}
        </div>

        {/* ── Card: Minhas Reservas ── */}
        <div style={{ backgroundColor: BG, borderRadius: 14, border: '1px solid #e5ddd5', padding: '24px 28px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a', marginBottom: 18 }}>Minhas reservas</h2>

          {carregandoReservas ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full" style={{ width: 36, height: 36, border: '4px solid #e5d9c8', borderTopColor: GOLD }} />
            </div>
          ) : reservas.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', padding: '32px 0' }}>Nenhuma reserva encontrada</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reservas.map(reserva => (
                <div key={reserva.id} style={{ border: '1px solid #e5ddd5', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '0.95rem', marginBottom: 3 }}>
                      {obterNomeRestaurante(reserva.restaurante)}
                    </p>
                    <p style={{ color: '#888', fontSize: '0.82rem' }}>
                      {reserva.data_reserva} às {reserva.horario} • {reserva.quantidade_pessoas} pessoa(s)
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ ...statusStyle(reserva.status), borderRadius: 7, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700 }}>
                      {textoStatus(reserva.status)}
                    </span>
                    {(reserva.status === 'confirmada' || reserva.status === 'pendente') && (() => {
                      const dataReserva = new Date(reserva.data_reserva + 'T' + reserva.horario);
                      const podeCancel = dataReserva > new Date();
                      return (
                        <button
                          onClick={() => { setReservaCancelamento(reserva); setMotivoCancelamento(''); setModalCancelamento(true); }}
                          disabled={!podeCancel}
                          style={{ backgroundColor: 'transparent', border: '1.5px solid #ccc', color: podeCancel ? '#888' : '#ddd', borderRadius: 7, padding: '4px 12px', fontWeight: 600, fontSize: '0.78rem', cursor: podeCancel ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 4, opacity: podeCancel ? 1 : 0.5 }}
                        >
                          ✕ Cancelar
                        </button>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── MODAL: Alterar Senha ── */}
      {modalSenha && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ backgroundColor: BEGE, borderRadius: 14, padding: '28px 32px', maxWidth: 440, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', position: 'relative' }}>
            {/* Fechar */}
            <button onClick={() => { setModalSenha(false); setSenhaData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' }); setErro(''); }}
              style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#888' }}>✕</button>

            <h2 style={{ fontWeight: 700, fontSize: '1.2rem', color: '#1a1a1a', marginBottom: 20 }}>Alterar Senha</h2>

            <form onSubmit={handleMudancaSenha}>
              {['senhaAtual', 'novaSenha', 'confirmarSenha'].map((campo, i) => {
                const labels = ['Senha Atual', 'Nova Senha', 'Confirmar Nova Senha'];
                return (
                  <div key={campo} style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>{labels[i]}</label>
                    <input
                      type="password"
                      value={senhaData[campo as keyof typeof senhaData]}
                      onChange={e => setSenhaData({ ...senhaData, [campo]: e.target.value })}
                      disabled={carregando}
                      style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = GOLD)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#e0d8ce')}
                    />
                  </div>
                );
              })}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => { setModalSenha(false); setSenhaData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' }); }} style={btnOutline} disabled={carregando}>Cancelar</button>
                <button type="submit" disabled={carregando} style={btnGold}>{carregando ? '...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Cancelar Reserva ── */}
      {modalCancelamento && reservaCancelamento && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: '28px 32px', maxWidth: 440, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a', marginBottom: 8 }}>Cancelar Reserva</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: 18 }}>
              Tem certeza que deseja cancelar a reserva em <strong>{obterNomeRestaurante(reservaCancelamento.restaurante)}</strong> para <strong>{formatarData(reservaCancelamento.data_reserva)}</strong> às <strong>{reservaCancelamento.horario}</strong>?
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Motivo (opcional)</label>
              <input value={motivoCancelamento} onChange={e => setMotivoCancelamento(e.target.value)} style={inputStyle} placeholder="Ex: Compromisso imprevisto" disabled={carregando} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalCancelamento(false)} style={{ ...btnOutline, flex: 1 }} disabled={carregando}>Manter Reserva</button>
              <button onClick={handleConfirmarCancelamento} disabled={carregando} style={{ flex: 1, backgroundColor: '#e05555', border: 'none', color: '#fff', borderRadius: 8, padding: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
                {carregando ? '...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Editar Reserva ── */}
      {modalEdicaoReserva && reservaEdicao && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: '28px 32px', maxWidth: 440, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a', marginBottom: 20 }}>Editar Reserva</h2>
            <form onSubmit={handleSalvarReserva}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Restaurante</label>
                <p style={{ ...inputStyle, margin: 0, color: '#555' }}>{obterNomeRestaurante(reservaEdicao.restaurante)}</p>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Data</label>
                <input type="date" value={formReserva.data_reserva} onChange={e => setFormReserva({ ...formReserva, data_reserva: e.target.value })} style={inputStyle} disabled={carregando} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Horário</label>
                <input type="time" value={formReserva.horario} onChange={e => setFormReserva({ ...formReserva, horario: e.target.value })} style={inputStyle} disabled={carregando} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Quantidade de Pessoas</label>
                <input type="number" min="1" max="20" value={formReserva.quantidade_pessoas} onChange={e => setFormReserva({ ...formReserva, quantidade_pessoas: e.target.value })} style={inputStyle} disabled={carregando} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setModalEdicaoReserva(false)} style={{ ...btnOutline, flex: 1 }}>Cancelar</button>
                <button type="submit" disabled={carregando} style={{ ...btnGold, flex: 1 }}>{carregando ? '...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Profile;