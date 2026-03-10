import '@/__tests__/helpers/mock-clerk';
import '@/__tests__/helpers/mock-convex';
import '@/__tests__/helpers/mock-misc';
import '@/__tests__/helpers/mock-router';

import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

import { VouchButton } from '@/components/ui/VouchButton';

describe('VouchButton', () => {
  it('renders label', () => {
    render(<VouchButton label="Save" onPress={jest.fn()} />);
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<VouchButton label="Save" onPress={onPress} />);
    fireEvent.press(screen.getByText('Save'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<VouchButton label="Save" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText('Save'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    render(<VouchButton label="Save" onPress={onPress} loading />);
    fireEvent.press(screen.getByText('Save'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders primary variant by default', () => {
    render(<VouchButton label="Go" onPress={jest.fn()} />);
    expect(screen.getByText('Go')).toBeTruthy();
  });

  it('renders danger variant', () => {
    render(<VouchButton label="Delete" onPress={jest.fn()} variant="danger" />);
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('renders ghost variant', () => {
    render(<VouchButton label="Cancel" onPress={jest.fn()} variant="ghost" />);
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('shows label text when loading', () => {
    render(<VouchButton label="Saving" onPress={jest.fn()} loading />);
    expect(screen.getByText('Saving')).toBeTruthy();
  });
});
