import { useAuth, useUser } from '@clerk/clerk-expo';
import {
  ArrowLeft01Icon,
  Delete02Icon,
  DocumentDownloadIcon,
  Logout01Icon,
  PencilEdit01Icon,
  Tag01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useMutation, useQuery } from 'convex/react';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { VouchButton } from '@/components/ui/VouchButton';
import { VouchInput } from '@/components/ui/VouchInput';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

type DrawerSection = 'home' | 'buckets' | 'export';

export default function DrawerScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const buckets = useQuery(api.buckets.list) ?? [];
  const groups = useQuery(api.groups.list) ?? [];
  const allItems = useQuery(api.items.listAll) ?? [];
  const wishes = useQuery(api.wishes.list) ?? [];

  const createBucket = useMutation(api.buckets.create);
  const removeBucket = useMutation(api.buckets.remove);

  const [section, setSection] = useState<DrawerSection>('home');

  // Bucket form
  const [bucketTitle, setBucketTitle] = useState('');
  const [bucketType, setBucketType] = useState('');
  const [bucketError, setBucketError] = useState('');

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['55%'], []);

  const openSheet = () => bottomSheetRef.current?.snapToIndex(0);
  const closeSheet = useCallback(() => {
    bottomSheetRef.current?.close();
    setBucketTitle('');
    setBucketType('');
    setBucketError('');
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.7} />
    ),
    []
  );

  const handleSaveBucket = async () => {
    if (!bucketTitle.trim()) { setBucketError('Title required'); return; }
    if (!bucketType.trim()) { setBucketError('Type required'); return; }
    try {
      await createBucket({ title: bucketTitle, type: bucketType });
      closeSheet();
    } catch (e: unknown) {
      setBucketError(e instanceof Error ? e.message : 'Failed');
    }
  };

  const confirmDeleteBucket = (id: Id<'buckets'>, title: string) => {
    Alert.alert(`Delete bucket "${title}"?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeBucket({ id }) },
    ]);
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  const exportCSV = async () => {
    try {
      const lines: string[] = ['Group,Item,Bucket,Planned,Actual,Variance,Reason'];
      for (const item of allItems) {
        const group = groups.find((g) => g._id === item.groupId);
        const bucket = buckets.find((b) => b._id === item.bucketId);
        const variance = item.actual - item.planned;
        lines.push(
          [
            `"${group?.title ?? ''}"`,
            `"${item.title}"`,
            `"${bucket?.title ?? ''}"`,
            item.planned.toFixed(2),
            item.actual.toFixed(2),
            variance.toFixed(2),
            `"${item.reason ?? ''}"`,
          ].join(',')
        );
      }
      const csv = lines.join('\n');
      const path = `${FileSystem.documentDirectory}vouch-expenses-${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
      } else {
        Alert.alert('Saved', `File saved to: ${path}`);
      }
    } catch (e: unknown) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const exportWishesCSV = async () => {
    try {
      const lines: string[] = ['Title,Amount,Priority,Utility,Target Month,Purchased'];
      for (const w of wishes) {
        const priorityMap: Record<number, string> = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low' };
        lines.push(
          [
            `"${w.title}"`,
            w.amount.toFixed(2),
            `"${priorityMap[w.priority] ?? w.priority}"`,
            `"${w.utility}"`,
            `"${w.targetMonth ?? ''}"`,
            w.purchased ? 'Yes' : 'No',
          ].join(',')
        );
      }
      const csv = lines.join('\n');
      const path = `${FileSystem.documentDirectory}vouch-wishes-${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: 'text/csv' });
      } else {
        Alert.alert('Saved', `File saved to: ${path}`);
      }
    } catch (e: unknown) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 pt-3 pb-6">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
          className="p-1"
        >
          <Icon icon={ArrowLeft01Icon} size={24} color="#fff" />
        </Pressable>
        <Text className="font-bold text-lg text-white">Menu</Text>
        <View className="w-8" />
      </View>

      {/* Profile summary */}
      <View className="mx-5 mb-6 flex-row items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-950 px-5 py-4">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
          <Icon icon={UserIcon} size={22} color="#10b981" />
        </View>
        <View className="flex-1">
          <Text className="font-bold text-base text-white">{user?.fullName ?? 'User'}</Text>
          <Text className="text-xs text-neutral-500">{user?.emailAddresses[0]?.emailAddress}</Text>
        </View>
      </View>

      {/* Nav sections */}
      <View className="flex-1 px-5">
        {/* Section tabs */}
        <View className="mb-6 flex-row gap-2">
          {(['home', 'buckets', 'export'] as DrawerSection[]).map((s) => (
            <Pressable
              key={s}
              testID={`section-tab-${s}`}
              onPress={() => setSection(s)}
              accessibilityRole="button"
              accessibilityLabel={`${s} section`}
              className={`flex-1 rounded-xl border py-2.5 items-center ${
                section === s ? 'border-emerald-500 bg-emerald-500/10' : 'border-neutral-800'
              }`}
            >
              <Text
                className={`font-semibold text-sm capitalize ${
                  section === s ? 'text-emerald-400' : 'text-neutral-500'
                }`}
              >
                {s}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {section === 'home' && (
            <View className="gap-3">
              <DrawerItem
                label="Sign out"
                icon={<Icon icon={Logout01Icon} size={20} color="#ef4444" />}
                labelClass="text-red-500"
                onPress={handleSignOut}
              />
            </View>
          )}

          {section === 'buckets' && (
            <View className="gap-3">
              <Pressable
                onPress={openSheet}
                accessibilityRole="button"
                accessibilityLabel="Create new bucket"
                className="flex-row items-center gap-3 rounded-2xl border border-dashed border-emerald-700 bg-emerald-950/20 px-5 py-4 active:bg-emerald-950/40"
              >
                <Icon icon={Tag01Icon} size={20} color="#10b981" />
                <Text className="font-semibold text-emerald-400">New Bucket</Text>
              </Pressable>

              {buckets.length === 0 ? (
                <Text className="text-center text-sm text-neutral-600 mt-4">
                  No buckets yet. Create one above.
                </Text>
              ) : (
                <Animated.View layout={LinearTransition.springify()}>
                  {buckets.map((b, i) => (
                    <Animated.View
                      key={b._id}
                      entering={FadeInDown.delay(i * 30).springify()}
                      layout={LinearTransition.springify()}
                    >
                      <View className="mb-2 flex-row items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-950 px-5 py-4">
                        <View className="flex-row items-center gap-3">
                          <Icon icon={Tag01Icon} size={18} color="#525252" />
                          <View>
                            <Text className="font-semibold text-white">{b.title}</Text>
                            <Text className="text-xs text-neutral-500">{b.type}</Text>
                          </View>
                        </View>
                        <Pressable
                          onPress={() => confirmDeleteBucket(b._id, b.title)}
                          accessibilityRole="button"
                          accessibilityLabel={`Delete bucket ${b.title}`}
                          className="p-2"
                        >
                          <Icon icon={Delete02Icon} size={16} color="#525252" />
                        </Pressable>
                      </View>
                    </Animated.View>
                  ))}
                </Animated.View>
              )}
            </View>
          )}

          {section === 'export' && (
            <View className="gap-4">
              <View className="rounded-2xl border border-neutral-800 bg-neutral-950 px-5 py-4 gap-1">
                <Text className="font-bold text-base text-white">Expense Report</Text>
                <Text className="text-xs text-neutral-500 mb-3">
                  {allItems.length} items across {groups.length} groups
                </Text>
                <VouchButton
                  label="Export Expenses CSV"
                  onPress={exportCSV}
                  disabled={allItems.length === 0}
                />
              </View>

              <View className="rounded-2xl border border-neutral-800 bg-neutral-950 px-5 py-4 gap-1">
                <Text className="font-bold text-base text-white">Wish List Report</Text>
                <Text className="text-xs text-neutral-500 mb-3">
                  {wishes.length} wishes
                </Text>
                <VouchButton
                  label="Export Wishes CSV"
                  onPress={exportWishesCSV}
                  disabled={wishes.length === 0}
                />
              </View>

              <View className="rounded-2xl border border-neutral-800 px-5 py-4">
                <Text className="text-xs text-neutral-600 text-center leading-relaxed">
                  All data is compiled locally on device and shared via your device's native share sheet.
                </Text>
              </View>
            </View>
          )}
          <View className="h-20" />
        </ScrollView>
      </View>

      {/* Bucket sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#0a0a0a' }}
        handleIndicatorStyle={{ backgroundColor: '#404040' }}
      >
        <BottomSheetView className="px-5 pt-4 pb-8 gap-5">
          <Text className="font-bold text-2xl text-white">New Bucket</Text>
          <VouchInput
            label="Bucket Name"
            placeholder="e.g. Food & Drink"
            value={bucketTitle}
            onChangeText={(t) => { setBucketTitle(t); setBucketError(''); }}
            autoFocus
          />
          <VouchInput
            label="Type"
            placeholder="e.g. Need / Want / Subscription"
            value={bucketType}
            onChangeText={(t) => { setBucketType(t); setBucketError(''); }}
          />
          {bucketError ? <Text className="text-sm text-red-500">{bucketError}</Text> : null}
          <VouchButton label="Create Bucket" onPress={handleSaveBucket} />
          <VouchButton label="Cancel" variant="ghost" onPress={closeSheet} />
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  );
}

function DrawerItem({
  label,
  icon,
  labelClass = 'text-white',
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  labelClass?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-row items-center gap-3 rounded-2xl border border-neutral-800 px-5 py-4 active:bg-neutral-900"
    >
      {icon}
      <Text className={`font-semibold text-base ${labelClass}`}>{label}</Text>
    </Pressable>
  );
}
