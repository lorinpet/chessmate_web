import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function Layout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

export const basePath = '/chessmate_web';