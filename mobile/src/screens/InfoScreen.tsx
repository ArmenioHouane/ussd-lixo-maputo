import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ScreenContainer, ScreenHeader } from '../components/Screen';
import { useReports } from '../context/ReportsContext';
import { APP_NAME, SERVICE_CODE } from '../data/catalog';
import type { ReportStatus } from '../types';
import { colors, spacing, typography } from '../theme';

interface InfoScreenProps {
  onReset: () => Promise<void>;
}

export const InfoScreen: React.FC<InfoScreenProps> = ({ onReset }) => {
  const { stats } = useReports();
  const [snapshot, setSnapshot] = useState<{
    total: number;
    byStatus: Array<{ estado: ReportStatus; total: number }>;
    byNeighborhood: Array<{ bairro: string; total: number }>;
  } | null>(null);

  useEffect(() => {
    let active = true;
    stats().then((s) => {
      if (active) setSnapshot(s);
    });
    return () => {
      active = false;
    };
  }, [stats]);

  return (
    <>
      <ScreenHeader
        title="Informações"
        subtitle="Sobre o sistema e estatísticas locais"
        icon="information-outline"
      />
      <ScreenContainer>
        <Card title={APP_NAME} subtitle="Versão mobile • Modo offline">
          <Text style={styles.body}>
            Esta é a versão mobile Android do protótipo académico de denúncia de focos de
            lixo urbano. A app replica o mesmo fluxo USSD do canal tradicional e adiciona
            consulta detalhada, edição de estado e histórico.
          </Text>
          <Text style={styles.body}>
            Service code original: {SERVICE_CODE}. Os dados ficam apenas no dispositivo
            (AsyncStorage), sem dependência de internet.
          </Text>
        </Card>

        <Card title="Como usar">
          <BulletItem icon="cellphone" text="Toque em 'Denunciar' e siga os passos." />
          <BulletItem icon="magnify" text="Use 'Consultar' para ver o estado por código." />
          <BulletItem icon="format-list-bulleted" text="Abra 'Denúncias' para listar tudo." />
          <BulletItem icon="cloud-off-outline" text="Funciona totalmente offline." />
        </Card>

        <Card title="Estatísticas locais" subtitle={`${snapshot?.total ?? 0} denúncias`}>
          {!snapshot || snapshot.total === 0 ? (
            <Text style={styles.body}>Sem denúncias registadas ainda.</Text>
          ) : (
            <>
              <Text style={styles.subheading}>Por estado</Text>
              {snapshot.byStatus.map((row) => (
                <View key={row.estado} style={styles.statRow}>
                  <Text style={styles.statLabel}>{row.estado}</Text>
                  <Text style={styles.statValue}>{row.total}</Text>
                </View>
              ))}

              <Text style={[styles.subheading, { marginTop: spacing.sm }]}>Top bairros</Text>
              {snapshot.byNeighborhood.map((row) => (
                <View key={row.bairro} style={styles.statRow}>
                  <Text style={styles.statLabel}>{row.bairro}</Text>
                  <Text style={styles.statValue}>{row.total}</Text>
                </View>
              ))}
            </>
          )}
        </Card>

        <Card title="Repor dados locais">
          <Text style={styles.body}>
            Esta acção elimina todas as denúncias guardadas no telemóvel. Os dados do servidor
            PHP (data/database.json) permanecem intactos.
          </Text>
          <Button
            label="Limpar base local"
            variant="danger"
            onPress={() => {
              onReset();
            }}
          />
        </Card>
      </ScreenContainer>
    </>
  );
};

const BulletItem: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <View style={styles.bulletRow}>
    <MaterialCommunityIcons name={icon as never} size={18} color={colors.primary} />
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  body: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs },
  subheading: { ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.xs },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 4,
  },
  bulletText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  statLabel: { ...typography.body, color: colors.textPrimary },
  statValue: { ...typography.subtitle, color: colors.primary },
});