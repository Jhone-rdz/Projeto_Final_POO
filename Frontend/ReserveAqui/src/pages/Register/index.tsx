import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context';
import { Input, Button, Alert } from '../../components/common';

interface FormErrors {
  nome?: string;
  email?: string;
  senha?: string;
  confirmarSenha?: string;
}

/**
 * Página de Cadastro
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
    if (name === 'senha') {
      setSenhaForca(verificarForcaSenha(value));
    }
  };

  /**
   * Validar formulário
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Nome
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (formData.nome.trim().length < 3) {
      newErrors.nome = 'Nome deve ter pelo menos 3 caracteres';
    }

    // Email
    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Senha
    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    // Confirmar Senha
    if (!formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Confirmação de senha é obrigatória';
    } else if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Fazer cadastro
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await cadastro({
        username: formData.email.split('@')[0], // username derivado do email
        nome: formData.nome,
        email: formData.email,
        password: formData.senha,
      });

      setSuccessMessage('Cadastro realizado com sucesso! Redirecionando...');

      // Redirecionar após sucesso
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error('Erro ao cadastrar:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cor da força da senha
   */
  const formaCorSenha = {
    fraca: 'bg-red-500',
    media: 'bg-yellow-500',
    forte: 'bg-green-500',
  };

  const formaTextaSenha = {
    fraca: 'Fraca',
    media: 'Média',
    forte: 'Forte',
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Crie sua conta</h2>

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
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Nome */}
            <Input
              label="Nome completo"
              type="text"
              name="nome"
              placeholder="Seu nome completo"
              value={formData.nome}
              onChange={handleInputChange}
              error={errors.nome}
              disabled={isLoading}
            />

            {/* Email */}
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              disabled={isLoading}
            />

            {/* Senha */}
            <div>
              <Input
                label="Senha"
                type="password"
                name="senha"
                placeholder="Crie uma senha"
                value={formData.senha}
                onChange={handleInputChange}
                error={errors.senha}
                disabled={isLoading}
              />
              
              {/* Indicador de força da senha */}
              {formData.senha && (
                <div className="mt-2 space-y-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${formaCorSenha[senhaForca]}`}
                      style={{
                        width: senhaForca === 'fraca' ? '33%' : senhaForca === 'media' ? '66%' : '100%'
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    Força: <span className="font-medium">{formaTextaSenha[senhaForca]}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirmar Senha */}
            <Input
              label="Confirmar senha"
              type="password"
              name="confirmarSenha"
              placeholder="Confirme sua senha"
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
              className="w-full"
            >
              Criar conta
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

          {/* Link para Login */}
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Entre aqui
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
