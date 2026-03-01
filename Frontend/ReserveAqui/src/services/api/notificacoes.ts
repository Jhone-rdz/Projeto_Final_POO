import api from './config';
import type { Notificacao, PaginatedResponse } from '../../types';

/**
 * Serviços para gerenciamento de notificações
 */
export const notificacoesService = {
  /**
   * Listar notificações do usuário autenticado
   */
  async listar(params?: {
    page?: number;
    lido?: boolean;
  }): Promise<PaginatedResponse<Notificacao>> {
    const response = await api.get('/notificacoes/', { params });
    return response.data;
  },

  /**
   * Obter detalhes de uma notificação
   */
  async obter(id: number): Promise<Notificacao> {
    const response = await api.get(`/notificacoes/${id}/`);
    return response.data;
  },

  /**
   * Marcar notificação como lida
   */
  async marcarComoLida(id: number): Promise<Notificacao> {
    const response = await api.post(`/notificacoes/${id}/marcar_lida/`);
    return response.data;
  },

  /**
   * Marcar todas as notificações como lidas
   */
  async marcarTodasComoLidas(): Promise<{ mensagem: string }> {
    const response = await api.post('/notificacoes/marcar_todas_lidas/');
    return response.data;
  },

  /**
   * Obter contagem de notificações não lidas
   */
  async contarNaoLidas(): Promise<{ count: number }> {
    const response = await api.get('/notificacoes/contar_nao_lidas/');
    return response.data;
  },
};
