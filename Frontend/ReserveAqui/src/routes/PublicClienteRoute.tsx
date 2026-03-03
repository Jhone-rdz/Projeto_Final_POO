import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context';

interface PublicClienteRouteProps {
  children: ReactNode;
}

export function PublicClienteRoute({ children }: PublicClienteRouteProps) {
  const { isAuthenticated, isLoading, usuario } = useAuth();

  if (isLoading) return <>{children}</>;
  if (!isAuthenticated) return <>{children}</>;

  const isAdminSistema = usuario?.papeis?.some((p) => p.tipo === 'admin_sistema');
  const isAdminSecundario = usuario?.papeis?.some((p) => p.tipo === 'admin_secundario');
  const isFuncionario = usuario?.papeis?.some((p) => p.tipo === 'funcionario');

  if (isAdminSistema) return <Navigate to="/admin/dashboard" replace />;
  if (isAdminSecundario) return <Navigate to="/owner/dashboard" replace />;
  if (isFuncionario) return <Navigate to="/staff/dashboard" replace />;

  return <>{children}</>;
}
