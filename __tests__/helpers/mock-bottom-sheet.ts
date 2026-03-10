import React from 'react';

// Mock @gorhom/bottom-sheet
jest.mock('@gorhom/bottom-sheet', () => {
  const RN = require('react-native');
  const mockReact = require('react');

  const BottomSheet = mockReact.forwardRef(
    (
      {
        children,
        onClose,
      }: { children?: React.ReactNode; onClose?: () => void },
      ref: React.Ref<{ snapToIndex: jest.Mock; close: jest.Mock }>
    ) => {
      mockReact.useImperativeHandle(ref, () => ({
        snapToIndex: jest.fn(),
        close: jest.fn(() => onClose?.()),
      }));
      return mockReact.createElement(RN.View, { testID: 'bottom-sheet' }, children);
    }
  );

  return {
    __esModule: true,
    default: BottomSheet,
    BottomSheetView: ({ children }: { children?: React.ReactNode }) =>
      mockReact.createElement(RN.View, { testID: 'bottom-sheet-view' }, children),
    BottomSheetScrollView: ({ children }: { children?: React.ReactNode }) =>
      mockReact.createElement(RN.ScrollView, { testID: 'bottom-sheet-scroll' }, children),
    BottomSheetBackdrop: () => null,
  };
});

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/docs/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: { UTF8: 'utf8' },
}));

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const RN = require('react-native');
  return {
    GestureHandlerRootView: RN.View,
    Gesture: { Pan: jest.fn() },
  };
});
