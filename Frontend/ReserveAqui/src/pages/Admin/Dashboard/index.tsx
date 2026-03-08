import { Header, Footer } from '../../../components/layout';
import { useAuth } from '../../../context';
import { useEffect, useState, useCallback } from 'react';
import { restaurantesService, reservasService } from '../../../services/api';
import type { Restaurante, CriarRestauranteDTO } from '../../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const GOLD = '#C9922A';
const BEGE = '#f5f0ea';

type Aba = 'restaurantes' | 'relatorios' | 'meu-perfil';

// ── Estilos reutilizáveis ──
const inputStyle: React.CSSProperties = { width: '100%', backgroundColor: BEGE, border: '1px solid #e0d8ce', borderRadius: 8, padding: '10px 14px', color: '#1a1a1a', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', color: '#1a1a1a', fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 };
const btnGold: React.CSSProperties = { backgroundColor: GOLD, border: 'none', color: '#fff', borderRadius: 8, padding: '9px 22px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' };
const btnOutline: React.CSSProperties = { backgroundColor: 'transparent', border: '1.5px solid #ccc', color: '#555', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' };
const cardStyle: React.CSSProperties = { border: '1px solid #e5ddd5', borderRadius: 10, padding: '14px 18px', backgroundColor: '#fff' };

const focusGold = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.currentTarget.style.borderColor = GOLD);
const blurGold = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.currentTarget.style.borderColor = '#e0d8ce');

/**
 * Dashboard do Administrador — tema ReserveAqui (3 abas em 1 arquivo)
 */
