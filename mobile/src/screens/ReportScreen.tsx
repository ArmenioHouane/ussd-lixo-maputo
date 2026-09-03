import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ScreenHeader } from '../components/Screen';
import { colors, radius, spacing, typography } from '../theme';
import { NEIGHBORHOODS, OCCURRENCE_TYPES } from '../data/catalog';
import { useReports } from '../context/ReportsContext';
import type { Report } from '../types';

type Step = 'bairro' | 'bairro-custom' | 'tipo' | 'tipo-custom' | 'referencia' | 'confirmar' | 'sucesso';

interface Draft {
  bairro: string;
  tipo: string;
  pontoReferencia: string;
}

export const ReportScreen: React.FC = () => {
  const { createReport } = useReports();
  const [step, setStep] = useState<Step>('bairro');
  const [draft, setDraft] = useState<Draft>({ bairro: '', tipo: '', pontoReferencia: '' });
  const [customBairro, setCustomBairro] = useState('');
  const [customTipo, setCustomTipo] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<Report | null>(null);

  const stepIndex = useMemo(() => {
    if (step === 'sucesso') return 3;
    return ['bairro', 'bairro-custom', 'tipo', 'tipo-custom', 'referencia'].indexOf(step);
  }, [step]);

  const stepForIndicator = step === 'bairro-custom' ? 'bairro' : step === 'tipo-custom' ? 'tipo' : step;

  const pickNeighborhood = (label: string, custom: boolean) => {
    if (custom) {
      setDraft((d) => ({ ...d, bairro: '' }));
      setStep('bairro-custom');
      return;
    }
    setDraft((d) => ({ ...d, bairro: label }));
    setStep('tipo');
  };

  const confirmCustomBairro = () => {
    const value = customBairro.trim();
    if (!value) return;
    setDraft((d) => ({ ...d, bairro: value }));
    setStep('tipo');
  };

  const pickType = (label: string, custom: boolean) => {
    if (custom) {
      setStep('tipo-custom');
      return;
    }
    setDraft((d) => ({ ...d, tipo: label }));
    setStep('referencia');
  };

  const confirmCustomTipo = () => {
    const value = customTipo.trim();
    if (!value) return;
    setDraft((d) => ({ ...d, tipo: value }));
    setStep('referencia');
  };

  const submit = async () => {
    setSaving(true);
    try {
      const report = await createReport({
        telefone: '+258840000001', // Na produção real viria da sessão da operadora.
        bairro: draft.bairro,
        tipo_ocorrencia: draft.tipo,
        ponto_referencia: draft.pontoReferencia.trim(),
        origem: 'APP',
      });
      setCreated(report);
      setStep('sucesso');
    } catch {
      Alert.alert('Erro', 'Não foi possível registar a denúncia. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const restart = () => {
    setDraft({ bairro: '', tipo: '', pontoReferencia: '' });
    setCustomBairro('');
    setCustomTipo('');
    setCreated(null);
    setStep('bairro');
  };

  const steps: Array<{ key: 'bairro' | 'tipo' | 'referencia' | 'confirmar'; label: string }> = [
    { key: 'bairro', label: 'Bairro' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'referencia', label: 'Local' },
    { key: 'confirmar', label: 'Confirmar' },
  ];

  const indicatorIndex = steps.findIndex((s) => s.key === stepForIndicator);

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title="Denunciar lixo"
        subtitle={`Passo ${Math.max(indicatorIndex + 1, 1)} de 4 • canal APP (sem internet como o USSD)`}
      />
      <StepIndicator steps={steps} current={indicatorIndex} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 'bairro' || step === 'bairro-custom' ? (
          <Card title="Seleccione o bairro/zona">
            {NEIGHBORHOODS.map((n) => (
              <OptionRow
                key={n.key}
                label={n.label}
                selected={draft.bairro === n.label}
                onPress={() => pickNeighborhood(n.label, n.key === '5')}
              />
            ))}
            {step === 'bairro-custom' ? (
              <View style={styles.customBox}>
                <TextInput
                  style={styles.input}
                  value={customBairro}
                  onChangeText={setCustomBairro}
                  placeholder="Ex.: Polana Caniço"
                  placeholderTextColor={colors.textMuted}
                />
                <Button label="Continuar" onPress={confirmCustomBairro} />
              </View>
            ) : null}
          </Card>
        ) : null}

        {step === 'tipo' || step === 'tipo-custom' ? (
          <Card title="Seleccione o tipo de ocorrência" subtitle={`Bairro: ${draft.bairro}`}>
            {OCCURRENCE_TYPES.map((t) => (
              <OptionRow
                key={t.key}
                label={t.label}
                selected={draft.tipo === t.label}
                onPress={() => pickType(t.label, t.key === '5')}
              />
            ))}
            {step === 'tipo-custom' ? (
              <View style={styles.customBox}>
                <TextInput
                  style={styles.input}
                  value={customTipo}
                  onChangeText={setCustomTipo}
                  placeholder="Descreva o problema"
                  placeholderTextColor={colors.textMuted}
                  multiline
                />
                <Button label="Continuar" onPress={confirmCustomTipo} />
              </View>
            ) : null}
          </Card>
        ) : null}

        {step === 'referencia' ? (
          <Card
            title="Ponto de referência"
            subtitle={`${draft.bairro} • ${draft.tipo}`}
          >
            <TextInput
              style={[styles.input, styles.multiline]}
              value={draft.pontoReferencia}
              onChangeText={(v) => setDraft((d) => ({ ...d, pontoReferencia: v }))}
              placeholder="Ex.: perto do mercado, escola ou paragem"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={180}
            />
            <Button
              label="Continuar"
              onPress={() => setStep('confirmar')}
              disabled={draft.pontoReferencia.trim().length === 0}
            />
          </Card>
        ) : null}

        {step === 'confirmar' ? (
          <Card title="Confirme a denúncia">
            <SummaryRow label="Bairro" value={draft.bairro} />
            <SummaryRow label="Tipo" value={draft.tipo} />
            <SummaryRow label="Local" value={draft.pontoReferencia} />
            <View style={styles.actions}>
              <Button
                label="Confirmar"
                icon={<MaterialCommunityIcons name="check" size={18} color={colors.white} />}
                onPress={submit}
                loading={saving}
              />
              <Button
                label="Cancelar"
                variant="ghost"
                onPress={restart}
              />
            </View>
          </Card>
        ) : null}

        {step === 'sucesso' && created ? (
          <Card style={styles.successCard}>
            <View style={styles.successIcon}>
              <MaterialCommunityIcons name="check-circle" size={56} color={colors.success} />
            </View>
            <Text style={styles.successTitle}>Denúncia registada com sucesso</Text>
            <Text style={styles.successCode}>{created.codigo}</Text>
            <Text style={styles.successHint}>
              Guarde este código. Use a opção "Consultar" para acompanhar o estado.
            </Text>
            <View style={styles.actions}>
              <Button
                label="Nova denúncia"
                variant="secondary"
                onPress={restart}
              />
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
};

const StepIndicator: React.FC<{ steps: Array<{ key: string; label: string }>; current: number }> = ({
  steps,
  current,
}) => (
  <View style={styles.stepRow}>
    {steps.map((s, i) => (
      <View key={s.key} style={styles.stepItem}>
        <View
          style={[
            styles.stepDot,
            i <= current ? styles.stepDotActive : null,
          ]}
        >
          <Text style={[styles.stepNum, i <= current ? styles.stepNumActive : null]}>{i + 1}</Text>
        </View>
        <Text style={[styles.stepLabel, i <= current ? styles.stepLabelActive : null]}>{s.label}</Text>
      </View>
    ))}
  </View>
);

const OptionRow: React.FC<{ label: string; selected: boolean; onPress: () => void }> = ({
  label,
  selected,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    android_ripple={{ color: colors.primaryLight }}
    style={[styles.option, selected ? styles.optionSelected : null]}
  >
    <Text style={[styles.optionText, selected ? styles.optionTextSelected : null]}>{label}</Text>
    <MaterialCommunityIcons
      name={selected ? 'check-circle' : 'chevron-right'}
      size={20}
      color={selected ? colors.white : colors.textMuted}
    />
  </Pressable>
);

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  stepRow: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  stepDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepNum: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  stepNumActive: { color: colors.white },
  stepLabel: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  stepLabelActive: { color: colors.primaryDark, fontWeight: '700' },
  option: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  optionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  optionTextSelected: { color: colors.white, fontWeight: '600' },
  customBox: { marginTop: spacing.sm, gap: spacing.sm },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  actions: { gap: spacing.sm, marginTop: spacing.md },
  summaryRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  summaryLabel: { ...typography.caption, color: colors.textMuted },
  summaryValue: { ...typography.body, color: colors.textPrimary, flex: 1, fontWeight: '600', textAlign: 'right' },
  successCard: { alignItems: 'center', paddingVertical: spacing.xl },
  successIcon: { marginBottom: spacing.sm },
  successTitle: { ...typography.title, color: colors.textPrimary, textAlign: 'center' },
  successCode: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.primaryDark,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  successHint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
});
