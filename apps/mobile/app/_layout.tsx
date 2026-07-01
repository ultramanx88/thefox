import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#e11d48' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' }
        }}
      >
        <Stack.Screen name="index" options={{ title: 'theFOX' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
