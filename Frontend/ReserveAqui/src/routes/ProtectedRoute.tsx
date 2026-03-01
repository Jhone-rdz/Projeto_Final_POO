import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context';
import type { TipoPapel } from '../types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: TipoPapel[];
}

/**
 * Componente para proteger rotas
 * Redireciona para login se não autenticado
 * Opcionalmente verifica roles específicas
 */
export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, usuario } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar roles se especificadas
  if (requiredRoles && requiredRoles.length > 0) {
    const userRoles = usuario?.papeis?.map((p) => p.tipo) || [];
    const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Acesso Negado</h1>
            <p className="text-gray-600 mb-6">
              Você não tem permissão para acessar esta página.
            </p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Voltar para Home
            </a>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
