import { useUser } from '@clerk/clerk-expo';
import {
  Add01Icon,
  ArrowLeft01Icon,
  Delete02Icon,
  FolderOpenIcon,
  Menu01Icon,
  PencilEdit01Icon,
} from '@hugeicons/core-free-icons';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
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

type ActiveSheet = 'add-group' | 'add-item' | 'edit-item' | 'add-bucket' | null;

export default function ExpensesScreen() {
  const { user } = useUser();
  const router = useRouter();

  const groups = useQuery(api.groups.list) ?? [];
  const buckets = useQuery(api.buckets.list) ?? [];

  const createGroup = useMutation(api.groups.create);
  const removeGroup = useMutation(api.groups.remove);

  const createItem = useMutation(api.items.create);
  const removeItem = useMutation(api.items.remove);

  const createBucket = useMutation(api.buckets.create);

  // Drill into a group to see its items
  const [selectedGroupId, setSelectedGroupId] = useState<Id<'groups'> | null>(null);
  const selectedGroup = groups.find((g) => g._id === selectedGroupId);
  const items = useQuery(
    api.items.listByGroup,
    selectedGroupId ? { groupId: selectedGroupId } : 'skip'
  ) ?? [];

  // Sheet state
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

  // Add group form
  const [groupTitle, setGroupTitle] = useState('');
  const [groupError, setGroupError] = useState('');

  // Add item form
  const [itemTitle, setItemTitle] = useState('');
  const [itemPlanned, setItemPlanned] = useState('');
  const [itemActual, setItemActual] = useState('');
  const [itemReason, setItemReason] = useState('');
  const [itemBucketId, setItemBucketId] = useState<Id<'buckets'> | null>(null);
  const [itemError, setItemError] = useState('');
  const [itemSaving, setItemSaving] = useState(false);

  // Add bucket inline
  const [bucketTitle, setBucketTitle] = useState('');
  const [bucketType, setBucketType] = useState('');
  const [bucketError, setBucketError] = useState('');

  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ['60%', '90%'], []);

  const openSheet = (sheet: ActiveSheet) => {
    setActiveSheet(sheet);
    bottomSheetRef.current?.snapToIndex(0);
  };

  const closeSheet = useCallback(() => {
    bottomSheetRef.current?.close();
    setActiveSheet(null);
    resetForms();
  }, []);

  const resetForms = () => {
    setGroupTitle('');
    setGroupError('');
    setItemTitle('');
    setItemPlanned('');
    setItemActual('');
    setItemReason('');
    setItemBucketId(null);
    setItemError('');
    setBucketTitle('');
    setBucketType('');
    setBucketError('');
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.7} />
    ),
    []
  );

  // Compute variance info for display
  const needsReason = () => {
    const p = parseFloat(itemPlanned);
    const a = parseFloat(itemActual);
    return !isNaN(p) && !isNaN(a) && a > p;
  };

  const handleSaveGroup = async () => {
    if (!groupTitle.trim()) {
      setGroupError('Name is required');
      return;
    }
    try {
      await createGroup({ title: groupTitle });
      closeSheet();
    } catch (e: unknown) {
      setGroupError(e instanceof Error ? e.message : 'Failed to create group');
    }
  };

  const handleSaveItem = async () => {
    if (!itemTitle.trim()) { setItemError('Title is required'); return; }
    if (!itemBucketId) { setItemError('Select a bucket'); return; }
    const planned = parseFloat(itemPlanned);
    const actual = parseFloat(itemActual);
    if (isNaN(planned) || planned < 0) { setItemError('Enter a valid planned amount'); return; }
    if (isNaN(actual) || actual < 0) { setItemError('Enter a valid actual amount'); return; }
    if (actual > planned && itemReason.trim().length < 10) {
      setItemError('Provide at least 10 characters explaining why actual exceeds planned');
      return;
    }
    if (!selectedGroupId) return;

    setItemSaving(true);
    try {
      await createItem({
        groupId: selectedGroupId,
        bucketId: itemBucketId,
        title: itemTitle,
        planned,
        actual,
        reason: actual > planned ? itemReason : undefined,
      });
      closeSheet();
    } catch (e: unknown) {
      setItemError(e instanceof Error ? e.message : 'Failed to save item');
    } finally {
      setItemSaving(false);
    }
  };

  const handleSaveBucket = async () => {
    if (!bucketTitle.trim()) { setBucketError('Title required'); return; }
    if (!bucketType.trim()) { setBucketError('Type required'); return; }
    try {
      const id = await createBucket({ title: bucketTitle, type: bucketType }) as Id<'buckets'>;
      setItemBucketId(id);
      closeSheet();
      // Re-open add-item sheet
      setTimeout(() => openSheet('add-item'), 300);
    } catch (e: unknown) {
      setBucketError(e instanceof Error ? e.message : 'Failed to create bucket');
    }
  };

  const confirmDeleteGroup = (id: Id<'groups'>, title: string) => {
    Alert.alert(
      `Delete "${title}"?`,
      'All items in this group will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeGroup({ id }),
        },
      ]
    );
  };

  const confirmDeleteItem = (id: Id<'items'>, title: string) => {
    Alert.alert(`Delete "${title}"?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeItem({ id }),
      },
    ]);
  };

  const totalPlanned = items.reduce((s, i) => s + i.planned, 0);
  const totalActual = items.reduce((s, i) => s + i.actual, 0);
  const isOver = totalActual > totalPlanned;

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-4">
        {selectedGroupId ? (
          <Pressable
            onPress={() => setSelectedGroupId(null)}
            accessibilityRole="button"
            accessibilityLabel="Back to groups"
            className="p-1"
          >
            <Icon icon={ArrowLeft01Icon} size={24} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push('/(drawer)')}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            className="p-1"
          >
            <Icon icon={Menu01Icon} size={24} color="#fff" />
          </Pressable>
        )}
        <View>
          {selectedGroupId ? (
            <Text className="font-bold text-lg text-white">{selectedGroup?.title}</Text>
          ) : (
            <Text className="font-bold text-xl text-white">
              Hey, {user?.firstName ?? 'there'}
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => openSheet(selectedGroupId ? 'add-item' : 'add-group')}
          accessibilityRole="button"
          accessibilityLabel={selectedGroupId ? 'Add item' : 'Add group'}
          className="h-10 w-10 items-center justify-center rounded-full bg-emerald-500"
        >
          <Icon icon={Add01Icon} size={20} color="#000" />
        </Pressable>
      </View>

      {/* Group list or Item list */}
      {!selectedGroupId ? (
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {groups.length === 0 ? (
            <EmptyState
              title="No expense groups yet"
              subtitle="Tap + to create your first group"
            />
          ) : (
            <Animated.View layout={LinearTransition.springify()}>
              {groups.map((group, i) => (
                <Animated.View
                  key={group._id}
                  entering={FadeInDown.delay(i * 40).springify()}
                  layout={LinearTransition.springify()}
                >
                  <Pressable
                    testID={`group-${group._id}`}
                    onPress={() => setSelectedGroupId(group._id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open group ${group.title}`}
                    className="mb-3 flex-row items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-950 px-5 py-4 active:bg-neutral-900"
                  >
                    <View className="flex-row items-center gap-3">
                      <Icon icon={FolderOpenIcon} size={20} color="#10b981" />
                      <Text className="font-bold text-base text-white">{group.title}</Text>
                    </View>
                    <Pressable
                      onPress={() => confirmDeleteGroup(group._id, group.title)}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete group ${group.title}`}
                      className="p-2"
                    >
                      <Icon icon={Delete02Icon} size={18} color="#525252" />
                    </Pressable>
                  </Pressable>
                </Animated.View>
              ))}
            </Animated.View>
          )}
          <View className="h-20" />
        </ScrollView>
      ) : (
        /* Item view */
        <View className="flex-1">
          {/* Budget summary bar */}
          {items.length > 0 && (
            <Animated.View entering={FadeIn.duration(300)} className="mx-5 mb-4 rounded-2xl border border-neutral-800 bg-neutral-950 px-5 py-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Planned</Text>
                <Text className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Actual</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="font-bold text-xl text-white">${totalPlanned.toFixed(2)}</Text>
                <Text className={`font-bold text-xl ${isOver ? 'text-red-500' : 'text-emerald-400'}`}>
                  ${totalActual.toFixed(2)}
                </Text>
              </View>
              {isOver && (
                <Animated.Text entering={FadeIn.duration(200)} className="mt-2 text-xs text-red-400">
                  Over by ${(totalActual - totalPlanned).toFixed(2)}
                </Animated.Text>
              )}
            </Animated.View>
          )}

          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {items.length === 0 ? (
              <EmptyState
                title="No items yet"
                subtitle="Tap + to track your first expense"
              />
            ) : (
              <Animated.View layout={LinearTransition.springify()}>
                {items.map((item, i) => {
                  const bucket = buckets.find((b) => b._id === item.bucketId);
                  const over = item.actual > item.planned;
                  return (
                    <Animated.View
                      key={item._id}
                      entering={FadeInDown.delay(i * 40).springify()}
                      exiting={FadeOutUp.duration(200)}
                      layout={LinearTransition.springify()}
                    >
                      <View className="mb-3 rounded-2xl border border-neutral-800 bg-neutral-950 px-5 py-4">
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1 gap-1 mr-2">
                            <Text className="font-bold text-base text-white">{item.title}</Text>
                            {bucket && (
                              <Text className="text-xs font-medium text-emerald-500">
                                {bucket.title}
                              </Text>
                            )}
                          </View>
                          <Pressable
                            onPress={() => confirmDeleteItem(item._id, item.title)}
                            accessibilityRole="button"
                            accessibilityLabel={`Delete ${item.title}`}
                            className="p-1"
                          >
                            <Icon icon={Delete02Icon} size={17} color="#525252" />
                          </Pressable>
                        </View>
                        <View className="mt-3 flex-row gap-4">
                          <View>
                            <Text className="text-xs text-neutral-500 mb-0.5">Planned</Text>
                            <Text className="font-bold text-white">${item.planned.toFixed(2)}</Text>
                          </View>
                          <View>
                            <Text className="text-xs text-neutral-500 mb-0.5">Actual</Text>
                            <Text className={`font-bold ${over ? 'text-red-400' : 'text-emerald-400'}`}>
                              ${item.actual.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                        {over && item.reason && (
                          <View className="mt-3 rounded-xl border border-red-900/40 bg-red-950/20 px-3 py-2">
                            <Text className="text-xs text-red-400 leading-relaxed">{item.reason}</Text>
                          </View>
                        )}
                      </View>
                    </Animated.View>
                  );
                })}
              </Animated.View>
            )}
            <View className="h-20" />
          </ScrollView>
        </View>
      )}

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={() => setActiveSheet(null)}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#0a0a0a' }}
        handleIndicatorStyle={{ backgroundColor: '#404040' }}
      >
        {activeSheet === 'add-group' && (
          <BottomSheetView className="px-5 pt-4 pb-8 gap-5">
            <Text className="font-bold text-2xl text-white">New Expense Group</Text>
            <VouchInput
              label="Group Name"
              placeholder="e.g. February 2025"
              value={groupTitle}
              onChangeText={(t) => { setGroupTitle(t); setGroupError(''); }}
              autoFocus
              error={groupError}
            />
            <VouchButton label="Create Group" onPress={handleSaveGroup} />
            <VouchButton label="Cancel" variant="ghost" onPress={closeSheet} />
          </BottomSheetView>
        )}

        {activeSheet === 'add-item' && (
          <BottomSheetScrollView className="px-5 pt-4" contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
            <Text className="font-bold text-2xl text-white">New Expense Item</Text>

            <VouchInput
              label="Title"
              placeholder="e.g. Groceries"
              value={itemTitle}
              onChangeText={(t) => { setItemTitle(t); setItemError(''); }}
              autoFocus
            />

            {/* Bucket selector */}
            <View className="gap-2">
              <Text className="font-semibold text-xs uppercase tracking-widest text-neutral-500">
                Bucket
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {buckets.map((b) => (
                    <Pressable
                      key={b._id}
                      onPress={() => { setItemBucketId(b._id); setItemError(''); }}
                      accessibilityRole="button"
                      accessibilityLabel={`Select bucket ${b.title}`}
                      className={`rounded-xl border px-4 py-2 ${
                        itemBucketId === b._id
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-neutral-800 bg-neutral-900'
                      }`}
                    >
                      <Text className={`font-semibold text-sm ${itemBucketId === b._id ? 'text-emerald-400' : 'text-neutral-300'}`}>
                        {b.title}
                      </Text>
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={() => {
                      closeSheet();
                      setTimeout(() => openSheet('add-bucket'), 300);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Create new bucket"
                    className="rounded-xl border border-dashed border-neutral-700 px-4 py-2"
                  >
                    <Text className="font-semibold text-sm text-neutral-500">+ New</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>

            <VouchInput
              label="Planned Amount"
              placeholder="0.00"
              prefix="$"
              value={itemPlanned}
              onChangeText={(t) => { setItemPlanned(t); setItemError(''); }}
              keyboardType="decimal-pad"
            />

            <VouchInput
              label="Actual Amount"
              placeholder="0.00"
              prefix="$"
              value={itemActual}
              onChangeText={(t) => { setItemActual(t); setItemError(''); }}
              keyboardType="decimal-pad"
            />

            {needsReason() && (
              <Animated.View entering={FadeIn.duration(250)}>
                <VouchInput
                  label={`Reason (${itemReason.trim().length}/100 — min 10)`}
                  placeholder="Explain why actual exceeds planned..."
                  value={itemReason}
                  onChangeText={(t) => { if (t.length <= 100) { setItemReason(t); setItemError(''); } }}
                  multiline
                  numberOfLines={3}
                  error={
                    itemReason.trim().length > 0 && itemReason.trim().length < 10
                      ? 'At least 10 characters required'
                      : undefined
                  }
                />
              </Animated.View>
            )}

            {itemError ? (
              <Text className="text-sm text-red-500">{itemError}</Text>
            ) : null}

            <VouchButton label="Save Item" loading={itemSaving} onPress={handleSaveItem} />
            <VouchButton label="Cancel" variant="ghost" onPress={closeSheet} />
          </BottomSheetScrollView>
        )}

        {activeSheet === 'add-bucket' && (
          <BottomSheetView className="px-5 pt-4 pb-8 gap-5">
            <Text className="font-bold text-2xl text-white">New Bucket</Text>
            <VouchInput
              label="Bucket Name"
              placeholder="e.g. Food"
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
            <VouchButton
              label="Cancel"
              variant="ghost"
              onPress={() => {
                closeSheet();
                setTimeout(() => openSheet('add-item'), 300);
              }}
            />
          </BottomSheetView>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}
