import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/HomeScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { ReportDetailScreen } from '../screens/ReportDetailScreen';
import { InfoScreen } from '../screens/InfoScreen';
import { useReports } from '../context/ReportsContext';
import { colors } from '../theme';

export type RootStackParamList = {
  Tabs: undefined;
  ReportDetail: { code: string };
};

export type TabParamList = {
  Home: undefined;
  Reports: undefined;
  Info: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

interface TabsProps {
  refreshKey: number;
  onOpenReport: (code: string) => void;
  onReset: () => Promise<void>;
}

const Tabs: React.FC<TabsProps> = ({ refreshKey, onOpenReport, onReset }) => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
      },
      tabBarIcon: ({ color, size }) => {
        const iconName: keyof typeof MaterialCommunityIcons.glyphMap =
          route.name === 'Home'
            ? 'home-variant'
            : route.name === 'Reports'
              ? 'format-list-bulleted'
              : 'information-outline';
        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Home" options={{ title: 'Início' }}>
      {() => <HomeScreen onOpenReport={onOpenReport} />}
    </Tab.Screen>
    <Tab.Screen name="Reports" options={{ title: 'Denúncias' }}>
      {() => <ReportsScreen onOpenReport={onOpenReport} refreshKey={refreshKey} />}
    </Tab.Screen>
    <Tab.Screen name="Info" options={{ title: 'Info' }}>
      {() => <InfoScreen onReset={onReset} />}
    </Tab.Screen>
  </Tab.Navigator>
);

export const RootNavigator: React.FC = () => {
  const { reset } = useReports();
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((v) => v + 1);

  const handleReset = async () => {
    await reset();
    bump();
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs">
          {({ navigation }) => (
            <Tabs
              refreshKey={refreshKey}
              onOpenReport={(code) => navigation.navigate('ReportDetail', { code })}
              onReset={handleReset}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="ReportDetail">
          {({ route, navigation }) => (
            <ReportDetailScreen
              code={route.params.code}
              onBack={() => navigation.goBack()}
              onReportChanged={bump}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};