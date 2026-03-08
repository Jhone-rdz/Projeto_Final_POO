import api from './config';
import type {
  Reserva,
  CriarReservaDTO,
  AtualizarReservaDTO,
  PaginatedResponse,
  RelatorioOcupacaoResponse,
  RelatorioHorariosResponse,
  RelatorioEstatisticasResponse,
} from '../../types';

/**
 * Serviços para gerenciamento de reservas
 */
export const reservasService = {
  /**
   * Listar reservas
   */
  async listar(params?: {
    page?: number;
    restaurante?: number;
    status?: string;
    data_reserva?: string;
    search?: string;
  }): Promise<PaginatedResponse<Reserva>> {
    const response = await api.get('/reservas/', { params });
    return response.data;
  },

  /**
   * Obter detalhes de uma reserva
   */
  async obter(id: number): Promise<Reserva> {
    const response = await api.get(`/reservas/${id}/`);
    return response.data;
  },

  /**
   * Criar nova reserva
   */
  async criar(data: CriarReservaDTO): Promise<Reserva> {
    const response = await api.post('/reservas/', data);
    return response.data;
  },

  /**
   * Atualizar reserva
   */
  async atualizar(id: number, data: AtualizarReservaDTO): Promise<Reserva> {
    const response = await api.patch(`/reservas/${id}/`, data);
    return response.data;
  },

  /**
   * Deletar reserva
   */
  async deletar(id: number): Promise<void> {
    await api.delete(`/reservas/${id}/`);
  },

  /**
   * Confirmar reserva
   */
  async confirmar(id: number): Promise<{ mensagem: string; reserva: Reserva }> {
    const response = await api.post(`/reservas/${id}/confirmar/`);
    return response.data;
  },

  /**
   * Cancelar reserva
   */
  async cancelar(id: number, motivo?: string): Promise<{ mensagem: string; reserva: Reserva }> {
    const response = await api.post(`/reservas/${id}/cancelar/`, { motivo });
    return response.data;
  },

  /**
   * Concluir reserva
   */
  async concluir(id: number): Promise<{ mensagem: string; reserva: Reserva }> {
    const response = await api.post(`/reservas/${id}/concluir/`);
    return response.data;
  },

  /**
   * Listar minhas reservas (do usuário autenticado)
   */
  async minhasReservas(params?: {
    page?: number;
    status?: string;
  }): Promise<PaginatedResponse<Reserva>> {
    const response = await api.get('/reservas/minhas_reservas/', { params });
    return response.data;
  },

  /**
   * Obter reservas de hoje para um restaurante
   */
  async reservasHoje(restauranteId: number): Promise<Reserva[]> {
    const response = await api.get(`/reservas/hoje/`, {
      params: { restaurante: restauranteId },
    });
    return response.data;
  },

  /**
   * Relatório de ocupação
   */
  async ocupacao(params?: {
    restaurante_id?: number;
    data_inicio?: string;
    data_fim?: string;
  }): Promise<RelatorioOcupacaoResponse> {
    const response = await api.get('/reservas/ocupacao/', { params });
    return response.data;
  },

  /**
   * Relatório de horários mais movimentados
   */
  async horariosMovimentados(params?: {
    restaurante_id?: number;
    data_inicio?: string;
    data_fim?: string;
    top?: number;
  }): Promise<RelatorioHorariosResponse> {
    const response = await api.get('/reservas/horarios_movimentados/', { params });
    return response.data;
  },

  /**
   * Estatísticas por período (dia, semana, mês)
   */
  async estatisticasPeriodo(params?: {
    restaurante_id?: number;
    data_inicio?: string;
    data_fim?: string;
    tipo_periodo?: 'dia' | 'semana' | 'mes';
  }): Promise<RelatorioEstatisticasResponse> {
    const response = await api.get('/reservas/estatisticas_periodo/', { params });
    return response.data;
  },

  /**
   * Compatibilidade retroativa com chamadas antigas
   */
  async relatorioOcupacao(
    restauranteId: number,
    dataInicio: string,
    dataFim: string
  ): Promise<RelatorioOcupacaoResponse> {
    return this.ocupacao({
      restaurante_id: restauranteId,
      data_inicio: dataInicio,
      data_fim: dataFim,
    });
  },
};
