import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { colors, radius, spacing, typography } from '../theme';
import { SERVICE_CODE } from '../data/catalog';
import { handle as ussdHandle } from '../ussd/engine';
import { useReports } from '../context/ReportsContext';

type Mode = 'local' | 'server';

interface SessionState {
  text: string;
  ended: boolean;
  screen: string;
  history: Array<{ input: string; response: string; kind: 'CON' | 'END' }>;
}

const initialSession: SessionState = { text: '', ended: false, screen: '', history: [] };

export const UssdSimulatorScreen: React.FC = () => {
  const { createReport, findReportByCode } = useReports();
  const [mode, setMode] = useState<Mode>('local');
  const [phoneNumber, setPhoneNumber] = useState('+258840000001');
  const [input, setInput] = useState('');
  const [session, setSession] = useState<SessionState>(initialSession);
  const [busy, setBusy] = useState(false);
  const [serverUrl, setServerUrl] = useState('http://10.0.2.2:8000/ussd.php');
  const scrollRef = useRef<ScrollView>(null);

  const startSession = useCallback(async () => {
    setSession(initialSession);
    setBusy(true);
    try {
      if (mode === 'local') {
        const res = await ussdHandle({ phoneNumber, text: '' }, createReport, findReportByCode);
        setSession({ text: '', ended: res.kind === 'END', screen: res.text, history: [{ input: '', response: res.text, kind: res.kind }] });
      } else {
        const res = await postToServer(serverUrl, { phoneNumber, text: '' });
        setSession({ text: '', ended: res.kind === 'END', screen: res.text, history: [{ input: '', response: res.text, kind: res.kind }] });
      }
    } catch (e) {
      setSession({
        ...initialSession,
        screen: 'Erro ao contactar o servidor USSD.\nVerifique o URL e se o servidor PHP esta activo.',
      });
    } finally {
      setBusy(false);
    }
  }, [mode, phoneNumber, serverUrl, createReport, findReportByCode]);

  useEffect(() => {
    // Abre a primeira tela do menu assim que o ecrã monta.
    startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = useCallback(async () => {
    const value = input.trim();
    if (!value || session.ended || busy) return;
    setBusy(true);
    setInput('');
    try {
      const nextText = session.text === '' ? value : `${session.text}*${value}`;
      if (mode === 'local') {
        const res = await ussdHandle({ phoneNumber, text: nextText }, createReport, findReportByCode);
        setSession((prev) => ({
          text: nextText,
          ended: res.kind === 'END',
          screen: res.text,
          history: [...prev.history, { input: value, response: res.text, kind: res.kind }],
        }));
      } else {
        const res = await postToServer(serverUrl, { phoneNumber, text: nextText });
        setSession((prev) => ({
          text: nextText,
          ended: res.kind === 'END',
          screen: res.text,
          history: [...prev.history, { input: value, response: res.text, kind: res.kind }],
        }));
      }
    } catch {
      setSession((prev) => ({
        ...prev,
        screen: 'Erro ao contactar o servidor USSD.',
        ended: true,
      }));
    } finally {
      setBusy(false);
    }
  }, [input, session, busy, mode, phoneNumber, serverUrl, createReport, findReportByCode]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'android' ? undefined : 'padding'}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Card title="Canal USSD" subtitle={`Código de serviço ${SERVICE_CODE}`}>
          <View style={styles.modeRow}>
            <ModeChip
              active={mode === 'local'}
              label="Motor local"
              icon="cellphone"
              onPress={() => setMode('local')}
            />
            <ModeChip
              active={mode === 'server'}
              label="Servidor PHP"
              icon="server"
              onPress={() => setMode('server')}
            />
          </View>

          {mode === 'server' ? (
            <TextInput
              style={styles.urlInput}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="http://10.0.2.2:8000/ussd.php"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="url"
            />
          ) : null}

          <TextInput
            style={styles.phoneInput}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+258840000001"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />
        </Card>

        <View style={styles.phoneFrame}>
          <View style={styles.phoneTop}>
            <MaterialCommunityIcons name="dialpad" size={14} color={colors.white} />
            <Text style={styles.phoneTopText}>USSD {SERVICE_CODE}</Text>
          </View>
          <View style={styles.screen}>
            {busy ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.screenText}>{session.screen || 'A iniciar sessão…'}</Text>
            )}
          </View>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.replyInput}
            value={input}
            onChangeText={setInput}
            placeholder={session.ended ? 'Sessão terminada' : 'Digite a opção ou texto'}
            placeholderTextColor={colors.textMuted}
            editable={!session.ended && !busy}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Button
            label="Enviar"
            onPress={send}
            disabled={session.ended || busy}
            style={styles.sendButton}
          />
        </View>

        <Button
          label="Nova sessão"
          variant="secondary"
          icon={<MaterialCommunityIcons name="refresh" size={18} color={colors.primaryDark} />}
          onPress={startSession}
        />

        {session.history.length > 1 ? (
          <Card title="Histórico da sessão" style={styles.historyCard}>
            {session.history.map((h, i) => (
              <View key={i} style={styles.historyItem}>
                <Text style={styles.historyInput}>
                  {h.input === '' ? '— chamada inicial —' : `▶ ${h.input}`}
                </Text>
                <Text style={styles.historyKind}>
                  {h.kind === 'CON' ? 'CON (continuar)' : 'END (terminar)'}
                </Text>
              </View>
            ))}
          </Card>
        ) : null}

        <Card title="Como testar" subtitle="Fluxo principal de denúncia">
          <Text style={styles.helpText}>
            1. Escolha "1" para denunciar lixo{'\n'}
            2. Escolha o bairro{'\n'}
            3. Escolha o tipo de ocorrência{'\n'}
            4. Digite um ponto de referência{'\n'}
            5. Confirme com "1"
          </Text>
          <Text style={styles.helpMuted}>
            No modo "Servidor PHP" a app envia POST para o webhook ussd.php
            (compatível com Africa's Talking). Em Android Emulator use
            10.0.2.2 para aceder ao localhost do PC.
          </Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const ModeChip: React.FC<{ active: boolean; label: string; icon: string; onPress: () => void }> = ({
  active,
  label,
  icon,
  onPress,
}) => (
  <Button
    label={label}
    variant={active ? 'primary' : 'ghost'}
    onPress={onPress}
    fullWidth={false}
    style={styles.modeChip}
  />
);

async function postToServer(
  url: string,
  data: { phoneNumber: string; text: string },
): Promise<{ kind: 'CON' | 'END'; text: string }> {
  const body = new URLSearchParams({
    sessionId: `app-${Date.now()}`,
    serviceCode: SERVICE_CODE,
    phoneNumber: data.phoneNumber,
    text: data.text,
  } as Record<string, string>);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const raw = await res.text();
  const kind = raw.startsWith('END') ? 'END' : 'CON';
  return { kind, text: raw.replace(/^(CON|END)\s*/, '') };
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  modeChip: { flex: 1, minHeight: 40 },
  urlInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 13,
    marginBottom: spacing.sm,
    minHeight: 42,
    paddingHorizontal: spacing.sm,
  },
  phoneInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  phoneFrame: {
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.primaryDark,
    overflow: 'hidden',
  },
  phoneTop: {
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  phoneTopText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  screen: {
    backgroundColor: '#0E1F16',
    minHeight: 150,
    padding: spacing.md,
  },
  screenText: {
    color: '#B8F5CE',
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Menlo',
    fontSize: 13,
    lineHeight: 19,
  },
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  replyInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.textPrimary,
    flex: 1,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
  },
  sendButton: { minWidth: 110 },
  historyCard: { marginTop: spacing.xs },
  historyItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: spacing.xs,
  },
  historyInput: { ...typography.body, color: colors.textPrimary },
  historyKind: { ...typography.caption, color: colors.textMuted },
  helpText: { ...typography.body, color: colors.textPrimary, lineHeight: 24 },
  helpMuted: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
});
