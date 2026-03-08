// ========================================
// Tipos de Papel (Roles)
// ========================================

export type TipoPapel = 'admin_sistema' | 'admin_secundario' | 'funcionario' | 'cliente';

export interface Papel {
  id: number;
  tipo: TipoPapel;
  descricao: string;
  data_criacao: string;
}

// ========================================
// Usuário
// ========================================

export interface Usuario {
  id: number;
  username: string;
  nome: string;
  email: string;
  papeis: Papel[];
  precisa_trocar_senha: boolean;
  date_joined?: string;
  is_active?: boolean;
}

// ========================================
// Restaurante
// ========================================

export interface Restaurante {
  id: number;
  nome: string;
  descricao: string;
  horario_funcionamento?: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  proprietario: number; // ID do usuário proprietário
  proprietario_nome?: string; // Nome do proprietário (readonly)
  mesas_disponiveis?: number;
  quantidade_mesas: number;
  ativo: boolean;
  data_criacao: string;
  data_atualizacao: string;
}

// ========================================
// Mesa
// ========================================

export type StatusMesa = 'disponivel' | 'ocupada';

export interface Mesa {
  id: number;
  restaurante: number; // ID do restaurante
  numero: number;
  status: StatusMesa;
  ativa: boolean;
  capacidade: number; // Sempre 4 pessoas
  data_criacao: string;
  data_atualizacao: string;
}

// ========================================
// Reserva
// ========================================

export type StatusReserva = 'pendente' | 'confirmada' | 'cancelada' | 'concluida';

export interface Reserva {
  id: number;
  restaurante: number; // ID do restaurante
  usuario?: number | null; // ID do usuário (opcional)
  mesas: number[]; // IDs das mesas reservadas
  data_reserva: string; // Formato: YYYY-MM-DD
  horario: string; // Formato: HH:MM:SS
  quantidade_pessoas: number;
  nome_cliente: string;
  telefone_cliente: string;
  email_cliente?: string;
  observacoes?: string;
  status: StatusReserva;
  data_criacao: string;
  data_atualizacao: string;
}

// ========================================
// DTOs para criação/atualização
// ========================================

export interface CriarUsuarioDTO {
  nome: string;
  email: string;
  password: string;
  password_confirm: string;
}

export interface CriarRestauranteDTO {
  nome: string;
  descricao?: string;
  horario_funcionamento?: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone?: string;
  email: string;
  proprietario_email?: string; // Para criar novo proprietário
  proprietario_nome?: string; // Para criar novo proprietário
  quantidade_mesas?: number;
}

export interface CriarReservaDTO {
  restaurante: number;
  data_reserva: string;
  horario: string;
  quantidade_pessoas: number;
  nome_cliente: string;
  telefone_cliente: string;
  email_cliente?: string;
  observacoes?: string;
}

export interface AtualizarReservaDTO {
  data_reserva?: string;
  horario?: string;
  quantidade_pessoas?: number;
  nome_cliente?: string;
  telefone_cliente?: string;
  email_cliente?: string;
  observacoes?: string;
  status?: StatusReserva;
}

// ========================================
// Responses de Autenticação
// ========================================

export interface LoginResponse {
  access: string;
  refresh: string;
  usuario: Usuario;
}

export interface TokenRefreshResponse {
  access: string;
}

// ========================================
// Notificação
// ========================================

export type TipoNotificacao = 'confirmacao' | 'cancelamento' | 'lembranca' | 'atualizacao';

export interface Notificacao {
  id: number;
  usuario?: number; // compatibilidade
  reserva?: number; // compatibilidade
  tipo: TipoNotificacao;
  get_tipo_display?: string;
  titulo: string;
  mensagem: string;
  lido: boolean;
  reserva_id?: number;
  reserva_restaurante?: string;
  reserva_data?: string;
  reserva_horario?: string;
  data_criacao: string;
  data_leitura?: string | null;
}

// ========================================
// Tipos auxiliares
// ========================================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  message?: string;
  [key: string]: any;
}

// ========================================
// Relatórios
// ========================================

export interface RelatorioOcupacaoItem {
  restaurante_id: number;
  restaurante_nome: string;
  data: string;
  total_mesas: number;
  mesas_ocupadas: number;
  percentual_ocupacao: string;
  reservas_confirmadas: number;
  reservas_pendentes: number;
}

export interface RelatorioHorariosItem {
  restaurante_id: number;
  restaurante_nome: string;
  horario: string;
  total_reservas: number;
  pessoas_total: number;
  taxa_confirmacao: string;
}

export interface RelatorioEstatisticasItem {
  periodo: string;
  total_reservas: number;
  reservas_confirmadas: number;
  reservas_canceladas: number;
  reservas_pendentes: number;
  pessoas_total: number;
  ticket_medio: string;
  taxa_cancelamento: string;
}

export interface RelatorioOcupacaoResponse {
  periodo_inicio: string;
  periodo_fim: string;
  total_registros: number;
  dados: RelatorioOcupacaoItem[];
}

export interface RelatorioHorariosResponse {
  periodo_inicio: string;
  periodo_fim: string;
  total_registros: number;
  dados: RelatorioHorariosItem[];
}

export interface RelatorioEstatisticasResponse {
  periodo_inicio: string;
  periodo_fim: string;
  tipo_periodo: 'dia' | 'semana' | 'mes';
  total_registros: number;
  dados: RelatorioEstatisticasItem[];
}
