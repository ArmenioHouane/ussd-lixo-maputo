import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Report, ReportStatus, HistoryEntry } from '../types';
import {
  createReport as dbCreate,
  getHistory as dbHistory,
  listReports as dbList,
  findReportByCode as dbFind,
  updateReportStatus as dbUpdate,
  resetDatabase as dbReset,
  stats as dbStats,
} from '../storage/database';

interface ReportsContextValue {
  reports: Report[];
  loading: boolean;
  refresh: () => Promise<void>;
  createReport: (input: {
    telefone: string;
    bairro: string;
    tipo_ocorrencia: string;
    ponto_referencia: string;
    origem?: 'USSD' | 'APP';
  }) => Promise<Report>;
  findReportByCode: (code: string) => Promise<Report | null>;
  updateReportStatus: (id: number, status: ReportStatus, observacao?: string) => Promise<boolean>;
  getHistory: (id: number) => Promise<HistoryEntry[]>;
  stats: () => Promise<{
    total: number;
    byStatus: Array<{ estado: ReportStatus; total: number }>;
    byNeighborhood: Array<{ bairro: string; total: number }>;
  }>;
  reset: () => Promise<void>;
}

const ReportsContext = createContext<ReportsContextValue | null>(null);

export const ReportsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await dbList();
    setReports(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<ReportsContextValue>(
    () => ({
      reports,
      loading,
      refresh,
      createReport: async (input) => {
        const created = await dbCreate(input);
        await refresh();
        return created;
      },
      findReportByCode: async (code) => dbFind(code),
      updateReportStatus: async (id, status, observacao) => {
        const ok = await dbUpdate(id, status, observacao);
        if (ok) await refresh();
        return ok;
      },
      getHistory: async (id) => dbHistory(id),
      stats: async () => dbStats(),
      reset: async () => {
        await dbReset();
        await refresh();
      },
    }),
    [reports, loading, refresh],
  );

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
};

export const useReports = (): ReportsContextValue => {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error('useReports deve ser usado dentro de ReportsProvider');
  return ctx;
};