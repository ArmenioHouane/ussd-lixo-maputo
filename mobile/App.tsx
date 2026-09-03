import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ReportsProvider } from './src/context/ReportsContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';

const App: React.FC = () => (
  <SafeAreaProvider>
    <ReportsProvider>
      <StatusBar style="light" backgroundColor={colors.primaryDark} />
      <RootNavigator />
    </ReportsProvider>
  </SafeAreaProvider>
);

export default App;