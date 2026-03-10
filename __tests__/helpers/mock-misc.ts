// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockRN = require('react-native');
  return {
    SafeAreaView: mockRN.View,
    SafeAreaProvider: mockRN.View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Mock @hugeicons
jest.mock('@hugeicons/core-free-icons', () => ({
  Home01Icon: 'Home01Icon',
  Home09Icon: 'Home09Icon',
  Settings01Icon: 'Settings01Icon',
  Notification03Icon: 'Notification03Icon',
  Logout01Icon: 'Logout01Icon',
  Mail01Icon: 'Mail01Icon',
  UserIcon: 'UserIcon',
  Edit01Icon: 'Edit01Icon',
  Add01Icon: 'Add01Icon',
  Delete02Icon: 'Delete02Icon',
  FolderOpenIcon: 'FolderOpenIcon',
  Menu01Icon: 'Menu01Icon',
  ArrowLeft01Icon: 'ArrowLeft01Icon',
  Tag01Icon: 'Tag01Icon',
  StarIcon: 'StarIcon',
  ShoppingBag02Icon: 'ShoppingBag02Icon',
  CheckmarkCircle02Icon: 'CheckmarkCircle02Icon',
  DocumentDownloadIcon: 'DocumentDownloadIcon',
  PencilEdit01Icon: 'PencilEdit01Icon',
}));

jest.mock('@/components/ui/icon', () => ({
  Icon: () => null,
}));

// Mock push notifications hook
jest.mock('@/hooks/use-push-notifications', () => ({
  usePushNotifications: jest.fn().mockReturnValue({
    expoPushToken: null,
    notification: null,
  }),
}));

// Mock passkeys - default to not supported in tests
jest.mock('@/lib/passkeys', () => ({
  isPasskeySupported: jest.fn().mockReturnValue(false),
}));
