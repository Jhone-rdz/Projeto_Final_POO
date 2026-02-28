import api from './config';
import { Usuario, LoginResponse, CriarUsuarioDTO } from '../../types';

/**
 * Serviços de autenticação e gerenciamento de usuários
 */
export const authService = {
  /**
   * Realizar login
   */
  async login(email: string, senha: string): Promise<LoginResponse> {
    const response = await api.post('/usuarios/login/', { email, senha });
    return response.data;
  },

  /**
   * Cadastrar novo usuário (cliente)
   */
  async cadastro(userData: CriarUsuarioDTO): Promise<{ mensagem: string; usuario: Usuario }> {
    const response = await api.post('/usuarios/cadastro/', userData);
    return response.data;
  },

  /**
   * Obter dados do usuário autenticado
   */
  async me(): Promise<Usuario> {
    const response = await api.get('/usuarios/me/');
    return response.data;
  },

  /**
   * Trocar senha do usuário autenticado
   */
  async trocarSenha(senhaAtual: string, novaSenha: string): Promise<{ mensagem: string }> {
    const response = await api.post('/usuarios/trocar_senha/', {
      senha_atual: senhaAtual,
      nova_senha: novaSenha,
      confirmacao_senha: novaSenha,
    });
    return response.data;
  },

  /**
   * Solicitar recuperação de senha
   */
  async solicitarRecuperacao(email: string): Promise<{ mensagem: string }> {
    const response = await api.post('/usuarios/solicitar_recuperacao/', { email });
    return response.data;
  },

  /**
   * Redefinir senha com token
   */
  async redefinirSenha(token: string, novaSenha: string): Promise<{ mensagem: string }> {
    const response = await api.post('/usuarios/redefinir_senha/', {
      token,
      nova_senha: novaSenha,
      confirmacao_senha: novaSenha,
    });
    return response.data;
  },

  /**
   * Fazer logout (limpar tokens do localStorage)
   */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  /**
   * Verificar se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Salvar tokens no localStorage
   */
  saveTokens(access: string, refresh: string): void {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  },
};
