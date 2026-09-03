import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ScreenContainer, ScreenHeader } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { useReports } from '../context/ReportsContext';
import { STATUSES } from '../data/catalog';
import type { Report, ReportStatus } from '../types';
import { colors, radius, spacing, typography } from '../theme';

interface ReportsScreenProps {
  onOpenReport: (code: string) => void;
  refreshKey?: number;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ onOpenReport, refreshKey }) => {
  const { reports, loading, refresh } = useReports();
  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'TODOS'>('TODOS');

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  const filtered = filterStatus === 'TODOS' ? reports : reports.filter((r) => r.estado === filterStatus);

  return (
    <>
      <ScreenHeader
        title="Denúncias registadas"
        subtitle={`${reports.length} denúncia${reports.length === 1 ? '' : 's'} no dispositivo`}
        icon="format-list-bulleted"
      />
      <ScreenContainer scroll={false}>
        <Card title="Filtrar por estado">
          <View style={styles.filterRow}>
            <FilterChip
              label="Todos"
              active={filterStatus === 'TODOS'}
              onPress={() => setFilterStatus('TODOS')}
            />
            {STATUSES.map((s) => (
              <FilterChip
                key={s}
                label={s}
                active={filterStatus === s}
                onPress={() => setFilterStatus(s)}
              />
            ))}
          </View>
        </Card>

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ReportItem report={item} onOpen={() => onOpenReport(item.codigo)} />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="inbox-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {loading ? 'A carregar...' : 'Sem denúncias para mostrar'}
              </Text>
              <Text style={styles.emptyHint}>
                Use o menu principal para criar a sua primeira denúncia.
              </Text>
            </View>
          }
        />
      </ScreenContainer>
    </>
  );
};

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, active, onPress }) => (
  <View style={[styles.chip, active && styles.chipActive]}>
    <Text
      onPress={onPress}
      style={[styles.chipLabel, active && styles.chipLabelActive]}
    >
      {label}
    </Text>
  </View>
);

const ReportItem: React.FC<{ report: Report; onOpen: () => void }> = ({ report, onOpen }) => (
  <Card style={styles.reportCard}>
    <View style={styles.reportHeader}>
      <Text style={styles.code}>{report.codigo}</Text>
      <StatusBadge status={report.estado} small />
    </View>
    <Text style={styles.bairro}>{report.bairro} • {report.tipo_ocorrencia}</Text>
    <Text style={styles.reference} numberOfLines={2}>
      {report.ponto_referencia}
    </Text>
    <Text style={styles.meta}>
      {new Date(report.created_at).toLocaleString('pt-PT')} • Origem: {report.origem}
    </Text>
    <Button label="Ver detalhes" variant="secondary" onPress={onOpen} fullWidth={false} />
  </Card>
);

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  chipLabel: { ...typography.label, color: colors.textSecondary },
  chipLabelActive: { color: colors.white },

  list: { paddingBottom: spacing.xl },
  reportCard: { marginBottom: spacing.sm },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  code: { ...typography.subtitle, color: colors.primary, fontWeight: '700' },
  bairro: { ...typography.body, color: colors.textPrimary, marginBottom: 4 },
  reference: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  meta: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },

  empty: { alignItems: 'center', padding: spacing.xl },
  emptyTitle: { ...typography.subtitle, color: colors.textPrimary, marginTop: spacing.sm },
  emptyHint: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
});