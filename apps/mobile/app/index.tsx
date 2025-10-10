import React, { useCallback, useEffect, useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';

export default function AppEntry() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
    (async () => {
      try {
        // Preload assets (splash/icon) and fonts if any
        await Promise.all([
          Asset.fromModule(require('../assets/splash.png')).downloadAsync(),
          Asset.fromModule(require('../assets/icon.png')).downloadAsync(),
          Asset.fromModule(require('../assets/thefox_logo.jpg')).downloadAsync(),
          // Example: preload a font file if you add one
          // Font.loadAsync({ SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf') })
        ]);
      } catch (e) {
        // no-op; proceed even if some assets fail to cache
      } finally {
        setReady(true);
        await SplashScreen.hideAsync();
      }
    })();
  }, []);

  const handleLogoPress = useCallback(() => {
    router.replace('/login'); // Navigate to login when logo is pressed
  }, [router]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleLogoPress} style={styles.logoContainer}>
        <Image source={require('../assets/thefox_logo.jpg')} style={styles.logo} resizeMode="contain" />
      </TouchableOpacity>
      <ActivityIndicator color="#ff6b35" style={{ marginTop: 16 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '70%',
    height: 200,
  },
});
