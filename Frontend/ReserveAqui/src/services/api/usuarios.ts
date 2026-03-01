import api from './config';
import type { Usuario, CriarUsuarioDTO, PaginatedResponse } from '../../types';

/**
 * Serviços para gerenciamento de usuários
 */
export const usuariosService = {
  /**
   * Listar usuários
   */
  async listar(params?: {
    page?: number;
    search?: string;
    papel?: string;
    restaurante?: number;
  }): Promise<PaginatedResponse<Usuario>> {
    const response = await api.get('/usuarios/', { params });
    return response.data;
  },

  /**
   * Obter detalhes de um usuário
   */
  async obter(id: number): Promise<Usuario> {
    const response = await api.get(`/usuarios/${id}/`);
    return response.data;
  },

  /**
   * Criar novo usuário (funcionário, admin)
   */
  async criar(data: CriarUsuarioDTO & { 
    papel?: string; 
    restaurante?: number;
    senha?: string;
  }): Promise<Usuario> {
    const response = await api.post('/usuarios/', data);
    return response.data;
  },

  /**
   * Atualizar usuário
   */
  async atualizar(id: number, data: Partial<Usuario>): Promise<Usuario> {
    const response = await api.patch(`/usuarios/${id}/`, data);
    return response.data;
  },

  /**
   * Deletar usuário
   */
  async deletar(id: number): Promise<void> {
    await api.delete(`/usuarios/${id}/`);
  },
};
