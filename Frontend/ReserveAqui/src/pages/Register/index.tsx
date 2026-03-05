import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context';
import { Input, Button, Alert } from '../../components/common';

const GOLD = '#C9922A';

interface FormErrors {
  nome?: string;
  email?: string;
  senha?: string;
  confirmarSenha?: string;
}

/**
 * Página de Cadastro — tema ReserveAqui
 */
export default function Register() {
  const navigate = useNavigate();
  const { cadastro, error: authError, clearError } = useAuth();

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [senhaForca, setSenhaForca] = useState<'fraca' | 'media' | 'forte'>('fraca');

  const verificarForcaSenha = (senha: string): 'fraca' | 'media' | 'forte' => {
    if (senha.length < 8) return 'fraca';
    if (/[A-Z]/.test(senha) && /[0-9]/.test(senha) && senha.length >= 8) return 'forte';
    return 'media';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name as keyof FormErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }
    if (name === 'senha') {
      setSenhaForca(verificarForcaSenha(value));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (formData.nome.trim().length < 3) {
      newErrors.nome = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 8) {
      newErrors.senha = 'Senha deve ter no mínimo 8 caracteres';
    } else if (!/[A-Z]/.test(formData.senha)) {
      newErrors.senha = 'Senha deve conter pelo menos 1 letra maiúscula';
    } else if (!/[0-9]/.test(formData.senha)) {
      newErrors.senha = 'Senha deve conter pelo menos 1 número';
    }

    if (!formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Confirmação de senha é obrigatória';
    } else if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage('');

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await cadastro({
        nome: formData.nome,
        email: formData.email,
        password: formData.senha,
        password_confirm: formData.confirmarSenha,
      });
      setSuccessMessage('Cadastro realizado com sucesso');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error('Erro ao cadastrar:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const forcaBarraLargura = { fraca: '33%', media: '66%', forte: '100%' };
  const forcaBarraCor = { fraca: '#e05555', media: '#C9922A', forte: '#2d7a40' };
  const forcaTexto = { fraca: 'Fraca', media: 'Média', forte: 'Forte' };

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
            Cadastre-se
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
          <form onSubmit={handleRegister} className="space-y-5">

            <Input
              label="Nome"
              type="text"
              name="nome"
              placeholder="Digite seu nome"
              value={formData.nome}
              onChange={handleInputChange}
              error={errors.nome}
              disabled={isLoading}
            />

            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="Digite seu email"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              disabled={isLoading}
            />

            {/* Senha + indicador de força */}
            <div>
              <Input
                label="Senha"
                type="password"
                name="senha"
                placeholder="Digite sua senha"
                value={formData.senha}
                onChange={handleInputChange}
                error={errors.senha}
                disabled={isLoading}
              />
              {formData.senha && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ width: '100%', backgroundColor: '#2e2b27', borderRadius: 99, height: 6 }}>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 99,
                        backgroundColor: forcaBarraCor[senhaForca],
                        width: forcaBarraLargura[senhaForca],
                        transition: 'width 0.3s ease, background-color 0.3s ease',
                      }}
                    />
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#aaa', marginTop: 4 }}>
                    Força: <span style={{ color: forcaBarraCor[senhaForca], fontWeight: 600 }}>{forcaTexto[senhaForca]}</span>
                  </p>
                </div>
              )}
            </div>

            <Input
              label="Confirmar senha"
              type="password"
              name="confirmarSenha"
              placeholder="Digite sua senha"
              value={formData.confirmarSenha}
              onChange={handleInputChange}
              error={errors.confirmarSenha}
              disabled={isLoading}
            />

            {/* Botão Cadastrar */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              style={{ width: '100%', marginTop: 8 }}
            >
              Cadastre-se
            </Button>
          </form>

          {/* Link para login */}
          <div className="text-center mt-5">
            <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Já tem uma conta? </span>
            <Link
              to="/login"
              style={{ color: GOLD, fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}
              onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline')}
              onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none')}
            >
              Entre aqui
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