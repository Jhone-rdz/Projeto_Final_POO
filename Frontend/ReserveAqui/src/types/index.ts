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
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  proprietario: number; // ID do usuário proprietário
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
  username: string;
  nome: string;
  email: string;
  password: string;
}

export interface CriarRestauranteDTO {
  nome: string;
  descricao?: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone?: string;
  email: string;
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
  usuario: number; // ID do usuário
  reserva: number; // ID da reserva
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  lido: boolean;
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