const AdminDashboard = () => {
  const { usuario, trocarSenha, atualizarDados } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState<Aba>('restaurantes');

  // ── Restaurantes ──
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [carregandoRestaurantes, setCarregandoRestaurantes] = useState(false);
  const [modalRestaurante, setModalRestaurante] = useState(false);
  const [restauranteEditando, setRestauranteEditando] = useState<Restaurante | null>(null);
  const [formRestaurante, setFormRestaurante] = useState<CriarRestauranteDTO>({
    nome: '', descricao: '', endereco: '', cidade: '', estado: '', cep: '',
    telefone: '', email: '', proprietario_email: '', proprietario_nome: '', quantidade_mesas: 10,
  });
  const [modalRemover, setModalRemover] = useState(false);
  const [restauranteRemover, setRestauranteRemover] = useState<Restaurante | null>(null);

  // ── Relatórios ──
  const [estatisticas, setEstatisticas] = useState<any>(null);
  const [carregandoEstatisticas, setCarregandoEstatisticas] = useState(false);

  // ── Meu Perfil ──
  const [modoEdicaoPerfil, setModoEdicaoPerfil] = useState(false);
  const [formPerfil, setFormPerfil] = useState({ nome: usuario?.nome || '', email: usuario?.email || '' });
  const [modalSenha, setModalSenha] = useState(false);
  const [senhaData, setSenhaData] = useState({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });

  // ── Feedback ──
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregandoAcao, setCarregandoAcao] = useState(false);

  const feedback = (msg: string) => { setSucesso(msg); setTimeout(() => setSucesso(''), 3000); };

  const carregarRestaurantes = useCallback(async () => {
    try {
      setCarregandoRestaurantes(true);
      const r = await restaurantesService.listar();
      setRestaurantes(Array.isArray(r) ? r : (r.results || []));
    } catch { setErro('Erro ao carregar restaurantes'); }
    finally { setCarregandoRestaurantes(false); }
  }, []);

  const carregarEstatisticas = useCallback(async () => {
    try {
      setCarregandoEstatisticas(true);
      const agora = new Date();
      const dataHojeStr = agora.toISOString().split('T')[0];
      
      // Buscar últimos 7 dias (período mais realista para dados recentes)
      const ultimos7DiasInicio = new Date();
      ultimos7DiasInicio.setDate(ultimos7DiasInicio.getDate() - 7);
      const ultimos7DiasInicioStr = ultimos7DiasInicio.toISOString().split('T')[0];
      
      // Período anterior (8-14 dias atrás)
      const anterior7DiasInicio = new Date();
      anterior7DiasInicio.setDate(anterior7DiasInicio.getDate() - 14);
      const anterior7DiasInicioStr = anterior7DiasInicio.toISOString().split('T')[0];
      const anterior7DiasFimStr = ultimos7DiasInicioStr;

      const [restaurantesResp, estatisticasAtualResp, estatisticasAnteriorResp, reservasResp] = await Promise.all([
        restaurantesService.listar(),
        reservasService.estatisticasPeriodo({ 
          tipo_periodo: 'dia', 
          data_inicio: ultimos7DiasInicioStr, 
          data_fim: dataHojeStr 
        }),
        reservasService.estatisticasPeriodo({ 
          tipo_periodo: 'dia', 
          data_inicio: anterior7DiasInicioStr, 
          data_fim: anterior7DiasFimStr 
        }),
        reservasService.listar({}),
      ]);

      const lista = Array.isArray(restaurantesResp) ? restaurantesResp : (restaurantesResp.results || []);
      
      // Total de TODAS as reservas (histórico completo)
      const totalReservasGeral = Array.isArray(reservasResp) ? reservasResp.length : (reservasResp.count || 0);
      
      // Comparar últimos 7 dias vs 7 dias anteriores para calcular crescimento semanal
      const reservasUltimos7Dias = estatisticasAtualResp.dados.reduce((acc, item) => acc + item.total_reservas, 0);
      const reservas7DiasAnteriores = estatisticasAnteriorResp.dados.reduce((acc, item) => acc + item.total_reservas, 0);
      const crescimento = reservas7DiasAnteriores > 0 
        ? Math.round(((reservasUltimos7Dias - reservas7DiasAnteriores) / reservas7DiasAnteriores) * 100) 
        : (reservasUltimos7Dias > 0 ? 100 : 0); // Se não tinha antes e tem agora = 100% crescimento

      // Calcular taxa de confirmação (confirmadas/total) - mais realista que ocupação de mesas
      let taxaConfirmacao = 0;
      const totalTodasReservas = estatisticasAtualResp.dados.reduce((acc, item) => acc + item.total_reservas, 0);
      const totalConfirmadas = estatisticasAtualResp.dados.reduce((acc, item) => acc + item.reservas_confirmadas, 0);
      
      if (totalTodasReservas > 0) {
        taxaConfirmacao = Math.round((totalConfirmadas / totalTodasReservas) * 100);
      }

      // Para o gráfico de top restaurantes, contar todas as reservas por restaurante
      const estatisticasPorRestaurante = await Promise.all(
        lista.map(async (rest) => {
          try {
            // Buscar todas as reservas deste restaurante (sem filtro de data = histórico completo)
            const reservasRest = await reservasService.listar({ restaurante: rest.id });
            const total = Array.isArray(reservasRest) ? reservasRest.length : (reservasRest.count || 0);
            return { nome: rest.nome, reservas: total };
          } catch {
            return { nome: rest.nome, reservas: 0 };
          }
        })
      );

      const topRestaurantes = estatisticasPorRestaurante
        .sort((a, b) => b.reservas - a.reservas)
        .slice(0, 6);

      setEstatisticas({
        total: lista.length,
        reservas: totalReservasGeral,
        ocupacao: taxaConfirmacao,
        crescimento,
        topRestaurantes,
      });
    } catch { setErro('Erro ao carregar relatórios'); }
    finally { setCarregandoEstatisticas(false); }
  }, []);

  useEffect(() => { carregarRestaurantes(); }, [carregarRestaurantes]);
  useEffect(() => { if (abaAtiva === 'relatorios') carregarEstatisticas(); }, [abaAtiva, carregarEstatisticas]);
  useEffect(() => {
    if (abaAtiva !== 'restaurantes') return;

    const atualizar = () => {
      if (document.visibilityState === 'visible') {
        carregarRestaurantes();
      }
    };

    const intervalId = window.setInterval(atualizar, 15000);
    window.addEventListener('focus', atualizar);
    document.addEventListener('visibilitychange', atualizar);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', atualizar);
      document.removeEventListener('visibilitychange', atualizar);
    };
  }, [abaAtiva, carregarRestaurantes]);

  const handleAbrirModal = (restaurante?: Restaurante) => {
    if (restaurante) {
      setRestauranteEditando(restaurante);
      setFormRestaurante({ nome: restaurante.nome, descricao: restaurante.descricao || '', endereco: restaurante.endereco, cidade: restaurante.cidade, estado: restaurante.estado, cep: restaurante.cep, telefone: restaurante.telefone || '', email: restaurante.email, quantidade_mesas: restaurante.quantidade_mesas || 10 });
    } else {
      setRestauranteEditando(null);
      setFormRestaurante({ nome: '', descricao: '', endereco: '', cidade: '', estado: '', cep: '', telefone: '', email: '', proprietario_email: '', proprietario_nome: '', quantidade_mesas: 10 });
    }
    setModalRestaurante(true);
  };

  const handleSalvarRestaurante = async () => {
    setErro('');
    // Validação de campos obrigatórios
    if (!formRestaurante.nome || !formRestaurante.endereco || !formRestaurante.cidade || !formRestaurante.estado || !formRestaurante.cep || !formRestaurante.email) {
      setErro('Preencha todos os campos obrigatórios do restaurante');
      return;
    }

    // Se está criando (não editando), exige dados do proprietário
    if (!restauranteEditando) {
      if (!formRestaurante.proprietario_nome || !formRestaurante.proprietario_email) {
        setErro('Para criar um restaurante, informe o Nome e Email do novo Proprietário');
        return;
      }
    }

    try {
      setCarregandoAcao(true);
      if (restauranteEditando) {
        await restaurantesService.atualizar(restauranteEditando.id, formRestaurante);
        feedback('Restaurante atualizado!');
      } else {
        await restaurantesService.criar(formRestaurante);
        feedback('Restaurante cadastrado com sucesso! Um email foi enviado ao proprietário.');
      }
      setModalRestaurante(false);
      carregarRestaurantes();
    } catch (err: any) {
      const mensagemErro = err?.response?.data?.detail || err?.response?.data?.proprietario_email?.[0] || err?.response?.data?.proprietario_nome?.[0] || 'Erro ao salvar restaurante';
      setErro(String(mensagemErro));
    } finally { setCarregandoAcao(false); }
  };

  const handleRemoverRestaurante = async () => {
    if (!restauranteRemover) return;
    try {
      setCarregandoAcao(true);
      await restaurantesService.deletar(restauranteRemover.id);
      setModalRemover(false);
      carregarRestaurantes();
      feedback('Restaurante removido!');
    } catch { setErro('Erro ao remover restaurante'); }
    finally { setCarregandoAcao(false); }
  };

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!formPerfil.nome || !formPerfil.email) { setErro('Preencha os campos obrigatórios'); return; }
    try {
      setCarregandoAcao(true);
      await atualizarDados({ nome: formPerfil.nome, email: formPerfil.email });
      setModoEdicaoPerfil(false);
      feedback('Perfil atualizado!');
    } catch (err: any) {
      setErro(String(err?.response?.data?.detail || 'Erro ao atualizar perfil'));
    } finally { setCarregandoAcao(false); }
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

  const dadosGrafico = estatisticas?.topRestaurantes || [];

  const abas: { key: Aba; label: string; emoji: string }[] = [
    { key: 'restaurantes', label: 'Restaurantes', emoji: '🏢' },
    { key: 'relatorios', label: 'Relatórios', emoji: '📊' },
    { key: 'meu-perfil', label: 'Meu Perfil', emoji: '👤' },
  ];

  // Imagem placeholder para restaurante
  const imgRestaurante = (_r: Restaurante) =>
    `https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80&h=80&fit=crop&q=60`;

  return (
    <div className="w-full flex flex-col min-h-screen" style={{ backgroundColor: '#fff' }}>
      <Header />

      <main className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Título */}
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>Painel Administrativo</h1>
        <p style={{ color: '#888', fontSize: '0.95rem', marginBottom: 24 }}>Gestão global da plataforma</p>

        {/* Feedback */}
        {erro && (
          <div style={{ backgroundColor: '#6b1a1a', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#fff', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem' }}>{erro}</span>
            <button onClick={() => setErro('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>✕</button>
          </div>
        )}
        {sucesso && <div style={{ backgroundColor: '#1e4d2b', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>✅ {sucesso}</div>}

        {/* ── Tab bar ── */}
        <div style={{ display: 'flex', gap: 4, border: '1px solid #e0d8ce', borderRadius: 10, padding: '6px 10px', marginBottom: 28, backgroundColor: '#faf8f5', width: 'fit-content' }}>
          {abas.map(a => (
            <button key={a.key} onClick={() => setAbaAtiva(a.key)} style={{ backgroundColor: abaAtiva === a.key ? '#fff' : 'transparent', border: abaAtiva === a.key ? '1px solid #e0d8ce' : 'none', borderRadius: 7, padding: '6px 14px', fontWeight: abaAtiva === a.key ? 700 : 500, fontSize: '0.88rem', color: '#1a1a1a', cursor: 'pointer', boxShadow: abaAtiva === a.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
              {a.emoji} {a.label}
            </button>
          ))}
        </div>

        {/* ═══════════════ ABA: RESTAURANTES ═══════════════ */}
        {abaAtiva === 'restaurantes' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a' }}>Gestão de restaurantes</h2>
              <button onClick={() => handleAbrirModal()} style={{ ...btnGold, display: 'flex', alignItems: 'center', gap: 6 }}>+ Cadastrar</button>
            </div>

            {carregandoRestaurantes ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full" style={{ width: 36, height: 36, border: '4px solid #e5d9c8', borderTopColor: GOLD }} /></div>
            ) : restaurantes.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>Nenhum restaurante cadastrado</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {restaurantes.map(r => (
                  <div key={r.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* Thumbnail */}
                    <img src={imgRestaurante(r)} alt={r.nome} style={{ width: 72, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '0.95rem', marginBottom: 2 }}>{r.nome}</p>
                      <p style={{ color: '#888', fontSize: '0.82rem' }}>
                        {r.endereco} - {r.cidade}
                      </p>
                    </div>

                    {/* Ações */}
                    <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                      <button onClick={() => handleAbrirModal(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button onClick={() => { setRestauranteRemover(r); setModalRemover(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e05555" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ ABA: RELATÓRIOS ═══════════════ */}
        {abaAtiva === 'relatorios' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a' }}>Relatórios gerais</h2>
            </div>

            {carregandoEstatisticas ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full" style={{ width: 36, height: 36, border: '4px solid #e5d9c8', borderTopColor: GOLD }} /></div>
            ) : (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { valor: estatisticas?.total ?? restaurantes.length, label: 'Restaurantes' },
                    { valor: estatisticas?.reservas ?? 0, label: 'Total de Reservas' },
                    { valor: `${estatisticas?.ocupacao ?? 0}%`, label: 'Taxa de Confirmação' },
                    { valor: `${estatisticas?.crescimento > 0 ? '+' : ''}${estatisticas?.crescimento ?? 0}%`, label: 'Crescimento Semanal' },
                  ].map(k => (
                    <div key={k.label} style={{ ...cardStyle, textAlign: 'center', padding: '22px 12px' }}>
                      <p style={{ color: GOLD, fontSize: '2rem', fontWeight: 700, marginBottom: 4 }}>{k.valor}</p>
                      <p style={{ color: '#666', fontSize: '0.85rem' }}>{k.label}</p>
                    </div>
                  ))}
                </div>

                {/* Gráfico de barras horizontais */}
                <div style={{ ...cardStyle, padding: '20px 24px' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#555', marginBottom: 16 }}>Restaurantes Mais Reservados</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={dadosGrafico} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="nome" tick={{ fontSize: 11, fill: '#555' }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5ddd5' }} />
                      <Bar dataKey="reservas" fill={GOLD} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════════ ABA: MEU PERFIL ═══════════════ */}
        {abaAtiva === 'meu-perfil' && (
          <div className="flex justify-center">
            <div style={{ ...cardStyle, maxWidth: 540, width: '100%', padding: '28px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a' }}>
                  {modoEdicaoPerfil ? 'Dados Pessoais' : 'Dados pessoais'}
                </h2>
                {modoEdicaoPerfil ? (
                  <button onClick={() => setModoEdicaoPerfil(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', fontWeight: 500 }}>Cancelar</button>
                ) : (
                  <button onClick={() => setModoEdicaoPerfil(true)} style={btnGold}>Editar perfil</button>
                )}
              </div>

              {modoEdicaoPerfil ? (
                <form onSubmit={handleSalvarPerfil}>
                  {[{ key: 'nome', label: 'Nome', type: 'text' }, { key: 'email', label: 'Email', type: 'email' }].map(f => (
                    <div key={f.key} style={{ marginBottom: 14 }}>
                      <label style={labelStyle}>{f.label}</label>
                      <input type={f.type} value={formPerfil[f.key as keyof typeof formPerfil]} onChange={e => setFormPerfil({ ...formPerfil, [f.key]: e.target.value })} style={inputStyle} onFocus={focusGold} onBlur={blurGold} />
                    </div>
                  ))}
                  <button type="submit" disabled={carregandoAcao} style={{ ...btnGold, marginBottom: 12 }}>{carregandoAcao ? '...' : 'Salvar'}</button>
                  <div><button type="button" onClick={() => setModalSenha(true)} style={btnOutline}>Alterar Senha</button></div>
                </form>
              ) : (
                <div>
                  {[{ l: 'Nome', v: usuario?.nome }, { l: 'Email', v: usuario?.email }].map(i => (
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

      {/* ══ MODAL: Novo/Editar Restaurante ══ */}
      {modalRestaurante && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ backgroundColor: BEGE, borderRadius: 14, padding: '28px 32px', maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button onClick={() => setModalRestaurante(false)} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#888' }}>✕</button>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a', marginBottom: 20 }}>
              {restauranteEditando ? 'Editar Restaurante' : 'Novo Restaurante'}
            </h2>

            {[
              { key: 'nome', label: 'Nome', type: 'text', placeholder: 'Ex: Trattoria Bella Vista', required: true },
              { key: 'endereco', label: 'Localização', type: 'text', placeholder: 'Ex: Rua Augusta, 1200', required: true },
              { key: 'descricao', label: 'Descrição', type: 'text', placeholder: 'Descreva o restaurante...', required: false },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={labelStyle}>{f.label} {f.required && <span style={{ color: '#e05555' }}>*</span>}</label>
                <input type={f.type} value={(formRestaurante as any)[f.key] || ''} onChange={e => setFormRestaurante({ ...formRestaurante, [f.key]: e.target.value } as any)} style={inputStyle} placeholder={f.placeholder} onFocus={focusGold} onBlur={blurGold} autoFocus={f.key === 'nome'} required={f.required} />
              </div>
            ))}

            {/* Cidade, Estado, CEP */}
            <div className="grid grid-cols-3 gap-3" style={{ marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Cidade <span style={{ color: '#e05555' }}>*</span></label>
                <input type="text" value={formRestaurante.cidade} onChange={e => setFormRestaurante({ ...formRestaurante, cidade: e.target.value })} style={inputStyle} placeholder="Ex: São Paulo" onFocus={focusGold} onBlur={blurGold} required />
              </div>
              <div>
                <label style={labelStyle}>Estado <span style={{ color: '#e05555' }}>*</span></label>
                <input type="text" value={formRestaurante.estado} onChange={e => setFormRestaurante({ ...formRestaurante, estado: e.target.value })} style={inputStyle} placeholder="Ex: SP" onFocus={focusGold} onBlur={blurGold} required />
              </div>
              <div>
                <label style={labelStyle}>CEP <span style={{ color: '#e05555' }}>*</span></label>
                <input type="text" value={formRestaurante.cep} onChange={e => setFormRestaurante({ ...formRestaurante, cep: e.target.value })} style={inputStyle} placeholder="Ex: 01000-000" onFocus={focusGold} onBlur={blurGold} required />
              </div>
            </div>

            {/* Email, Telefone, Mesas */}
            <div className="grid grid-cols-3 gap-3" style={{ marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Email <span style={{ color: '#e05555' }}>*</span></label>
                <input type="email" value={formRestaurante.email} onChange={e => setFormRestaurante({ ...formRestaurante, email: e.target.value })} style={inputStyle} onFocus={focusGold} onBlur={blurGold} required />
              </div>
              <div>
                <label style={labelStyle}>Telefone</label>
                <input type="text" value={formRestaurante.telefone || ''} onChange={e => setFormRestaurante({ ...formRestaurante, telefone: e.target.value })} style={inputStyle} onFocus={focusGold} onBlur={blurGold} />
              </div>
              <div>
                <label style={labelStyle}>Quantidade de Mesas</label>
                <input type="number" min="1" value={formRestaurante.quantidade_mesas || 10} onChange={e => setFormRestaurante({ ...formRestaurante, quantidade_mesas: parseInt(e.target.value) || 10 })} style={inputStyle} onFocus={focusGold} onBlur={blurGold} />
              </div>
            </div>

            {/* Proprietário (apenas criação) */}
            {!restauranteEditando && (
              <>
                <div style={{ borderTop: '1px solid #e0d8ce', margin: '18px 0 14px' }} />
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#555', marginBottom: 4 }}>Proprietário (será criado um novo usuário)</p>
                <p style={{ fontSize: '0.8rem', color: '#999', marginBottom: 14 }}>Informe o nome e email de quem administrará este restaurante</p>
                {[{ key: 'proprietario_nome', label: 'Nome do Proprietário' }, { key: 'proprietario_email', label: 'Email do Proprietário' }].map(f => (
                  <div key={f.key} style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>{f.label} <span style={{ color: '#e05555' }}>*</span></label>
                    <input type={f.key === 'proprietario_email' ? 'email' : 'text'} value={(formRestaurante as any)[f.key] || ''} onChange={e => setFormRestaurante({ ...formRestaurante, [f.key]: e.target.value } as any)} style={inputStyle} placeholder={f.key === 'proprietario_email' ? 'Ex: proprietario@email.com' : 'Ex: Carlos da Silva'} onFocus={focusGold} onBlur={blurGold} required />
                  </div>
                ))}
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setModalRestaurante(false)} style={btnOutline} disabled={carregandoAcao}>Cancelar</button>
              <button onClick={handleSalvarRestaurante} disabled={carregandoAcao} style={btnGold}>{carregandoAcao ? '...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Remover Restaurante ══ */}
      {modalRemover && restauranteRemover && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: '28px 32px', maxWidth: 400, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a', marginBottom: 12 }}>Remover restaurante?</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: 24 }}>
              Tem certeza que deseja remover <strong>{restauranteRemover.nome}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalRemover(false)} style={{ ...btnOutline, flex: 1 }}>Cancelar</button>
              <button onClick={handleRemoverRestaurante} disabled={carregandoAcao} style={{ flex: 1, backgroundColor: '#e05555', border: 'none', color: '#fff', borderRadius: 8, padding: '10px', fontWeight: 700, cursor: 'pointer' }}>
                {carregandoAcao ? '...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Alterar Senha ══ */}
      {modalSenha && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ backgroundColor: BEGE, borderRadius: 14, padding: '28px 32px', maxWidth: 440, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button onClick={() => { setModalSenha(false); setSenhaData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' }); }} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#888' }}>✕</button>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a', marginBottom: 20 }}>Alterar Senha</h2>
            <form onSubmit={handleSenha}>
              {[{ key: 'senhaAtual', label: 'Senha Atual' }, { key: 'novaSenha', label: 'Nova Senha' }, { key: 'confirmarSenha', label: 'Confirmar Nova Senha' }].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>{f.label}</label>
                  <input type="password" value={senhaData[f.key as keyof typeof senhaData]} onChange={e => setSenhaData({ ...senhaData, [f.key]: e.target.value })} style={inputStyle} onFocus={focusGold} onBlur={blurGold} autoFocus={f.key === 'senhaAtual'} />
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

export default AdminDashboard;