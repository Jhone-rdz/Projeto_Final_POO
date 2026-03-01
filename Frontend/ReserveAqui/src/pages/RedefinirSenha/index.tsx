import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';
import { Input, Button, Alert } from '../../components/common';

interface FormErrors {
  novaSenha?: string;
  confirmarSenha?: string;
}

/**
 * Página de Redefinição de Senha (via link do email)
 */
export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { redefinirSenha, error: authError, clearError } = useAuth();

  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    novaSenha: '',
    confirmarSenha: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [step, setStep] = useState<'form' | 'sucesso'>('form');
  const [senhaForca, setSenhaForca] = useState<'fraca' | 'media' | 'forte'>('fraca');
  const [tokenInvalido, setTokenInvalido] = useState(false);

  /**
   * Verificar token na URL ao montar
   */
  useEffect(() => {
    const tokenParam = searchParams.get('token');

    if (!tokenParam) {
      setTokenInvalido(true);
      return;
    }

    setToken(tokenParam);
  }, [searchParams]);

  /**
   * Verificar força da senha
   */
  const verificarForcaSenha = (senha: string): 'fraca' | 'media' | 'forte' => {
    if (senha.length < 6) return 'fraca';
    if (senha.length < 10) return 'media';
    if (/[A-Z]/.test(senha) && /[0-9]/.test(senha)) return 'forte';
    return 'media';
  };

  /**
   * Atualizar campo do formulário
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Limpar erro do campo
    if (errors[name as keyof FormErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }

    // Atualizar força da senha
    if (name === 'novaSenha') {
      setSenhaForca(verificarForcaSenha(value));
    }
  };

  /**
   * Validar formulário
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Nova Senha
    if (!formData.novaSenha) {
      newErrors.novaSenha = 'Nova senha é obrigatória';
    } else if (formData.novaSenha.length < 6) {
      newErrors.novaSenha = 'Senha deve ter pelo menos 6 caracteres';
    }

    // Confirmar Senha
    if (!formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Confirmação de senha é obrigatória';
    } else if (formData.novaSenha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Redefinir senha
   */
  const handleRedefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await redefinirSenha(token, formData.novaSenha);
      
      setSuccessMessage('Senha redefinida com sucesso!');
      setStep('sucesso');

      // Redirecionar após sucesso
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Erro ao redefinir senha:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Token inválido
  if (tokenInvalido) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4v2m0 0v-2m0 2h0m-9-9h18M4 5h16c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2z"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900">Link Inválido ou Expirado</h2>

              <p className="text-gray-600 text-sm">
                O link para redefinir sua senha é inválido ou expirou. 
                Links de redefinição são válidos por 1 hora.
              </p>

              <div className="space-y-3 pt-4">
                <Link to="/recuperar-senha">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    className="w-full"
                  >
                    Solicitar novo link
                  </Button>
                </Link>

                <Link to="/login">
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="w-full"
                  >
                    Voltar para Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-8 text-gray-600 text-sm">
            <p>© 2026 ReserveAqui. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    );
  }

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
          {step === 'form' ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Redefinir Senha</h2>
              <p className="text-gray-600 text-sm mb-6">
                Digite uma nova senha para sua conta.
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
              <form onSubmit={handleRedefinirSenha} className="space-y-4">
                {/* Nova Senha */}
                <div>
                  <Input
                    label="Nova Senha"
                    type="password"
                    name="novaSenha"
                    placeholder="Crie uma nova senha"
                    value={formData.novaSenha}
                    onChange={handleInputChange}
                    error={errors.novaSenha}
                    disabled={isLoading}
                  />
                  
                  {/* Indicador de força da senha */}
                  {formData.novaSenha && (
                    <div className="mt-2 space-y-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            senhaForca === 'fraca' 
                              ? 'bg-red-500' 
                              : senhaForca === 'media' 
                              ? 'bg-yellow-500' 
                              : 'bg-green-500'
                          }`}
                          style={{
                            width: senhaForca === 'fraca' ? '33%' : senhaForca === 'media' ? '66%' : '100%'
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-600">
                        Força: <span className="font-medium">
                          {senhaForca === 'fraca' ? 'Fraca' : senhaForca === 'media' ? 'Média' : 'Forte'}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirmar Nova Senha */}
                <Input
                  label="Confirmar Nova Senha"
                  type="password"
                  name="confirmarSenha"
                  placeholder="Confirme sua nova senha"
                  value={formData.confirmarSenha}
                  onChange={handleInputChange}
                  error={errors.confirmarSenha}
                  disabled={isLoading}
                />

                {/* Botão Redefinir */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full"
                >
                  Redefinir Senha
                </Button>
              </form>

              {/* Link voltar */}
              <div className="text-center mt-6">
                <Link to="/login" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Voltar para Login
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Tela de sucesso */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full animate-bounce">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <h2 className="text-2xl font-bold text-gray-900">Senha Redefinida!</h2>

                {successMessage && (
                  <div className="mb-4">
                    <Alert 
                      type="success" 
                      message={successMessage}
                    />
                  </div>
                )}

                <p className="text-gray-600 text-sm">
                  Sua senha foi alterada com sucesso. 
                  Você será redirecionado para o Login em instantes.
                </p>

                <Link to="/login">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    className="w-full mt-4"
                  >
                    Ir para Login agora
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Footer de página */}
        <div className="text-center mt-8 text-gray-600 text-sm">
          <p>© 2026 ReserveAqui. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
