import React, { useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { InfoRow } from '../components/InfoRow';
import { ScreenContainer, ScreenHeader } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { NEIGHBORHOODS, OCCURRENCE_TYPES, SERVICE_CODE } from '../data/catalog';
import { useReports } from '../context/ReportsContext';
import { colors, radius, spacing, typography } from '../theme';

type Step =
  | 'menu'
  | 'select-neighborhood'
  | 'enter-neighborhood'
  | 'select-type'
  | 'enter-type'
  | 'enter-reference'
  | 'confirm'
  | 'done'
  | 'enter-reference-query'
  | 'show-info'
  | 'exit';

type Draft = {
  telefone: string;
  bairro?: string;
  tipo?: string;
  referencia?: string;
};

interface HomeScreenProps {
  onOpenReport: (code: string) => void;
  onOpenSimulator?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenReport, onOpenSimulator }) => {
  const { createReport } = useReports();

  const [step, setStep] = useState<Step>('menu');
  const [draft, setDraft] = useState<Draft>({ telefone: '+258840000000' });
  const [textInput, setTextInput] = useState('');
  const [lastCreatedCode, setLastCreatedCode] = useState<string | null>(null);

  const reset = () => {
    setDraft({ telefone: draft.telefone });
    setTextInput('');
    setStep('menu');
  };

  const handleMenu = (option: '1' | '2' | '3' | '4') => {
    if (option === '1') setStep('select-neighborhood');
    else if (option === '2') setStep('enter-reference-query');
    else if (option === '3') setStep('show-info');
    else if (option === '4') setStep('exit');
  };

  const handleNeighborhoodPick = (key: string) => {
    if (key === '5') {
      setStep('enter-neighborhood');
      return;
    }
    const opt = NEIGHBORHOODS.find((n) => n.key === key);
    if (!opt) return;
    setDraft((d) => ({ ...d, bairro: opt.label }));
    setStep('select-type');
  };

  const handleNeighborhoodText = () => {
    const value = textInput.trim();
    if (!value) {
      Alert.alert('Bairro obrigatório', 'Digite o nome do bairro ou zona.');
      return;
    }
    setDraft((d) => ({ ...d, bairro: value }));
    setTextInput('');
    setStep('select-type');
  };

  const handleTypePick = (key: string) => {
    if (key === '5') {
      setStep('enter-type');
      return;
    }
    const opt = OCCURRENCE_TYPES.find((t) => t.key === key);
    if (!opt) return;
    setDraft((d) => ({ ...d, tipo: opt.label }));
    setStep('enter-reference');
  };

  const handleTypeText = () => {
    const value = textInput.trim();
    if (!value) {
      Alert.alert('Tipo obrigatório', 'Descreva o tipo de problema.');
      return;
    }
    setDraft((d) => ({ ...d, tipo: value }));
    setTextInput('');
    setStep('enter-reference');
  };

  const handleReference = () => {
    const value = textInput.trim();
    if (!value) {
      Alert.alert('Ponto de referência', 'Indique um ponto de referência válido.');
      return;
    }
    setDraft((d) => ({ ...d, referencia: value }));
    setTextInput('');
    setStep('confirm');
  };

  const handleConfirm = async (accept: boolean) => {
    if (!accept) {
      reset();
      return;
    }
    if (!draft.bairro || !draft.tipo || !draft.referencia) {
      Alert.alert('Dados incompletos', 'Verifique os dados e tente novamente.');
      return;
    }
    try {
      const report = await createReport({
        telefone: draft.telefone,
        bairro: draft.bairro,
        tipo_ocorrencia: draft.tipo,
        ponto_referencia: draft.referencia,
        origem: 'APP',
      });
      setLastCreatedCode(report.codigo);
      setStep('done');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível registar a denúncia.');
    }
  };

  const renderMenu = () => (
    <>
      <Card title="Menu Principal" subtitle={`Service code ${SERVICE_CODE}`}>
        <View style={styles.optionList}>
          <OptionRow index={1} label="Denunciar lixo" description="Registar um foco de lixo urbano" />
          <OptionRow index={2} label="Consultar denúncia" description="Verificar estado por código" />
          <OptionRow index={3} label="Informações" description="Sobre o sistema" />
          <OptionRow index={4} label="Sair" description="Voltar ao menu principal" />
        </View>
      </Card>

      <View style={styles.actions}>
        <Button label="1. Denunciar lixo" onPress={() => handleMenu('1')} />
        <Button label="2. Consultar denúncia" variant="secondary" onPress={() => handleMenu('2')} />
        <Button label="3. Informações" variant="secondary" onPress={() => handleMenu('3')} />
        <Button label="4. Sair" variant="ghost" onPress={() => handleMenu('4')} />
        {onOpenSimulator ? (
          <Button
            label="Abrir simulador USSD"
            variant="secondary"
            onPress={onOpenSimulator}
            fullWidth={false}
          />
        ) : null}
      </View>
    </>
  );

  const renderNeighborhood = () => (
    <Card title="Seleccione o bairro/zona">
      <View style={styles.optionList}>
        {NEIGHBORHOODS.map((n) => (
          <OptionRow
            key={n.key}
            index={Number(n.key)}
            label={n.label}
            description={n.key === '5' ? 'Digitar manualmente' : 'Toque para seleccionar'}
            onPress={() => handleNeighborhoodPick(n.key)}
          />
        ))}
      </View>
      <Button label="Voltar ao menu" variant="ghost" onPress={reset} />
    </Card>
  );

  const renderEnterNeighborhood = () => (
    <Card title="Digite o nome do bairro/zona">
      <TextInput
        style={styles.input}
        placeholder="Ex.: Maxaquene"
        placeholderTextColor={colors.textMuted}
        value={textInput}
        onChangeText={setTextInput}
        autoFocus
      />
      <View style={styles.actions}>
        <Button label="Avançar" onPress={handleNeighborhoodText} />
        <Button label="Voltar" variant="ghost" onPress={() => setStep('select-neighborhood')} />
      </View>
    </Card>
  );

  const renderSelectType = () => (
    <Card title="Seleccione o tipo de ocorrência">
      <View style={styles.optionList}>
        {OCCURRENCE_TYPES.map((t) => (
          <OptionRow
            key={t.key}
            index={Number(t.key)}
            label={t.label}
            onPress={() => handleTypePick(t.key)}
          />
        ))}
      </View>
      <Button label="Voltar" variant="ghost" onPress={() => setStep('select-neighborhood')} />
    </Card>
  );

  const renderEnterType = () => (
    <Card title="Descreva o tipo de problema">
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Ex.: Lixo acumulado em terreno baldio"
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={3}
        value={textInput}
        onChangeText={setTextInput}
        autoFocus
      />
      <View style={styles.actions}>
        <Button label="Avançar" onPress={handleTypeText} />
        <Button label="Voltar" variant="ghost" onPress={() => setStep('select-type')} />
      </View>
    </Card>
  );

  const renderEnterReference = () => (
    <Card
      title="Informe um ponto de referência"
      subtitle="Ex.: perto do mercado, escola ou paragem"
    >
      <TextInput
        style={styles.input}
        placeholder="Ponto de referência"
        placeholderTextColor={colors.textMuted}
        value={textInput}
        onChangeText={setTextInput}
        autoFocus
      />
      <View style={styles.actions}>
        <Button label="Avançar" onPress={handleReference} />
        <Button label="Voltar" variant="ghost" onPress={() => setStep('select-type')} />
      </View>
    </Card>
  );

  const renderConfirm = () => (
    <Card title="Confirme a denúncia">
      <InfoRow label="Bairro" value={draft.bairro ?? ''} />
      <InfoRow label="Tipo" value={draft.tipo ?? ''} />
      <InfoRow label="Ponto de referência" value={draft.referencia ?? ''} />
      <View style={styles.actions}>
        <Button label="1. Confirmar" onPress={() => handleConfirm(true)} />
        <Button label="2. Cancelar" variant="danger" onPress={() => handleConfirm(false)} />
      </View>
    </Card>
  );

  const renderDone = () => (
    <Card title="Denúncia registada">
      <View style={styles.successBlock}>
        <MaterialCommunityIcons name="check-decagram" size={48} color={colors.primary} />
        <Text style={styles.successText}>A sua denúncia foi gravada com sucesso.</Text>
        {lastCreatedCode ? (
          <Text style={styles.codeText}>{lastCreatedCode}</Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        {lastCreatedCode ? (
          <Button label="Ver detalhes da denúncia" onPress={() => onOpenReport(lastCreatedCode)} />
        ) : null}
        <Button label="Nova denúncia" variant="secondary" onPress={reset} />
        <Button label="Menu principal" variant="ghost" onPress={reset} />
      </View>
    </Card>
  );

  const renderInfo = () => (
    <Card title="Informações" subtitle="Sobre o sistema">
      <Text style={styles.infoBody}>
        Este sistema permite denunciar focos de lixo urbano e consultar o estado da denúncia.
        {'\n\n'}
        Foi desenhado para funcionar sem internet — toda a informação fica guardada no
        dispositivo através do canal offline (AsyncStorage).
        {'\n\n'}
        O código gerado pode ser consultado na aba "Denúncias".
      </Text>
      <Button label="Voltar ao menu" variant="secondary" onPress={reset} />
    </Card>
  );

  const renderExit = () => (
    <Card title="Sessão terminada">
      <Text style={styles.infoBody}>
        Obrigado por usar o Sistema de Denúncia de Lixo Urbano.
      </Text>
      <Button label="Voltar ao menu" variant="secondary" onPress={reset} />
    </Card>
  );

  const renderQuery = () => {
    const trimmed = textInput.trim();
    const code = trimmed.length === 0 ? null : trimmed;
    return (
      <Card title="Consultar denúncia">
        <Text style={styles.infoBody}>Digite o código da denúncia.</Text>
        <TextInput
          style={styles.input}
          placeholder="DLX-260902-XXXXXX"
          placeholderTextColor={colors.textMuted}
          value={textInput}
          onChangeText={setTextInput}
          autoFocus
          autoCapitalize="characters"
        />
        <View style={styles.actions}>
          <Button
            label="Consultar"
            onPress={() => {
              if (!code) {
                Alert.alert('Código obrigatório', 'Digite o código da denúncia.');
                return;
              }
              onOpenReport(code);
            }}
          />
          <Button label="Voltar ao menu" variant="ghost" onPress={reset} />
        </View>
        {lastCreatedCode ? (
          <View style={styles.lastCodeBox}>
            <Text style={styles.label}>Último código gerado</Text>
            <View style={styles.lastCodeRow}>
              <Text style={styles.codeText}>{lastCreatedCode}</Text>
              <Button
                label="Ver"
                variant="secondary"
                onPress={() => onOpenReport(lastCreatedCode)}
                fullWidth={false}
              />
            </View>
          </View>
        ) : null}
      </Card>
    );
  };

  const headerTitle = useMemo(() => {
    switch (step) {
      case 'menu':
        return 'Sistema de Denúncia';
      case 'done':
        return 'Denúncia concluída';
      case 'show-info':
        return 'Informações';
      case 'exit':
        return 'Sessão terminada';
      case 'enter-reference-query':
        return 'Consultar';
      default:
        return 'Denunciar lixo';
    }
  }, [step]);

  return (
    <>
      <ScreenHeader
        title={headerTitle}
        subtitle="USSD digital • Maputo"
        icon="trash-can-outline"
      />
      <ScreenContainer>
        {step === 'menu' && renderMenu()}
        {step === 'select-neighborhood' && renderNeighborhood()}
        {step === 'enter-neighborhood' && renderEnterNeighborhood()}
        {step === 'select-type' && renderSelectType()}
        {step === 'enter-type' && renderEnterType()}
        {step === 'enter-reference' && renderEnterReference()}
        {step === 'confirm' && renderConfirm()}
        {step === 'done' && renderDone()}
        {step === 'show-info' && renderInfo()}
        {step === 'exit' && renderExit()}
        {step === 'enter-reference-query' && renderQuery()}
      </ScreenContainer>
    </>
  );
};

interface OptionRowProps {
  index: number;
  label: string;
  description?: string;
  onPress?: () => void;
}

const OptionRow: React.FC<OptionRowProps> = ({ index, label, description, onPress }) => (
  <View style={styles.optionRow}>
    <View style={styles.optionBadge}>
      <Text style={styles.optionBadgeText}>{index}</Text>
    </View>
    <View style={styles.optionBody}>
      <Text style={styles.optionLabel}>{label}</Text>
      {description ? <Text style={styles.optionDescription}>{description}</Text> : null}
    </View>
    {onPress ? (
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  optionList: { marginVertical: spacing.sm },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  optionBadgeText: { ...typography.label, color: colors.white },
  optionBody: { flex: 1 },
  optionLabel: { ...typography.subtitle, color: colors.textPrimary },
  optionDescription: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body,
    marginBottom: spacing.sm,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },

  actions: { marginTop: spacing.sm, gap: spacing.xs },

  infoBody: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },

  successBlock: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  successText: { ...typography.subtitle, color: colors.textPrimary, textAlign: 'center' },
  codeText: {
    ...typography.title,
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },

  lastCodeBox: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  lastCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  label: { ...typography.label, color: colors.textMuted },
});