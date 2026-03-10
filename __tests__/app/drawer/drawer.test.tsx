import '@/__tests__/helpers/mock-clerk';
import '@/__tests__/helpers/mock-convex';
import '@/__tests__/helpers/mock-misc';
import '@/__tests__/helpers/mock-router';
import '@/__tests__/helpers/mock-bottom-sheet';

import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';

import { mockUseAuth, mockUseUser } from '@/__tests__/helpers/mock-clerk';
import { mockUseQuery, mockUseMutation } from '@/__tests__/helpers/mock-convex';
import { mockRouter } from '@/__tests__/helpers/mock-router';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

import DrawerScreen from '@/app/(drawer)/index';

const mockCreateBucket = jest.fn().mockResolvedValue('bucket-new');
const mockRemoveBucket = jest.fn().mockResolvedValue(undefined);
const mockSignOut = jest.fn().mockResolvedValue(undefined);

const MOCK_BUCKETS = [
  { _id: 'b-1', title: 'FoodBucket', type: 'NeedType', userId: 'u-1' },
  { _id: 'b-2', title: 'FunBucket', type: 'WantType', userId: 'u-1' },
];

const MOCK_GROUPS = [
  { _id: 'g-1', title: 'Feb 2025', timestamp: 1700000000, userId: 'u-1' },
];

const MOCK_ITEMS = [
  { _id: 'i-1', groupId: 'g-1', bucketId: 'b-1', title: 'Groceries', planned: 200, actual: 180, userId: 'u-1' },
];

const MOCK_WISHES = [
  { _id: 'w-1', title: 'Laptop', amount: 1500, priority: 1, utility: 'Work', purchased: false, userId: 'u-1' },
];

beforeEach(() => {
  jest.clearAllMocks();

  mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true, signOut: mockSignOut });
  mockUseUser.mockReturnValue({
    user: {
      firstName: 'Alice',
      lastName: 'Smith',
      fullName: 'Alice Smith',
      username: 'alice',
      emailAddresses: [{ emailAddress: 'alice@example.com' }],
    },
  });

  mockUseMutation
    .mockReturnValueOnce(mockCreateBucket)
    .mockReturnValueOnce(mockRemoveBucket);

  // Use mockImplementation so queries return stable values across re-renders
  mockUseQuery.mockImplementation((queryKey: string) => {
    if (queryKey === 'buckets:list') return MOCK_BUCKETS;
    if (queryKey === 'groups:list') return MOCK_GROUPS;
    if (queryKey === 'items:listAll') return MOCK_ITEMS;
    if (queryKey === 'wishes:list') return MOCK_WISHES;
    return [];
  });
});

describe('DrawerScreen', () => {
  it('renders user name in profile summary', () => {
    render(<DrawerScreen />);
    expect(screen.getByText('Alice Smith')).toBeTruthy();
  });

  it('renders user email in profile summary', () => {
    render(<DrawerScreen />);
    expect(screen.getByText('alice@example.com')).toBeTruthy();
  });

  it('renders Menu heading', () => {
    render(<DrawerScreen />);
    expect(screen.getByText('Menu')).toBeTruthy();
  });

  it('renders section tab labels', () => {
    render(<DrawerScreen />);
    expect(screen.getByTestId('section-tab-home')).toBeTruthy();
    expect(screen.getByTestId('section-tab-buckets')).toBeTruthy();
    expect(screen.getByTestId('section-tab-export')).toBeTruthy();
  });

  it('shows sign out button in home section', () => {
    render(<DrawerScreen />);
    expect(screen.getByText('Sign out')).toBeTruthy();
  });

  it('shows buckets when switching to buckets section', () => {
    render(<DrawerScreen />);
    fireEvent.press(screen.getByTestId('section-tab-buckets'));
    expect(screen.getByText('FoodBucket')).toBeTruthy();
    expect(screen.getByText('FunBucket')).toBeTruthy();
  });

  it('shows bucket types in buckets section', () => {
    render(<DrawerScreen />);
    fireEvent.press(screen.getByTestId('section-tab-buckets'));
    expect(screen.getByText('NeedType')).toBeTruthy();
    expect(screen.getByText('WantType')).toBeTruthy();
  });

  it('shows New Bucket prompt in buckets section', () => {
    render(<DrawerScreen />);
    fireEvent.press(screen.getByTestId('section-tab-buckets'));
    // Multiple "New Bucket" texts may appear (section + bottom sheet)
    const newBucketTexts = screen.getAllByText('New Bucket');
    expect(newBucketTexts.length).toBeGreaterThan(0);
  });

  it('shows export section with item/group counts', () => {
    render(<DrawerScreen />);
    fireEvent.press(screen.getByTestId('section-tab-export'));
    expect(screen.getByText('1 items across 1 groups')).toBeTruthy();
    expect(screen.getByText('1 wishes')).toBeTruthy();
  });

  it('renders export CSV buttons in export section', () => {
    render(<DrawerScreen />);
    fireEvent.press(screen.getByTestId('section-tab-export'));
    expect(screen.getByText('Export Expenses CSV')).toBeTruthy();
    expect(screen.getByText('Export Wishes CSV')).toBeTruthy();
  });

  it('renders Expense Report heading in export section', () => {
    render(<DrawerScreen />);
    fireEvent.press(screen.getByTestId('section-tab-export'));
    expect(screen.getByText('Expense Report')).toBeTruthy();
  });

  it('renders Wish List Report heading in export section', () => {
    render(<DrawerScreen />);
    fireEvent.press(screen.getByTestId('section-tab-export'));
    expect(screen.getByText('Wish List Report')).toBeTruthy();
  });
});
