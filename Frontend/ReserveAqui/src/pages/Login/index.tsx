import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context';
import { Input, Button, Alert } from '../../components/common';

const GOLD = '#C9922A';

/**
 * Página de Login — tema ReservaFácil
 */
export default function Login() {
  const navigate = useNavigate();
  const { login, usuario, error: authError, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; senha?: string }>({});
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: { email?: string; senha?: string } = {};
    if (!email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }
    if (!senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage('');
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await login(email, senha);
      setSuccessMessage('Login realizado com sucesso');
      setTimeout(() => {
        if (usuario?.papeis?.some(p => p.tipo === 'admin_sistema')) {
          navigate('/admin/dashboard');
        } else if (usuario?.papeis?.some(p => p.tipo === 'admin_secundario')) {
          navigate('/owner/dashboard');
        } else {
          navigate('/');
        }
      }, 1000);
    } catch (err) {
      console.error('Erro ao fazer login:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#E8E4DE' }}
    >
      {/* Header */}
      <header
        className="w-full sticky top-0 z-50"
        style={{ backgroundColor: '#1a1a1a', borderBottom: `2px solid ${GOLD}` }}
      >
        <div className="w-full max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="4" width="24" height="22" rx="3" stroke={GOLD} strokeWidth="2" fill="none" />
              <path d="M2 10h24" stroke={GOLD} strokeWidth="2" />
              <rect x="7" y="2" width="3" height="5" rx="1.5" fill={GOLD} />
              <rect x="18" y="2" width="3" height="5" rx="1.5" fill={GOLD} />
              <path d="M8 16l3 3 6-6" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ color: GOLD, fontWeight: 700, fontSize: '1.2rem', fontFamily: "'Georgia', serif" }}>
              ReservaFácil
            </span>
          </Link>

          {/* Botões */}
          <div className="flex items-center gap-2">
            <Link to="/login">
              <button
                style={{
                  background: 'none',
                  border: `1px solid ${GOLD}`,
                  color: GOLD,
                  borderRadius: 8,
                  padding: '7px 22px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                Entrar
              </button>
            </Link>
            <Link to="/register">
              <button
                style={{
                  background: 'none',
                  border: `1px solid ${GOLD}`,
                  color: GOLD,
                  borderRadius: 8,
                  padding: '7px 22px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                Cadastrar
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4">

        {/* Card */}
        <div
          className="w-full"
          style={{
            maxWidth: 580,
            backgroundColor: '#4a4540',
            borderRadius: 16,
            border: `1px solid ${GOLD}`,
            padding: '40px 48px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
          }}
        >
          {/* Título */}
          <h1
            className="text-center font-bold mb-6"
            style={{
              color: GOLD,
              fontSize: '2rem',
              fontFamily: "'Georgia', serif",
            }}
          >
            Login
          </h1>

          {/* Alert de erro */}
          {authError && (
            <div className="mb-5">
              <Alert type="error" message={authError} onClose={clearError} />
            </div>
          )}

          {/* Alert de sucesso */}
          {successMessage && (
            <div className="mb-5">
              <Alert type="success" message={successMessage} />
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="Digite seu email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              disabled={isLoading}
            />

            <Input
              label="Senha"
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value);
                if (errors.senha) setErrors({ ...errors, senha: undefined });
              }}
              error={errors.senha}
              disabled={isLoading}
            />

            {/* Botão Entrar */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
              style={{ width: '100%', marginTop: 8 }}
            >
              Entrar
            </Button>
          </form>

          {/* Botão Cadastrar */}
          <Link to="/register" style={{ textDecoration: 'none', display: 'block', marginTop: 12 }}>
            <button
              style={{
                width: '100%',
                backgroundColor: '#2e2b27',
                border: `1.5px solid ${GOLD}`,
                color: GOLD,
                borderRadius: 8,
                padding: '13px',
                fontWeight: 700,
                fontSize: '1.05rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3a3632'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2e2b27'; }}
            >
              Cadastrar
            </button>
          </Link>

          {/* Recuperar senha */}
          <div className="text-center mt-6">
            <Link
              to="/recuperar-senha"
              style={{
                color: GOLD,
                fontWeight: 600,
                fontSize: '0.95rem',
                textDecoration: 'none',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}
            >
              Recuperar senha
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p style={{ color: '#555', fontSize: '0.85rem', fontWeight: 600 }}>
          © 2026 ReservaFácil. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}