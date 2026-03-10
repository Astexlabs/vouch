import '@/__tests__/helpers/mock-clerk';
import '@/__tests__/helpers/mock-misc';

import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';

import { VouchInput } from '@/components/ui/VouchInput';

describe('VouchInput', () => {
  it('renders placeholder text', () => {
    render(<VouchInput placeholder="Enter amount" />);
    expect(screen.getByPlaceholderText('Enter amount')).toBeTruthy();
  });

  it('renders label', () => {
    render(<VouchInput label="Amount" placeholder="0.00" />);
    expect(screen.getByText('Amount')).toBeTruthy();
  });

  it('renders error message', () => {
    render(<VouchInput placeholder="Name" error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeTruthy();
  });

  it('renders prefix', () => {
    render(<VouchInput placeholder="0.00" prefix="$" />);
    expect(screen.getByText('$')).toBeTruthy();
  });

  it('fires onChangeText on input', () => {
    const onChange = jest.fn();
    render(<VouchInput placeholder="Name" onChangeText={onChange} />);
    fireEvent.changeText(screen.getByPlaceholderText('Name'), 'Alice');
    expect(onChange).toHaveBeenCalledWith('Alice');
  });

  it('renders without label or error when not provided', () => {
    render(<VouchInput placeholder="Test" />);
    expect(screen.getByPlaceholderText('Test')).toBeTruthy();
  });
});
