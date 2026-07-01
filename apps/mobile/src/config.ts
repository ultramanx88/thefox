import Constants from 'expo-constants';

const configuredApiUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl;

export const API_URL =
  typeof configuredApiUrl === 'string'
    ? configuredApiUrl.replace(/\/$/, '')
    : 'http://localhost:4000';
