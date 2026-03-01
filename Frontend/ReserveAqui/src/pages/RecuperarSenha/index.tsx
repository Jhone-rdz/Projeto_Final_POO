import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context';
import { Input, Button, Alert } from '../../components/common';

/**
 * Página de Recuperação de Senha
 */
export default function RecuperarSenha() {
  const { solicitarRecuperacao, error: authError, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  /**
   * Validar email
   */
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

  /**
   * Solicitar recuperação
   */
  const handleSolicitarRecuperacao = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setEmailError('');

    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);

    try {
      await solicitarRecuperacao(email);
      
      // Redirecionar para página de confirmação com email na query string
      window.location.href = `/confirmacao-recuperacao?email=${encodeURIComponent(email)}`;
    } catch (err) {
      console.error('Erro ao solicitar recuperação:', err);
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Recuperar Senha</h2>
          <p className="text-gray-600 text-sm mb-6">
            Digite seu email e enviaremos um link para redefinir sua senha.
          </p>

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

          {/* Formulário */}
          <form onSubmit={handleSolicitarRecuperacao} className="space-y-4">
            {/* Email */}
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              error={emailError}
              disabled={isLoading}
            />

            {/* Botão Enviar */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              Enviar email de recuperação
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
          <div className="space-y-3 text-center">
            {/* Voltar para Login */}
            <Link to="/login">
              <p className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                Voltar para Login
              </p>
            </Link>

            {/* Criar conta */}
            <p className="text-gray-600 text-sm">
              Não tem uma conta?{' '}
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Cadastre-se
              </Link>
            </p>
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
