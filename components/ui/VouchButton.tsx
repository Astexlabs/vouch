import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'primary' | 'ghost' | 'danger';

type VouchButtonProps = PressableProps & {
  label: string;
  variant?: Variant;
  loading?: boolean;
};

const BASE =
  'rounded-2xl py-4 px-6 items-center justify-center flex-row gap-2';

const VARIANTS: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: 'bg-emerald-500 active:bg-emerald-600',
    text: 'text-black font-bold text-base',
  },
  ghost: {
    container: 'border border-neutral-800 active:bg-neutral-900',
    text: 'text-white font-semibold text-base',
  },
  danger: {
    container: 'border border-red-900 active:bg-red-950',
    text: 'text-red-500 font-semibold text-base',
  },
};

export function VouchButton({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  onPress,
  ...rest
}: VouchButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const v = VARIANTS[variant];

  return (
    <AnimatedPressable
      style={[animStyle]}
      className={`${BASE} ${v.container} ${disabled || loading ? 'opacity-40' : ''}`}
      disabled={disabled || loading}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#000' : '#fff'} />
      ) : null}
      <Text className={v.text}>{label}</Text>
    </AnimatedPressable>
  );
}
