module.exports = function (api) {
  api.cache(true);
  
  // Set environment variable for Expo Router
  process.env.EXPO_ROUTER_APP_ROOT = './app';
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Ensure expo-router transforms process.env.EXPO_ROUTER_APP_ROOT into a static string for web bundling
      'expo-router/babel',
      [
        'module-resolver',
        {
          alias: {
            // This needs to be mirrored in tsconfig.json
            '@': './src',
          },
        },
      ],

      // Reanimated plugin has to be listed last
      'react-native-reanimated/plugin',
    ],
  };
};