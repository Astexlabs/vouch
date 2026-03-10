import {
  Add01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  StarIcon,
} from '@hugeicons/core-free-icons';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useMutation, useQuery } from 'convex/react';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/icon';
import { VouchButton } from '@/components/ui/VouchButton';
import { VouchInput } from '@/components/ui/VouchInput';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

const PRIORITIES = [
  { value: 1, label: 'Critical', color: 'text-red-500', border: 'border-red-800', bg: 'bg-red-950/20' },
  { value: 2, label: 'High', color: 'text-orange-400', border: 'border-orange-800', bg: 'bg-orange-950/20' },
  { value: 3, label: 'Medium', color: 'text-yellow-400', border: 'border-yellow-800', bg: 'bg-yellow-950/20' },
  { value: 4, label: 'Low', color: 'text-neutral-400', border: 'border-neutral-700', bg: 'bg-neutral-950' },
];

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function getPriority(value: number) {
  return PRIORITIES.find((p) => p.value === value) ?? PRIORITIES[3];
}

export default function WishListScreen() {
  const wishes = useQuery(api.wishes.list) ?? [];
  const createWish = useMutation(api.wishes.create);
  const updateWish = useMutation(api.wishes.update);
  const removeWish = useMutation(api.wishes.remove);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [priority, setPriority] = useState(3);
  const [utility, setUtility] = useState('');
  const [targetMonth, setTargetMonth] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['70%', '92%'], []);

  const openSheet = () => {
    setSheetOpen(true);
    bottomSheetRef.current?.snapToIndex(0);
  };

  const closeSheet = useCallback(() => {
    bottomSheetRef.current?.close();
    setSheetOpen(false);
    setTitle('');
    setAmount('');
    setPriority(3);
    setUtility('');
    setTargetMonth('');
    setFormError('');
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.7} />
    ),
    []
  );

  const handleSave = async () => {
    if (!title.trim()) { setFormError('Title is required'); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setFormError('Enter a valid amount'); return; }
    if (!utility.trim()) { setFormError('Utility description is required'); return; }

    setSaving(true);
    try {
      await createWish({
        title,
        amount: amt,
        priority,
        utility,
        targetMonth: targetMonth || undefined,
      });
      closeSheet();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const togglePurchased = (id: Id<'wishes'>, current: boolean) => {
    updateWish({ id, purchased: !current });
  };

  const confirmDelete = (id: Id<'wishes'>, title: string) => {
    Alert.alert(`Delete "${title}"?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeWish({ id }) },
    ]);
  };

  const unpurchased = wishes.filter((w) => !w.purchased);
  const purchased = wishes.filter((w) => w.purchased);

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-4">
        <View>
          <Text className="font-bold text-xl text-white">Wish List</Text>
          <Text className="text-xs text-neutral-500">{unpurchased.length} pending</Text>
        </View>
        <Pressable
          onPress={openSheet}
          accessibilityRole="button"
          accessibilityLabel="Add wish"
          className="h-10 w-10 items-center justify-center rounded-full bg-emerald-500"
        >
          <Icon icon={Add01Icon} size={20} color="#000" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {wishes.length === 0 ? (
          <EmptyState title="Your wish list is empty" subtitle="Tap + to add your first wish" />
        ) : (
          <>
            <Animated.View layout={LinearTransition.springify()}>
              {unpurchased.map((wish, i) => {
                const p = getPriority(wish.priority);
                return (
                  <Animated.View
                    key={wish._id}
                    entering={FadeInDown.delay(i * 40).springify()}
                    exiting={FadeOutUp.duration(200)}
                    layout={LinearTransition.springify()}
                  >
                    <View className={`mb-3 rounded-2xl border px-5 py-4 ${p.border} ${p.bg}`}>
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 mr-2 gap-1">
                          {wish.priority === 1 && (
                            <View className="flex-row items-center gap-1 mb-1">
                              <Icon icon={StarIcon} size={12} color="#ef4444" />
                              <Text className="text-xs font-bold uppercase tracking-widest text-red-500">
                                Critical
                              </Text>
                            </View>
                          )}
                          <Text className="font-bold text-base text-white">{wish.title}</Text>
                          <Text className="text-xs text-neutral-500 leading-relaxed">{wish.utility}</Text>
                        </View>
                        <View className="items-end gap-2">
                          <Text className="font-bold text-base text-white">${wish.amount.toFixed(2)}</Text>
                          {wish.targetMonth ? (
                            <Text className="text-xs text-neutral-500">{wish.targetMonth}</Text>
                          ) : null}
                        </View>
                      </View>

                      <View className="mt-3 flex-row items-center justify-between">
                        <View className={`rounded-lg border px-2.5 py-1 ${p.border}`}>
                          <Text className={`text-xs font-semibold ${p.color}`}>{p.label}</Text>
                        </View>
                        <View className="flex-row gap-3">
                          <Pressable
                            onPress={() => togglePurchased(wish._id, wish.purchased ?? false)}
                            accessibilityRole="button"
                            accessibilityLabel="Mark as purchased"
                            className="p-1"
                          >
                            <Icon icon={CheckmarkCircle02Icon} size={20} color="#10b981" />
                          </Pressable>
                          <Pressable
                            onPress={() => confirmDelete(wish._id, wish.title)}
                            accessibilityRole="button"
                            accessibilityLabel={`Delete ${wish.title}`}
                            className="p-1"
                          >
                            <Icon icon={Delete02Icon} size={18} color="#525252" />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </Animated.View>

            {purchased.length > 0 && (
              <Animated.View entering={FadeIn.duration(300)}>
                <Text className="mb-3 font-semibold text-xs uppercase tracking-widest text-neutral-600">
                  Purchased
                </Text>
                {purchased.map((wish) => (
                  <View
                    key={wish._id}
                    className="mb-3 flex-row items-center justify-between rounded-2xl border border-neutral-900 bg-neutral-950 px-5 py-4 opacity-50"
                  >
                    <Text className="font-semibold text-neutral-400 line-through">{wish.title}</Text>
                    <View className="flex-row items-center gap-3">
                      <Text className="font-bold text-neutral-500">${wish.amount.toFixed(2)}</Text>
                      <Pressable
                        onPress={() => confirmDelete(wish._id, wish.title)}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${wish.title}`}
                        className="p-1"
                      >
                        <Icon icon={Delete02Icon} size={16} color="#404040" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </Animated.View>
            )}
          </>
        )}
        <View className="h-20" />
      </ScrollView>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={() => setSheetOpen(false)}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#0a0a0a' }}
        handleIndicatorStyle={{ backgroundColor: '#404040' }}
      >
        <BottomSheetScrollView
          className="px-5 pt-4"
          contentContainerStyle={{ gap: 16, paddingBottom: 40 }}
        >
          <Text className="font-bold text-2xl text-white">New Wish</Text>

          <VouchInput
            label="What do you want?"
            placeholder="e.g. MacBook Pro"
            value={title}
            onChangeText={(t) => { setTitle(t); setFormError(''); }}
            autoFocus
          />

          <VouchInput
            label="Target Amount"
            placeholder="0.00"
            prefix="$"
            value={amount}
            onChangeText={(t) => { setAmount(t); setFormError(''); }}
            keyboardType="decimal-pad"
          />

          <VouchInput
            label="Why do you need/want it?"
            placeholder="Describe the utility or value..."
            value={utility}
            onChangeText={(t) => { setUtility(t); setFormError(''); }}
            multiline
            numberOfLines={3}
          />

          {/* Priority selector */}
          <View className="gap-2">
            <Text className="font-semibold text-xs uppercase tracking-widest text-neutral-500">
              Priority
            </Text>
            <View className="flex-row gap-2 flex-wrap">
              {PRIORITIES.map((p) => (
                <Pressable
                  key={p.value}
                  onPress={() => setPriority(p.value)}
                  accessibilityRole="button"
                  accessibilityLabel={`Set priority to ${p.label}`}
                  className={`rounded-xl border px-4 py-2 ${
                    priority === p.value ? `${p.border} ${p.bg}` : 'border-neutral-800 bg-neutral-900'
                  }`}
                >
                  <Text className={`font-semibold text-sm ${priority === p.value ? p.color : 'text-neutral-400'}`}>
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Target month */}
          <View className="gap-2">
            <Text className="font-semibold text-xs uppercase tracking-widest text-neutral-500">
              Target Month (optional)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {MONTHS.map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setTargetMonth(targetMonth === m ? '' : m)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select month ${m}`}
                    className={`rounded-xl border px-3 py-2 ${
                      targetMonth === m
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-neutral-800 bg-neutral-900'
                    }`}
                  >
                    <Text className={`font-semibold text-sm ${targetMonth === m ? 'text-emerald-400' : 'text-neutral-400'}`}>
                      {m}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {formError ? <Text className="text-sm text-red-500">{formError}</Text> : null}

          <VouchButton label="Add to Wish List" loading={saving} onPress={handleSave} />
          <VouchButton label="Cancel" variant="ghost" onPress={closeSheet} />
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}
