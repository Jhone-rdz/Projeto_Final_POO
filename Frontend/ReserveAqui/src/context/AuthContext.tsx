import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Usuario, LoginResponse } from '../types';
import { authService } from '../services/api';

/**
 * Interface do contexto de autenticação
 */
interface AuthContextType {
  // Estado
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Métodos
  login: (email: string, senha: string) => Promise<void>;
  cadastro: (userData: {
    username: string;
    nome: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  trocarSenha: (senhaAtual: string, novaSenha: string) => Promise<void>;
  solicitarRecuperacao: (email: string) => Promise<void>;
  redefinirSenha: (token: string, novaSenha: string) => Promise<void>;
  clearError: () => void;
}

// Criar o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider de autenticação
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carregar usuário ao montar o componente
   * Verifica se há um token salvo e carrega os dados do usuário
   */
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        try {
          const userData = await authService.me();
          setUsuario(userData);
          setError(null);
        } catch (err: any) {
          // Falha ao carregar usuário, limpar tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUsuario(null);
          setError(err.response?.data?.detail || 'Erro ao carregar dados do usuário');
        }
      }
      
      setIsLoading(false);
    };

    loadUser();
  }, []);

  /**
   * Fazer login
   */
  const login = async (email: string, senha: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response: LoginResponse = await authService.login(email, senha);
      
      // Salvar tokens
      authService.saveTokens(response.access, response.refresh);
      
      // Salvar usuário
      setUsuario(response.usuario);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erro ao fazer login';
      setError(errorMessage);
      setUsuario(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cadastrar novo usuário
   */
  const cadastro = async (userData: {
    username: string;
    nome: string;
    email: string;
    password: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.cadastro(userData);
      
      // Fazer login automático após cadastro
      await login(userData.email, userData.password);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erro ao criar conta';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fazer logout
   */
  const logout = () => {
    authService.logout();
    setUsuario(null);
    setError(null);
  };

  /**
   * Trocar senha
   */
  const trocarSenha = async (senhaAtual: string, novaSenha: string) => {
    setError(null);

    try {
      await authService.trocarSenha(senhaAtual, novaSenha);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erro ao trocar senha';
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Solicitar recuperação de senha
   */
  const solicitarRecuperacao = async (email: string) => {
    setError(null);

    try {
      await authService.solicitarRecuperacao(email);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erro ao solicitar recuperação';
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Redefinir senha com token
   */
  const redefinirSenha = async (token: string, novaSenha: string) => {
    setError(null);

    try {
      await authService.redefinirSenha(token, novaSenha);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erro ao redefinir senha';
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Limpar erro
   */
  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    usuario,
    isAuthenticated: !!usuario,
    isLoading,
    error,
    login,
    cadastro,
    logout,
    trocarSenha,
    solicitarRecuperacao,
    redefinirSenha,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para usar o contexto de autenticação
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  
  return context;
}
