import type { NeighborhoodOption, OccurrenceTypeOption, ReportStatus } from '../types';

export const APP_NAME = 'Denúncia de Lixo Maputo';

export const SERVICE_CODE = '*384*73407#';

export const DEFAULT_STATUS: ReportStatus = 'Recebida';

export const STATUSES: ReportStatus[] = [
  'Recebida',
  'Em Análise',
  'Encaminhada',
  'Em Atendimento',
  'Resolvida',
  'Rejeitada',
];

export const NEIGHBORHOODS: NeighborhoodOption[] = [
  { key: '1', label: 'Hulene' },
  { key: '2', label: 'Magoanine' },
  { key: '3', label: 'Zimpeto' },
  { key: '4', label: 'Inhagoia' },
  { key: '5', label: 'Outro' },
];

export const OCCURRENCE_TYPES: OccurrenceTypeOption[] = [
  { key: '1', label: 'Lixo Acumulado' },
  { key: '2', label: 'Contentor Cheio' },
  { key: '3', label: 'Lixo Em Vala De Drenagem' },
  { key: '4', label: 'Queimada De Lixo' },
  { key: '5', label: 'Outro' },
];

export const STATUS_INFO: Record<ReportStatus, { color: string; bg: string; icon: string }> = {
  Recebida: { color: '#0F5132', bg: '#D1FADF', icon: 'inbox' },
  'Em Análise': { color: '#7A4A00', bg: '#FEF0C7', icon: 'search' },
  Encaminhada: { color: '#1F3A8A', bg: '#DBEAFE', icon: 'paper-plane' },
  'Em Atendimento': { color: '#5C2C00', bg: '#FFE2CC', icon: 'tools' },
  Resolvida: { color: '#0B6B30', bg: '#C8F0D2', icon: 'check-circle' },
  Rejeitada: { color: '#7A1F1F', bg: '#FEE4E2', icon: 'times-circle' },
};