import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

type EmptyStateProps = {
  title: string;
  subtitle?: string;
};

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <Animated.View entering={FadeIn.duration(400)} className="flex-1 items-center justify-center py-20">
      <View className="mb-3 h-16 w-16 rounded-full border border-neutral-800 items-center justify-center">
        <Text className="text-2xl text-neutral-600">—</Text>
      </View>
      <Text className="font-bold text-lg text-neutral-400">{title}</Text>
      {subtitle ? (
        <Text className="mt-1 text-center text-sm text-neutral-600">{subtitle}</Text>
      ) : null}
    </Animated.View>
  );
}
