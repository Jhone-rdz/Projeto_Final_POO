import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Pages
import { Home } from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import RecuperarSenha from '../pages/RecuperarSenha';
import ConfirmacaoRecuperacao from '../pages/ConfirmacaoRecuperacao';
import RedefinirSenha from '../pages/RedefinirSenha';
import Reservations from '../pages/Reservations';
import Restaurants from '../pages/Restaurants';
import RestauranteDetalhes from '../pages/RestauranteDetalhes';
import Reserva from '../pages/Reserva';
import Profile from '../pages/Profile';
import StaffDashboard from '../pages/Staff/Dashboard';
import OwnerDashboard from '../pages/Owner/Dashboard';
import RestaurantProfile from '../pages/Owner/Restaurant';
import AdminDashboard from '../pages/Admin/Dashboard';

/**
 * Configuração de rotas da aplicação
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/recuperar-senha',
    element: <RecuperarSenha />,
  },
  {
    path: '/confirmacao-recuperacao',
    element: <ConfirmacaoRecuperacao />,
  },
  {
    path: '/redefinir-senha',
    element: <RedefinirSenha />,
  },
  {
    path: '/reservations',
    element: (
      <ProtectedRoute>
        <Reservations />
      </ProtectedRoute>
    ),
  },
  {
    path: '/restaurants',
    element: <Restaurants />,
  },
  {
    path: '/restaurantes/:id',
    element: <RestauranteDetalhes />,
  },
  {
    path: '/reserva/:id',
    element: <Reserva />,
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/staff/dashboard',
    element: (
      <ProtectedRoute requiredRoles={['funcionario']}>
        <StaffDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/owner/dashboard',
    element: (
      <ProtectedRoute requiredRoles={['admin_secundario']}>
        <OwnerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/owner/restaurant',
    element: (
      <ProtectedRoute requiredRoles={['admin_secundario']}>
        <RestaurantProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/dashboard',
    element: (
      <ProtectedRoute requiredRoles={['admin_sistema']}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  // Rota 404 - Page Not Found
  {
    path: '*',
    element: (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
          <p className="text-gray-600 mb-8">Página não encontrada</p>
          <a href="/" className="text-blue-600 hover:underline">
            Voltar para home
          </a>
        </div>
      </div>
    ),
  },
]);
