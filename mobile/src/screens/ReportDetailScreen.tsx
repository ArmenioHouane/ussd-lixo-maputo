import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { InfoRow } from '../components/InfoRow';
import { ScreenContainer, ScreenHeader } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { useReports } from '../context/ReportsContext';
import { STATUSES } from '../data/catalog';
import type { HistoryEntry, Report, ReportStatus } from '../types';
import { colors, radius, spacing, typography } from '../theme';

interface ReportDetailScreenProps {
  code: string;
  onBack: () => void;
  onReportChanged: () => void;
}

export const ReportDetailScreen: React.FC<ReportDetailScreenProps> = ({
  code,
  onBack,
  onReportChanged,
}) => {
  const { findReportByCode, getHistory, updateReportStatus } = useReports();
  const [report, setReport] = useState<Report | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | null>(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const r = await findReportByCode(code);
    setReport(r);
    if (r) {
      setSelectedStatus(r.estado);
      const h = await getHistory(r.id);
      setHistory(h);
    } else {
      setHistory([]);
    }
    setLoading(false);
  }, [code, findReportByCode, getHistory]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdate = async () => {
    if (!report || !selectedStatus) return;
    if (selectedStatus === report.estado) {
      Alert.alert('Sem alterações', 'O estado seleccionado é igual ao actual.');
      return;
    }
    setUpdating(true);
    const ok = await updateReportStatus(report.id, selectedStatus, note);
    setUpdating(false);
    if (ok) {
      setNote('');
      await load();
      onReportChanged();
    } else {
      Alert.alert('Erro', 'Não foi possível actualizar o estado.');
    }
  };

  return (
    <>
      <ScreenHeader
        title={loading ? 'A carregar...' : report ? 'Detalhes da denúncia' : 'Denúncia não encontrada'}
        subtitle={report ? `Código ${report.codigo}` : 'Verifique o código inserido'}
        icon="file-document-outline"
      />
      <ScreenContainer>
        {loading ? (
          <Card>
            <Text style={styles.muted}>A consultar a base de dados local...</Text>
          </Card>
        ) : !report ? (
          <Card title="Sem resultados">
            <Text style={styles.muted}>
              Nenhuma denúncia encontrada com o código "{code}".
            </Text>
            <Button label="Voltar" variant="secondary" onPress={onBack} />
          </Card>
        ) : (
          <>
            <Card>
              <View style={styles.statusRow}>
                <StatusBadge status={report.estado} />
                <Text style={styles.code}>{report.codigo}</Text>
              </View>
              <InfoRow label="Bairro" value={report.bairro} />
              <InfoRow label="Tipo de ocorrência" value={report.tipo_ocorrencia} />
              <InfoRow label="Ponto de referência" value={report.ponto_referencia} />
              <InfoRow label="Telefone" value={report.telefone} />
              <InfoRow
                label="Registada em"
                value={new Date(report.created_at).toLocaleString('pt-PT')}
              />
              <InfoRow
                label="Última actualização"
                value={new Date(report.updated_at).toLocaleString('pt-PT')}
              />
              <InfoRow label="Origem" value={report.origem} />
            </Card>

            <Card title="Actualizar estado">
              <Text style={styles.label}>Novo estado</Text>
              <View style={styles.statusGrid}>
                {STATUSES.map((s) => (
                  <StatusOption
                    key={s}
                    status={s}
                    active={selectedStatus === s}
                    onPress={() => setSelectedStatus(s)}
                  />
                ))}
              </View>
              <Text style={styles.label}>Observação (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: Equipa enviada ao local."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                value={note}
                onChangeText={setNote}
              />
              <Button
                label={updating ? 'A guardar...' : 'Guardar actualização'}
                onPress={handleUpdate}
                loading={updating}
              />
            </Card>

            <Card title="Histórico" subtitle={`${history.length} evento(s)`}>
              {history.length === 0 ? (
                <Text style={styles.muted}>Sem eventos registados.</Text>
              ) : (
                history.map((entry) => (
                  <View key={entry.id} style={styles.historyItem}>
                    <MaterialCommunityIcons
                      name="circle-medium"
                      size={20}
                      color={colors.primary}
                    />
                    <View style={styles.historyBody}>
                      <Text style={styles.historyTitle}>
                        {entry.estado_anterior ? `${entry.estado_anterior} → ` : ''}
                        {entry.estado_novo}
                      </Text>
                      <Text style={styles.historyDate}>
                        {new Date(entry.created_at).toLocaleString('pt-PT')}
                      </Text>
                      {entry.observacao ? (
                        <Text style={styles.historyNote}>{entry.observacao}</Text>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </Card>

            <Button label="Voltar" variant="ghost" onPress={onBack} />
          </>
        )}
      </ScreenContainer>
    </>
  );
};

interface StatusOptionProps {
  status: ReportStatus;
  active: boolean;
  onPress: () => void;
}

const StatusOption: React.FC<StatusOptionProps> = ({ status, active, onPress }) => (
  <View style={[styles.statusOption, active && styles.statusOptionActive]}>
    <Text onPress={onPress} style={[styles.statusOptionLabel, active && styles.statusOptionLabelActive]}>
      {status}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  code: { ...typography.subtitle, color: colors.primary, fontWeight: '700' },
  muted: { ...typography.body, color: colors.textMuted },

  label: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs },

  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  statusOption: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  statusOptionActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  statusOptionLabel: { ...typography.label, color: colors.textSecondary },
  statusOptionLabelActive: { color: colors.white },

  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    ...typography.body,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },

  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  historyBody: { flex: 1 },
  historyTitle: { ...typography.subtitle, color: colors.textPrimary },
  historyDate: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  historyNote: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});