import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context';
import { Input, Alert } from '../../components/common';

const GOLD = '#C9922A';

/**
 * Página de Recuperação de Senha — tema ReserveAqui
 */
export default function RecuperarSenha() {
  const { solicitarRecuperacao, error: authError, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmail = (): boolean => {
    if (!email) {
      setEmailError('Email é obrigatório');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Email inválido');
      return false;
    }
    return true;
  };

  const handleSolicitarRecuperacao = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setEmailError('');
    setSuccessMessage('');

    if (!validateEmail()) return;

    setIsLoading(true);
    try {
      await solicitarRecuperacao(email);
      setSuccessMessage('Email enviado com sucesso');
      setTimeout(() => {
        window.location.href = `/confirmacao-recuperacao?email=${encodeURIComponent(email)}`;
      }, 1500);
    } catch (err) {
      console.error('Erro ao solicitar recuperação:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#E8E4DE' }}>

      {/* Header */}
      <header
        className="w-full sticky top-0 z-50"
        style={{ backgroundColor: '#1a1a1a', borderBottom: `2px solid ${GOLD}` }}
      >
        <div className="w-full max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="4" width="24" height="22" rx="3" stroke={GOLD} strokeWidth="2" fill="none" />
              <path d="M2 10h24" stroke={GOLD} strokeWidth="2" />
              <rect x="7" y="2" width="3" height="5" rx="1.5" fill={GOLD} />
              <rect x="18" y="2" width="3" height="5" rx="1.5" fill={GOLD} />
              <path d="M8 16l3 3 6-6" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ color: GOLD, fontWeight: 700, fontSize: '1.2rem', fontFamily: "'Georgia', serif" }}>
              ReserveAqui
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link to="/login">
              <button style={{ background: 'none', border: `1px solid ${GOLD}`, color: GOLD, borderRadius: 8, padding: '7px 22px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
                Entrar
              </button>
            </Link>
            <Link to="/register">
              <button style={{ background: 'none', border: `1px solid ${GOLD}`, color: GOLD, borderRadius: 8, padding: '7px 22px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
                Cadastrar
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4">
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
            style={{ color: GOLD, fontSize: '2rem', fontFamily: "'Georgia', serif" }}
          >
            Redefinição de senha
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
          <form onSubmit={handleSolicitarRecuperacao} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="Digite seu email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              error={emailError}
              disabled={isLoading}
            />

            {/* Botão Enviar Link */}
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
              Enviar Link
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
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p style={{ color: '#555', fontSize: '0.85rem', fontWeight: 600 }}>
          © 2026 ReserveAqui. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}