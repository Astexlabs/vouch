import '../../helpers/mock-clerk';
import '../../helpers/mock-convex';
import '../../helpers/mock-router';
import '../../helpers/mock-misc';

import { render, screen } from '@testing-library/react-native';
import React from 'react';

import SettingsScreen from '@/app/(tabs)/settings';

describe('SettingsScreen (redirect)', () => {
  it('redirects to drawer', () => {
    render(<SettingsScreen />);
    const redirect = screen.getByTestId('redirect');
    expect(redirect.props.children).toBe('/(drawer)');
  });
});
