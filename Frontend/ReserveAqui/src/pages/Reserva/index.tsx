import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header, Footer } from '../../components/layout';
import { reservasService, restaurantesService, mesasService } from '../../services/api';
import type { Restaurante } from '../../types';
import { useAuth } from '../../context';

const GOLD = '#C9922A';

/**
 * Página de Realização de Reserva — tema ReserveAqui
 */
const Reserva = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario, isAuthenticated } = useAuth();

  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [mesasDisponibilidade, setMesasDisponibilidade] = useState<{ disponivel: boolean; mesas_necessarias: number; mensagem?: string } | null>(null);
  const [carregandoRestaurante, setCarregandoRestaurante] = useState(true);
  const [carregandoReserva, setCarregandoReserva] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSuccesso] = useState(false);
  const [sucessoMsg, setSucessoMsg] = useState('');

  const [formData, setFormData] = useState({
    quantidadePessoas: '',
    data: '',
    horario: '',
  });

  // Horários disponíveis para o select
  const horarios = [
    '11:00','11:30','12:00','12:30','13:00','13:30',
    '14:00','18:00','18:30','19:00','19:30','20:00',
    '20:30','21:00','21:30','22:00',
  ];

  useEffect(() => {
    if (id) carregarRestaurante();
  }, [id]);

  useEffect(() => {
    if (restaurante && formData.data && formData.horario && formData.quantidadePessoas) {
      validarDisponibilidade();
    } else {
      setMesasDisponibilidade(null);
    }
  }, [restaurante, formData.quantidadePessoas, formData.data, formData.horario]);

  useEffect(() => {
    if (!restaurante || !formData.data || !formData.horario || !formData.quantidadePessoas) return;

    const atualizar = () => {
      if (document.visibilityState === 'visible') {
        validarDisponibilidade();
      }
    };

    const intervalId = window.setInterval(atualizar, 10000);
    window.addEventListener('focus', atualizar);
    document.addEventListener('visibilitychange', atualizar);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', atualizar);
      document.removeEventListener('visibilitychange', atualizar);
    };
  }, [restaurante, formData.data, formData.horario, formData.quantidadePessoas]);

  const carregarRestaurante = async () => {
    try {
      setCarregandoRestaurante(true);
      setErro('');
      const restauranteData = await restaurantesService.obter(Number(id));
      setRestaurante(restauranteData);
      await mesasService.listar({ restaurante: Number(id), ativa: true });
    } catch {
      setErro('Não foi possível carregar os detalhes do restaurante.');
    } finally {
      setCarregandoRestaurante(false);
    }
  };

  const validarDisponibilidade = async () => {
    try {
      const disponibilidade = await mesasService.verificarDisponibilidade(
        Number(id), formData.data, formData.horario, Number(formData.quantidadePessoas)
      );
      setMesasDisponibilidade(disponibilidade);
    } catch (err: any) {
      console.error('Erro ao verificar disponibilidade:', err.response?.data || err.message);
      setMesasDisponibilidade(null);
    }
  };

  const handleReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSuccesso(false);

    if (!formData.quantidadePessoas || !formData.data || !formData.horario) {
      setErro('Preencher todos os campos');
      return;
    }
    if (!mesasDisponibilidade?.disponivel) {
      setErro('Nenhuma mesa disponível para este horário');
      return;
    }

    // Validar data: deve ser futura (hoje ou depois)
    const hoje = new Date();
    const dataReservaStr = formData.data; // formato YYYY-MM-DD
    const hojeStr = hoje.getFullYear().toString().padStart(4, '0') + 
                    '-' + (hoje.getMonth() + 1).toString().padStart(2, '0') + 
                    '-' + hoje.getDate().toString().padStart(2, '0');
    
    if (dataReservaStr < hojeStr) {
      setErro('Selecione uma data futura');
      return;
    }

    try {
      setCarregandoReserva(true);
      await reservasService.criar({
        restaurante: Number(id),
        data_reserva: formData.data,
        horario: formData.horario,
        quantidade_pessoas: Number(formData.quantidadePessoas),
        nome_cliente: usuario?.nome || '',
        telefone_cliente: '11999999999',
        email_cliente: usuario?.email || '',
        observacoes: '',
      });
      setSuccesso(true);
      setSucessoMsg(`Suas reserva no ${restaurante?.nome} foi confirmada`);
      setTimeout(() => navigate('/profile'), 2500);
    } catch {
      setErro('Erro ao processar sua reserva. Tente novamente.');
    } finally {
      setCarregandoReserva(false);
    }
  };

  // ── Shell com fundo de restaurante ──
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="w-full flex flex-col min-h-screen" style={{ position: 'relative' }}>
      {/* Fundo com imagem */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80')",
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}
      />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, backgroundColor: 'rgba(255,235,200,0.55)' }} />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {children}
        </main>
        <Footer />
      </div>

      {/* Toast de erro — canto inferior direito */}
      {erro && (
        <div
          style={{
            position: 'fixed', bottom: 32, right: 32, zIndex: 100,
            backgroundColor: '#e05555', borderRadius: 10,
            padding: '14px 20px', minWidth: 220, maxWidth: 300,
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>Erro</p>
          <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.85rem' }}>{erro}</p>
        </div>
      )}

      {/* Toast de sucesso — canto inferior direito */}
      {sucesso && (
        <div
          style={{
            position: 'fixed', bottom: 32, right: 32, zIndex: 100,
            backgroundColor: '#fff', borderRadius: 10,
            padding: '14px 20px', minWidth: 220, maxWidth: 300,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
        >
          <p style={{ color: '#1a1a1a', fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>Reserva realizada</p>
          <p style={{ color: '#555', fontSize: '0.85rem' }}>{sucessoMsg}</p>
        </div>
      )}
    </div>
  );

  // ── Não autenticado ──
  if (!isAuthenticated) {
    return (
      <Shell>
        <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: '48px 40px', maxWidth: 420, margin: '0 auto', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
          <svg className="mx-auto mb-4" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Acesso Restrito</h2>
          <p style={{ color: '#666', marginBottom: 24, fontSize: '0.95rem' }}>Você precisa estar logado para fazer uma reserva.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => navigate('/login')} style={{ backgroundColor: GOLD, border: 'none', color: '#1a1a1a', borderRadius: 8, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>Entrar</button>
            <button onClick={() => navigate('/register')} style={{ backgroundColor: 'transparent', border: `1.5px solid ${GOLD}`, color: GOLD, borderRadius: 8, padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>Cadastrar</button>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Carregando ──
  if (carregandoRestaurante) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="animate-spin rounded-full" style={{ width: 44, height: 44, border: '4px solid rgba(201,146,42,0.3)', borderTopColor: GOLD }} />
          <p style={{ color: '#333', fontWeight: 500 }}>Carregando informações do restaurante...</p>
        </div>
      </Shell>
    );
  }

  // ── Erro sem restaurante ──
  if (erro && !restaurante) {
    return (
      <Shell>
        <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: '48px 40px', maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#e05555', fontSize: '1rem', marginBottom: 20 }}>{erro}</p>
          <button onClick={() => navigate('/')} style={{ backgroundColor: GOLD, border: 'none', color: '#1a1a1a', borderRadius: 8, padding: '11px 28px', fontWeight: 700, cursor: 'pointer' }}>Voltar para Home</button>
        </div>
      </Shell>
    );
  }

  // Opções de nº de pessoas
  const pessoasOpts = Array.from({ length: 10 }, (_, i) => i + 1);

  const selectStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#f0ece6',
    border: '1px solid #d0c8bc',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#1a1a1a',
    fontSize: '0.95rem',
    outline: 'none',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231a1a1a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: 36,
    cursor: 'pointer',
    boxSizing: 'border-box',
  };

  const inputDateStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#f0ece6',
    border: '1px solid #d0c8bc',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#1a1a1a',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: '#1a1a1a',
    fontWeight: 600,
    fontSize: '0.9rem',
    marginBottom: 6,
  };

  return (
    <Shell>
      {/* Voltar */}
      <button
        onClick={() => navigate(`/restaurantes/${id}`)}
        style={{ background: 'none', border: 'none', color: GOLD, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: 0 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Voltar para {restaurante?.nome}
      </button>

      {/* Título */}
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>Fazer reserva</h1>
      <p style={{ color: '#1a1a1a', fontWeight: 600, marginBottom: 24, fontSize: '0.95rem' }}>
        {restaurante?.nome} • {mesasDisponibilidade ? `${mesasDisponibilidade.mensagem}` : `${restaurante?.quantidade_mesas || 0} mesas`}
      </p>

      {/* Card do formulário */}
      <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: '28px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
        <form onSubmit={handleReserva}>

          {/* Reservando como */}
          <div style={{ backgroundColor: '#f0ece6', borderRadius: 8, padding: '14px 18px', marginBottom: 24 }}>
            <p style={{ color: '#1a1a1a', fontSize: '0.95rem', margin: 0 }}>
              Reservando como: <span style={{ color: GOLD, fontWeight: 700 }}>{usuario?.nome}</span>
            </p>
            <p style={{ color: '#666', fontSize: '0.85rem', margin: '2px 0 0' }}>{usuario?.email}</p>
          </div>

          {/* Campos em 3 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            {/* Nº de pessoas */}
            <div>
              <label style={labelStyle}>N° de pessoas</label>
              <select
                value={formData.quantidadePessoas}
                onChange={e => setFormData({ ...formData, quantidadePessoas: e.target.value })}
                disabled={carregandoReserva}
                style={selectStyle}
              >
                <option value="">Selecione</option>
                {pessoasOpts.map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'pessoa' : 'pessoas'}</option>
                ))}
              </select>
            </div>

            {/* Data */}
            <div>
              <label style={labelStyle}>Data</label>
              <input
                type="date"
                value={formData.data}
                onChange={e => setFormData({ ...formData, data: e.target.value })}
                disabled={carregandoReserva}
                style={inputDateStyle}
              />
            </div>

            {/* Horário */}
            <div>
              <label style={labelStyle}>Horário</label>
              <select
                value={formData.horario}
                onChange={e => setFormData({ ...formData, horario: e.target.value })}
                disabled={carregandoReserva}
                style={selectStyle}
              >
                <option value="">Selecione</option>
                {horarios.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          {/* Disponibilidade inline */}
          {formData.data && formData.horario && formData.quantidadePessoas && mesasDisponibilidade && (
            <>
              {mesasDisponibilidade?.disponivel ? (
                <div style={{ backgroundColor: '#f0f9f4', border: '1px solid #b7dfc8', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: '0.9rem', color: '#1a5c35', fontWeight: 500 }}>
                  ✅ {mesasDisponibilidade.mesas_necessarias} mesa(s) necessária(s) para {formData.quantidadePessoas} pessoa(s) - {mesasDisponibilidade.mensagem}
                </div>
              ) : (
                <div style={{ backgroundColor: '#fef3f3', border: '1px solid #e5b7b7', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: '0.9rem', color: '#8b3838', fontWeight: 500 }}>
                  ❌ {mesasDisponibilidade.mensagem} para {formData.quantidadePessoas} pessoa(s) em {formData.data} às {formData.horario}. Tente outro horário.
                </div>
              )}
            </>
          )}

          {/* Botão confirmar */}
          <button
            type="submit"
            disabled={carregandoReserva}
            style={{
              width: '100%',
              backgroundColor: GOLD,
              border: 'none',
              color: '#fff',
              borderRadius: 8,
              padding: '13px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: carregandoReserva ? 'not-allowed' : 'pointer',
              opacity: carregandoReserva ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={e => { if (!carregandoReserva) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#b07e1e'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = GOLD; }}
          >
            {carregandoReserva && (
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="4" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
              </svg>
            )}
            Confirmar reserva
          </button>
        </form>
      </div>
    </Shell>
  );
};

export default Reserva;