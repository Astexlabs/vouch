import { TextInput, Text, View, type TextInputProps } from 'react-native';

type VouchInputProps = TextInputProps & {
  label?: string;
  error?: string;
  prefix?: string;
};

export function VouchInput({ label, error, prefix, style, ...rest }: VouchInputProps) {
  return (
    <View className="gap-1.5">
      {label ? (
        <Text className="font-semibold text-xs uppercase tracking-widest text-neutral-500">
          {label}
        </Text>
      ) : null}
      <View className="flex-row items-center rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3.5">
        {prefix ? (
          <Text className="mr-1 font-bold text-neutral-500">{prefix}</Text>
        ) : null}
        <TextInput
          className="flex-1 font-semibold text-base text-white"
          placeholderTextColor="#525252"
          {...rest}
        />
      </View>
      {error ? <Text className="text-xs text-red-500">{error}</Text> : null}
    </View>
  );
}
