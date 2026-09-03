export type ReportStatus =
  | 'Recebida'
  | 'Em Análise'
  | 'Encaminhada'
  | 'Em Atendimento'
  | 'Resolvida'
  | 'Rejeitada';

export type ReportOrigin = 'USSD' | 'APP';

export interface Report {
  id: number;
  codigo: string;
  telefone: string;
  bairro: string;
  tipo_ocorrencia: string;
  ponto_referencia: string;
  estado: ReportStatus;
  origem: ReportOrigin;
  created_at: string;
  updated_at: string;
}

export interface HistoryEntry {
  id: number;
  denuncia_id: number;
  estado_anterior: ReportStatus | null;
  estado_novo: ReportStatus;
  observacao: string;
  created_at: string;
}

export interface DatabaseShape {
  last_id: number;
  reports: Report[];
  history: HistoryEntry[];
}

export interface CatalogEntry {
  key: string;
  label: string;
}

export interface NeighborhoodOption extends CatalogEntry {}
export interface OccurrenceTypeOption extends CatalogEntry {}