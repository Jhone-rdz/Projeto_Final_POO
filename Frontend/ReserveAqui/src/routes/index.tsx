import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Pages
import Home from '../pages/home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Reservations from '../pages/Reservations';
import Restaurants from '../pages/Restaurants';
import Profile from '../pages/Profile';

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
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Profile />
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
