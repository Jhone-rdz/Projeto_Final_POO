import api from './config';
import { Restaurante, CriarRestauranteDTO, PaginatedResponse } from '../../types';

/**
 * Serviços para gerenciamento de restaurantes
 */
export const restaurantesService = {
  /**
   * Listar todos os restaurantes
   */
  async listar(params?: {
    page?: number;
    search?: string;
    cidade?: string;
    ativo?: boolean;
  }): Promise<PaginatedResponse<Restaurante>> {
    const response = await api.get('/restaurantes/', { params });
    return response.data;
  },

  /**
   * Obter detalhes de um restaurante
   */
  async obter(id: number): Promise<Restaurante> {
    const response = await api.get(`/restaurantes/${id}/`);
    return response.data;
  },

  /**
   * Criar novo restaurante
   */
  async criar(data: CriarRestauranteDTO): Promise<Restaurante> {
    const response = await api.post('/restaurantes/', data);
    return response.data;
  },

  /**
   * Atualizar restaurante
   */
  async atualizar(id: number, data: Partial<CriarRestauranteDTO>): Promise<Restaurante> {
    const response = await api.put(`/restaurantes/${id}/`, data);
    return response.data;
  },

  /**
   * Atualização parcial de restaurante
   */
  async atualizarParcial(id: number, data: Partial<CriarRestauranteDTO>): Promise<Restaurante> {
    const response = await api.patch(`/restaurantes/${id}/`, data);
    return response.data;
  },

  /**
   * Deletar restaurante
   */
  async deletar(id: number): Promise<void> {
    await api.delete(`/restaurantes/${id}/`);
  },

  /**
   * Obter restaurantes do usuário autenticado (proprietário)
   */
  async meusRestaurantes(): Promise<Restaurante[]> {
    const response = await api.get('/restaurantes-usuarios/meus_restaurantes/');
    return response.data;
  },
};
