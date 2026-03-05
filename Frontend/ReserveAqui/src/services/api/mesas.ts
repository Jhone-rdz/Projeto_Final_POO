import api from './config';
import type { Mesa, PaginatedResponse } from '../../types';

/**
 * Serviços para gerenciamento de mesas
 */
export const mesasService = {
  /**
   * Listar mesas
   */
  async listar(params?: {
    page?: number;
    restaurante?: number;
    status?: string;
    ativa?: boolean;
  }): Promise<PaginatedResponse<Mesa>> {
    const response = await api.get('/mesas/', { params });
    return response.data;
  },

  /**
   * Obter detalhes de uma mesa
   */
  async obter(id: number): Promise<Mesa> {
    const response = await api.get(`/mesas/${id}/`);
    return response.data;
  },

  /**
   * Criar nova mesa
   */
  async criar(data: { restaurante: number; numero: number }): Promise<Mesa> {
    const response = await api.post('/mesas/', data);
    return response.data;
  },

  /**
   * Atualizar mesa
   */
  async atualizar(id: number, data: Partial<Mesa>): Promise<Mesa> {
    const response = await api.patch(`/mesas/${id}/`, data);
    return response.data;
  },

  /**
   * Deletar mesa
   */
  async deletar(id: number): Promise<void> {
    await api.delete(`/mesas/${id}/`);
  },

  /**
   * Verificar disponibilidade de mesas em um restaurante
   */
  async verificarDisponibilidade(
    restaurante: number,
    dataReserva: string,
    horario: string,
    quantidadePessoas: number
  ): Promise<{ disponivel: boolean; mesas_necessarias: number; mensagem?: string }> {
    const response = await api.post('/mesas/verificar_disponibilidade/', {
      restaurante,
      data_reserva: dataReserva,
      horario,
      quantidade_pessoas: quantidadePessoas,
    });
    
    // Transformar resposta do backend para formato esperado pelo frontend
    const data = response.data;
    return {
      disponivel: data.mesas_disponiveis_suficientes === true && data.total_mesas_disponiveis > 0,
      mesas_necessarias: data.mesas_necessarias || 0,
      mensagem: data.total_mesas_disponiveis > 0 
        ? `${data.total_mesas_disponiveis} mesa(s) disponível(is)` 
        : 'Nenhuma mesa disponível',
    };
  },
};
