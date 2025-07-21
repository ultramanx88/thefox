import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@mobile/constants/Colors';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={Colors.primary} />
      
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>theFOX</Text>
        <Text style={styles.subtitle}>Your Market, Delivered</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Your local marketplace, connected. Discover fresh ingredients from local markets, 
          delivered directly to your doorstep.
        </Text>

        <Link href="/(tabs)" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.footerText}>
          Welcome to the native theFOX experience
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    justifyContent: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: Colors.textLight,
  },
});