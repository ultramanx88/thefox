const {
  expoRouterBabelPlugin
} = require('babel-preset-expo/build/expo-router-plugin');

module.exports = function babelConfig(api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    // npm keeps expo-router inside this workspace while babel-preset-expo is
    // hoisted to the monorepo root, so register the SDK 50 router transform
    // explicitly.
    plugins: [expoRouterBabelPlugin]
  };
};
