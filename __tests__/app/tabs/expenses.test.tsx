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

import ExpensesScreen from '@/app/(tabs)/index';

const mockCreateGroup = jest.fn().mockResolvedValue('group-1');
const mockRemoveGroup = jest.fn().mockResolvedValue(undefined);
const mockCreateItem = jest.fn().mockResolvedValue('item-1');
const mockRemoveItem = jest.fn().mockResolvedValue(undefined);
const mockCreateBucket = jest.fn().mockResolvedValue('bucket-1');

const MOCK_BUCKETS = [
  { _id: 'bucket-1', title: 'FoodLabel', type: 'Need', userId: 'user-1' },
  { _id: 'bucket-2', title: 'Transport', type: 'Need', userId: 'user-1' },
];

const MOCK_GROUPS = [
  { _id: 'group-1', title: 'February 2025', timestamp: 1700000000, userId: 'user-1' },
  { _id: 'group-2', title: 'March 2025', timestamp: 1700000001, userId: 'user-1' },
];

const MOCK_ITEMS = [
  {
    _id: 'item-1',
    groupId: 'group-1',
    bucketId: 'bucket-1',
    title: 'Groceries',
    planned: 200,
    actual: 180,
    userId: 'user-1',
  },
  {
    _id: 'item-2',
    groupId: 'group-1',
    bucketId: 'bucket-2',
    title: 'Bus pass',
    planned: 50,
    actual: 65,
    reason: 'Price increased this month due to special route',
    userId: 'user-1',
  },
];

beforeEach(() => {
  jest.clearAllMocks();

  mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true, signOut: jest.fn() });
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
    .mockReturnValueOnce(mockCreateGroup)
    .mockReturnValueOnce(mockRemoveGroup)
    .mockReturnValueOnce(mockCreateItem)
    .mockReturnValueOnce(mockRemoveItem)
    .mockReturnValueOnce(mockCreateBucket);

  // Stable mock across re-renders
  mockUseQuery.mockImplementation((queryKey: string) => {
    if (queryKey === 'groups:list') return MOCK_GROUPS;
    if (queryKey === 'buckets:list') return MOCK_BUCKETS;
    if (queryKey === 'items:listByGroup') return [];
    return [];
  });
});

describe('ExpensesScreen', () => {
  it('renders greeting with user first name', () => {
    render(<ExpensesScreen />);
    expect(screen.getByText('Hey, Alice')).toBeTruthy();
  });

  it('renders group list', () => {
    render(<ExpensesScreen />);
    expect(screen.getByText('February 2025')).toBeTruthy();
    expect(screen.getByText('March 2025')).toBeTruthy();
  });

  it('shows empty state when no groups exist', () => {
    mockUseQuery.mockImplementation((queryKey: string) => {
      if (queryKey === 'groups:list') return [];
      if (queryKey === 'buckets:list') return MOCK_BUCKETS;
      return [];
    });

    render(<ExpensesScreen />);
    expect(screen.getByText('No expense groups yet')).toBeTruthy();
  });

  it('shows items when a group is selected via testID', () => {
    mockUseQuery.mockImplementation((queryKey: string) => {
      if (queryKey === 'groups:list') return MOCK_GROUPS;
      if (queryKey === 'buckets:list') return MOCK_BUCKETS;
      if (queryKey === 'items:listByGroup') return MOCK_ITEMS;
      return [];
    });

    render(<ExpensesScreen />);
    fireEvent.press(screen.getByTestId('group-group-1'));
    expect(screen.getByText('Groceries')).toBeTruthy();
    expect(screen.getByText('Bus pass')).toBeTruthy();
  });

  it('shows item reason text for over-budget item', () => {
    mockUseQuery.mockImplementation((queryKey: string) => {
      if (queryKey === 'groups:list') return MOCK_GROUPS;
      if (queryKey === 'buckets:list') return MOCK_BUCKETS;
      if (queryKey === 'items:listByGroup') return MOCK_ITEMS;
      return [];
    });

    render(<ExpensesScreen />);
    fireEvent.press(screen.getByTestId('group-group-1'));
    expect(screen.getByText('Price increased this month due to special route')).toBeTruthy();
  });

  it('shows planned and actual amounts for items', () => {
    mockUseQuery.mockImplementation((queryKey: string) => {
      if (queryKey === 'groups:list') return MOCK_GROUPS;
      if (queryKey === 'buckets:list') return MOCK_BUCKETS;
      if (queryKey === 'items:listByGroup') return MOCK_ITEMS;
      return [];
    });

    render(<ExpensesScreen />);
    fireEvent.press(screen.getByTestId('group-group-1'));
    expect(screen.getByText('$200.00')).toBeTruthy();
    expect(screen.getByText('$180.00')).toBeTruthy();
  });

  it('shows empty state for items when group has no items', () => {
    mockUseQuery.mockImplementation((queryKey: string) => {
      if (queryKey === 'groups:list') return MOCK_GROUPS;
      if (queryKey === 'buckets:list') return MOCK_BUCKETS;
      return [];
    });

    render(<ExpensesScreen />);
    fireEvent.press(screen.getByTestId('group-group-1'));
    expect(screen.getByText('No items yet')).toBeTruthy();
  });

  it('shows bucket label for items', () => {
    mockUseQuery.mockImplementation((queryKey: string) => {
      if (queryKey === 'groups:list') return MOCK_GROUPS;
      if (queryKey === 'buckets:list') return MOCK_BUCKETS;
      if (queryKey === 'items:listByGroup') return MOCK_ITEMS;
      return [];
    });

    render(<ExpensesScreen />);
    fireEvent.press(screen.getByTestId('group-group-1'));
    expect(screen.getByText('FoodLabel')).toBeTruthy();
  });

  it('shows budget summary bar with planned/actual labels', () => {
    mockUseQuery.mockImplementation((queryKey: string) => {
      if (queryKey === 'groups:list') return MOCK_GROUPS;
      if (queryKey === 'buckets:list') return MOCK_BUCKETS;
      if (queryKey === 'items:listByGroup') return MOCK_ITEMS;
      return [];
    });

    render(<ExpensesScreen />);
    fireEvent.press(screen.getByTestId('group-group-1'));
    // Multiple matches expected (summary bar + per-item labels)
    expect(screen.getAllByText('Planned').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Actual').length).toBeGreaterThan(0);
  });

  it('displays group title as header when inside group', () => {
    mockUseQuery.mockImplementation((queryKey: string) => {
      if (queryKey === 'groups:list') return MOCK_GROUPS;
      if (queryKey === 'buckets:list') return MOCK_BUCKETS;
      return [];
    });

    render(<ExpensesScreen />);
    fireEvent.press(screen.getByTestId('group-group-1'));
    expect(screen.getByText('February 2025')).toBeTruthy();
  });
});
