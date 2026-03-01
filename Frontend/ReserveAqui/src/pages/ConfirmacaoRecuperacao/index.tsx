import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common';

/**
 * Página de Confirmação de Envio de Email de Recuperação
 */
export default function ConfirmacaoRecuperacao() {
  // const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Pegar email da query string se disponível
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Ícone de sucesso */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full animate-bounce">
              <svg
                className="w-10 h-10 text-green-600"
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
          </div>

          {/* Título */}
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Email enviado com sucesso!
          </h2>

          {/* Mensagem principal */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-gray-700 text-center">
              Enviamos um link de redefinição de senha para seu email
              {email && <span className="font-semibold"> ({email})</span>}.
            </p>
          </div>

          {/* Instruções */}
          <div className="space-y-4 mb-8">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
                  1
                </div>
              </div>
              <p className="text-gray-700 text-sm">
                Abra seu email e procure por um mensagem da ReserveAqui
              </p>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
                  2
                </div>
              </div>
              <p className="text-gray-700 text-sm">
                Clique no link "Redefinir Senha" fornecido no email
              </p>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
                  3
                </div>
              </div>
              <p className="text-gray-700 text-sm">
                Siga as instruções para criar uma nova senha
              </p>
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              💡 <strong>Dica:</strong> Se não encontrar o email na caixa de entrada, verifique a pasta de <strong>Spam</strong> ou <strong>Lixo</strong>.
            </p>
          </div>

          {/* Validade do link */}
          <div className="text-center text-gray-600 text-sm mb-6">
            <p>O link é válido por <strong>1 hora</strong>.</p>
          </div>

          {/* Botões */}
          <div className="space-y-3">
            {/* Voltar para Login */}
            <Link to="/login">
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full"
              >
                Voltar para Login
              </Button>
            </Link>

            {/* Tentar outro email */}
            <Link to="/recuperar-senha">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full"
              >
                Tentar outro email
              </Button>
            </Link>
          </div>

          {/* Suporte */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm mb-2">
              Precisa de ajuda?
            </p>
            <button
              onClick={() => {
                // Poderia abrir um chat ou página de suporte
                alert('Suporte em desenvolvimento');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Entre em contato com o suporte
            </button>
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
