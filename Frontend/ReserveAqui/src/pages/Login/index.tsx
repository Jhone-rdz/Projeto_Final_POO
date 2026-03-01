import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context';
import { Input, Button, Alert } from '../../components/common';

/**
 * Página de Login
 */
export default function Login() {
  const navigate = useNavigate();
  const { login, error: authError, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; senha?: string }>({});
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * Validar formulário
   */
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

  /**
   * Fazer login
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await login(email, senha);
      setSuccessMessage('Login realizado com sucesso!');
      
      // Redirecionar após sucesso
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      // Erro já está no authError do contexto
      console.error('Erro ao fazer login:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ReserveAqui</h1>
          <p className="text-gray-600">Reserve sua mesa com facilidade</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Entre na sua conta</h2>

          {/* Erro de autenticação */}
          {authError && (
            <div className="mb-6">
              <Alert 
                type="error" 
                message={authError}
                onClose={clearError}
              />
            </div>
          )}

          {/* Sucesso */}
          {successMessage && (
            <div className="mb-6">
              <Alert 
                type="success" 
                message={successMessage}
              />
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              disabled={isLoading}
            />

            {/* Senha */}
            <Input
              label="Senha"
              type="password"
              placeholder="Sua senha"
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
            >
              Entrar
            </Button>
          </form>

          {/* Divisor */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou</span>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3">
            {/* Cadastrar */}
            <Link to="/register">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full"
              >
                Criar nova conta
              </Button>
            </Link>

            {/* Recuperar Senha */}
            <div className="text-center">
              <Link
                to="/recuperar-senha"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Esqueceu a senha?
              </Link>
            </div>
          </div>
        </div>

        {/* Footer de página */}
        <div className="text-center mt-8 text-gray-600 text-sm">
          <p>© 2026 ReserveAqui. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
