import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';
import { Input, Alert } from '../../components/common';

const GOLD = '#C9922A';

interface FormErrors {
  novaSenha?: string;
  confirmarSenha?: string;
}

/**
 * Página de Redefinição de Senha — tema ReservaFácil
 */
export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { redefinirSenha, error: authError, clearError } = useAuth();

  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({ novaSenha: '', confirmarSenha: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [senhaForca, setSenhaForca] = useState<'fraca' | 'media' | 'forte'>('fraca');
  const [tokenInvalido, setTokenInvalido] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) { setTokenInvalido(true); return; }
    setToken(tokenParam);
  }, [searchParams]);

  const verificarForcaSenha = (senha: string): 'fraca' | 'media' | 'forte' => {
    if (senha.length < 6) return 'fraca';
    if (senha.length < 10) return 'media';
    if (/[A-Z]/.test(senha) && /[0-9]/.test(senha)) return 'forte';
    return 'media';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name as keyof FormErrors]) setErrors({ ...errors, [name]: undefined });
    if (name === 'novaSenha') setSenhaForca(verificarForcaSenha(value));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.novaSenha) {
      newErrors.novaSenha = 'Nova senha é obrigatória';
    } else if (formData.novaSenha.length < 6) {
      newErrors.novaSenha = 'Senha deve ter pelo menos 6 caracteres';
    }
    if (!formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Confirmação de senha é obrigatória';
    } else if (formData.novaSenha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não coincidem';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRedefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage('');
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await redefinirSenha(token, formData.novaSenha);
      setSuccessMessage('Senha redefinida com sucesso');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Erro ao redefinir senha:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const forcaBarraCor = { fraca: '#e05555', media: GOLD, forte: '#2d7a40' };
  const forcaBarraLargura = { fraca: '33%', media: '66%', forte: '100%' };
  const forcaTexto = { fraca: 'Fraca', media: 'Média', forte: 'Forte' };

  // ── Header e Footer reutilizados ──
  const PageShell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#E8E4DE' }}>
      <header className="w-full sticky top-0 z-50" style={{ backgroundColor: '#1a1a1a', borderBottom: `2px solid ${GOLD}` }}>
        <div className="w-full max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="4" width="24" height="22" rx="3" stroke={GOLD} strokeWidth="2" fill="none" />
              <path d="M2 10h24" stroke={GOLD} strokeWidth="2" />
              <rect x="7" y="2" width="3" height="5" rx="1.5" fill={GOLD} />
              <rect x="18" y="2" width="3" height="5" rx="1.5" fill={GOLD} />
              <path d="M8 16l3 3 6-6" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ color: GOLD, fontWeight: 700, fontSize: '1.2rem', fontFamily: "'Georgia', serif" }}>ReservaFácil</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login"><button style={{ background: 'none', border: `1px solid ${GOLD}`, color: GOLD, borderRadius: 8, padding: '7px 22px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>Entrar</button></Link>
            <Link to="/register"><button style={{ background: 'none', border: `1px solid ${GOLD}`, color: GOLD, borderRadius: 8, padding: '7px 22px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>Cadastrar</button></Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        {children}
      </main>

      <footer className="py-6 text-center">
        <p style={{ color: '#555', fontSize: '0.85rem', fontWeight: 600 }}>© 2026 ReservaFácil. Todos os direitos reservados.</p>
      </footer>
    </div>
  );

  // ── Token inválido ──
  if (tokenInvalido) {
    return (
      <PageShell>
        <div className="w-full" style={{ maxWidth: 580, backgroundColor: '#4a4540', borderRadius: 16, border: `1px solid ${GOLD}`, padding: '40px 48px', boxShadow: '0 8px 40px rgba(0,0,0,0.25)' }}>
          <h1 className="text-center font-bold mb-6" style={{ color: GOLD, fontSize: '2rem', fontFamily: "'Georgia', serif" }}>
            Link Inválido
          </h1>
          <p className="text-center mb-8" style={{ color: '#aaa', fontSize: '0.95rem', lineHeight: 1.6 }}>
            O link para redefinir sua senha é inválido ou expirou. Links de redefinição são válidos por 1 hora.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link to="/recuperar-senha" style={{ textDecoration: 'none' }}>
              <button style={{ width: '100%', backgroundColor: GOLD, border: 'none', color: '#1a1a1a', borderRadius: 8, padding: '13px', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer' }}>
                Solicitar novo link
              </button>
            </Link>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <button style={{ width: '100%', backgroundColor: 'transparent', border: `1.5px solid ${GOLD}`, color: GOLD, borderRadius: 8, padding: '13px', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer' }}>
                Voltar para Login
              </button>
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Formulário principal ──
  return (
    <PageShell>
      <div
        className="w-full"
        style={{ maxWidth: 580, backgroundColor: '#4a4540', borderRadius: 16, border: `1px solid ${GOLD}`, padding: '40px 48px', boxShadow: '0 8px 40px rgba(0,0,0,0.25)' }}
      >
        {/* Título */}
        <h1 className="text-center font-bold mb-6" style={{ color: GOLD, fontSize: '2rem', fontFamily: "'Georgia', serif" }}>
          Redefinir senha
        </h1>

        {/* Alert erro */}
        {authError && (
          <div className="mb-5">
            <Alert type="error" message={authError} onClose={clearError} />
          </div>
        )}

        {/* Alert sucesso */}
        {successMessage && (
          <div className="mb-5">
            <Alert type="success" message={successMessage} />
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleRedefinirSenha} className="space-y-5">

          {/* Nova Senha */}
          <div>
            <Input
              label="Nova senha"
              type="password"
              name="novaSenha"
              placeholder="Digite sua nova senha"
              value={formData.novaSenha}
              onChange={handleInputChange}
              error={errors.novaSenha}
              disabled={isLoading}
            />
            {formData.novaSenha && (
              <div style={{ marginTop: 8 }}>
                <div style={{ width: '100%', backgroundColor: '#2e2b27', borderRadius: 99, height: 6 }}>
                  <div style={{ height: 6, borderRadius: 99, backgroundColor: forcaBarraCor[senhaForca], width: forcaBarraLargura[senhaForca], transition: 'width 0.3s ease, background-color 0.3s ease' }} />
                </div>
                <p style={{ fontSize: '0.78rem', color: '#aaa', marginTop: 4 }}>
                  Força: <span style={{ color: forcaBarraCor[senhaForca], fontWeight: 600 }}>{forcaTexto[senhaForca]}</span>
                </p>
              </div>
            )}
          </div>

          {/* Confirmar Nova Senha */}
          <Input
            label="Confirmar nova senha"
            type="password"
            name="confirmarSenha"
            placeholder="Confirme sua nova senha"
            value={formData.confirmarSenha}
            onChange={handleInputChange}
            error={errors.confirmarSenha}
            disabled={isLoading}
          />

          {/* Botão Redefinir */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              backgroundColor: GOLD,
              border: `2px solid ${GOLD}`,
              color: '#1a1a1a',
              borderRadius: 8,
              padding: '13px',
              fontWeight: 700,
              fontSize: '1.05rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background-color 0.2s',
              marginTop: 8,
            }}
            onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#b07e1e'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = GOLD; }}
          >
            {isLoading && (
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#1a1a1a" strokeWidth="4" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" />
              </svg>
            )}
            Redefinir senha
          </button>
        </form>

        {/* Voltar para login */}
        <div className="text-center mt-6">
          <Link
            to="/login"
            style={{ color: GOLD, fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none' }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline')}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none')}
          >
            Voltar para login
          </Link>
        </div>
      </div>
    </PageShell>
  );
}