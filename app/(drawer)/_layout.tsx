import { Stack } from 'expo-router';

export default function DrawerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000' },
        animation: 'slide_from_left',
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
