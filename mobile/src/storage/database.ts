import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DatabaseShape, HistoryEntry, Report, ReportStatus } from '../types';
import { DEFAULT_STATUS } from '../data/catalog';

const STORAGE_KEY = '@ussd-lixo-maputo/database';

const emptyDb = (): DatabaseShape => ({
  last_id: 0,
  reports: [],
  history: [],
});

const sanitizeText = (value: string, max = 180): string =>
  value.replace(/\s+/g, ' ').trim().slice(0, max);

const generateCode = (existing: Report[]): string => {
  const datePart = new Date();
  const yy = String(datePart.getFullYear()).slice(2);
  const mm = String(datePart.getMonth() + 1).padStart(2, '0');
  const dd = String(datePart.getDate()).padStart(2, '0');
  const prefix = `DLX-${yy}${mm}${dd}-`;

  let attempt = 0;
  let code = '';
  do {
    attempt += 1;
    const random = Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, 'X');
    code = `${prefix}${random.slice(0, 6)}`;
    if (attempt > 10) {
      code = `${prefix}${Date.now().toString(36).toUpperCase().slice(-6)}`;
      break;
    }
  } while (existing.some((r) => r.codigo === code));

  return code;
};

export const loadDatabase = async (): Promise<DatabaseShape> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const fresh = emptyDb();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<DatabaseShape>;
    return {
      last_id: parsed.last_id ?? 0,
      reports: Array.isArray(parsed.reports) ? (parsed.reports as Report[]) : [],
      history: Array.isArray(parsed.history) ? (parsed.history as HistoryEntry[]) : [],
    };
  } catch {
    const fresh = emptyDb();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }
};

const persist = async (db: DatabaseShape): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

export interface CreateReportInput {
  telefone: string;
  bairro: string;
  tipo_ocorrencia: string;
  ponto_referencia: string;
  origem?: 'USSD' | 'APP';
  estado?: ReportStatus;
}

export const createReport = async (
  input: CreateReportInput,
): Promise<Report> => {
  const db = await loadDatabase();
  const now = new Date().toISOString();
  const id = db.last_id + 1;
  const estado = input.estado ?? DEFAULT_STATUS;
  const report: Report = {
    id,
    codigo: generateCode(db.reports),
    telefone: sanitizeText(input.telefone || 'unknown'),
    bairro: sanitizeText(input.bairro),
    tipo_ocorrencia: sanitizeText(input.tipo_ocorrencia),
    ponto_referencia: sanitizeText(input.ponto_referencia),
    estado,
    origem: input.origem ?? 'APP',
    created_at: now,
    updated_at: now,
  };

  const historyEntry: HistoryEntry = {
    id: db.history.length + 1,
    denuncia_id: id,
    estado_anterior: null,
    estado_novo: estado,
    observacao: `Denúncia criada pelo canal ${report.origem}.`,
    created_at: now,
  };

  const next: DatabaseShape = {
    last_id: id,
    reports: [...db.reports, report],
    history: [...db.history, historyEntry],
  };

  await persist(next);
  return report;
};

export const findReportByCode = async (code: string): Promise<Report | null> => {
  const db = await loadDatabase();
  const target = code.trim().toUpperCase();
  return db.reports.find((r) => r.codigo.toUpperCase() === target) ?? null;
};

export const listReports = async (filters?: {
  estado?: ReportStatus | null;
  bairro?: string | null;
}): Promise<Report[]> => {
  const db = await loadDatabase();
  const estado = filters?.estado?.trim() ?? '';
  const bairro = filters?.bairro?.trim().toLowerCase() ?? '';

  const filtered = db.reports.filter((r) => {
    if (estado && r.estado !== estado) return false;
    if (bairro && !r.bairro.toLowerCase().includes(bairro)) return false;
    return true;
  });

  return [...filtered].sort((a, b) => b.id - a.id);
};

export const updateReportStatus = async (
  id: number,
  newStatus: ReportStatus,
  observacao?: string,
): Promise<boolean> => {
  const db = await loadDatabase();
  const target = db.reports.find((r) => r.id === id);
  if (!target) return false;

  const now = new Date().toISOString();
  const previousStatus = target.estado;
  target.estado = newStatus;
  target.updated_at = now;

  const historyEntry: HistoryEntry = {
    id: db.history.length + 1,
    denuncia_id: id,
    estado_anterior: previousStatus,
    estado_novo: newStatus,
    observacao: sanitizeText(observacao || 'Estado actualizado pela app mobile.'),
    created_at: now,
  };

  await persist({
    ...db,
    reports: db.reports.map((r) => (r.id === id ? target : r)),
    history: [...db.history, historyEntry],
  });
  return true;
};

export const getHistory = async (denunciaId: number): Promise<HistoryEntry[]> => {
  const db = await loadDatabase();
  return db.history
    .filter((h) => h.denuncia_id === denunciaId)
    .sort((a, b) => a.id - b.id);
};

export const stats = async (): Promise<{
  total: number;
  byStatus: Array<{ estado: ReportStatus; total: number }>;
  byNeighborhood: Array<{ bairro: string; total: number }>;
}> => {
  const db = await loadDatabase();
  const byStatusMap = new Map<ReportStatus, number>();
  const byNeighborhoodMap = new Map<string, number>();

  for (const report of db.reports) {
    byStatusMap.set(report.estado, (byStatusMap.get(report.estado) ?? 0) + 1);
    byNeighborhoodMap.set(report.bairro, (byNeighborhoodMap.get(report.bairro) ?? 0) + 1);
  }

  const byStatus = Array.from(byStatusMap.entries())
    .map(([estado, total]) => ({ estado, total }))
    .sort((a, b) => b.total - a.total);

  const byNeighborhood = Array.from(byNeighborhoodMap.entries())
    .map(([bairro, total]) => ({ bairro, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return { total: db.reports.length, byStatus, byNeighborhood };
};

export const resetDatabase = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};