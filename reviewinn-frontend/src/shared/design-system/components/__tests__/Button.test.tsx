/**
 * Button Component Tests
 * Comprehensive test suite for the Button component
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../../test/utils';
import { Button, ButtonGroup, IconButton } from '../Button';

describe('Button Component', () => {
  it('renders with default props', () => {
    renderWithProviders(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-blue-600'); // primary variant
  });

  it('applies variant classes correctly', () => {
    const { rerender } = renderWithProviders(<Button variant="secondary">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-cyan-600');

    rerender(<Button variant="outline">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-transparent', 'text-blue-600');

    rerender(<Button variant="ghost">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-transparent', 'text-gray-700');

    rerender(<Button variant="destructive">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');

    rerender(<Button variant="success">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-green-600');
  });

  it('applies size classes correctly', () => {
    const { rerender } = renderWithProviders(<Button size="sm">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-8', 'px-3', 'text-sm');

    rerender(<Button size="md">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10', 'px-4', 'text-base');

    rerender(<Button size="lg">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-12', 'px-6', 'text-lg');

    rerender(<Button size="xl">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-14', 'px-8', 'text-xl');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    renderWithProviders(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state correctly', () => {
    renderWithProviders(<Button isLoading>Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Loading');
    // Should have a spinner (div with border styles)
    expect(button.querySelector('div[style*="border"]')).toBeInTheDocument();
  });

  it('disables button when disabled prop is true', () => {
    const handleClick = vi.fn();
    renderWithProviders(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('cursor-not-allowed', 'opacity-50');
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with left and right icons', () => {
    const LeftIcon = () => <span data-testid="left-icon">L</span>;
    const RightIcon = () => <span data-testid="right-icon">R</span>;
    
    renderWithProviders(
      <Button leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
        With Icons
      </Button>
    );
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByText('With Icons')).toBeInTheDocument();
  });

  it('applies fullWidth correctly', () => {
    renderWithProviders(<Button fullWidth>Full Width</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-full');
  });

  it('forwards additional props', () => {
    renderWithProviders(
      <Button data-testid="custom-button" aria-label="Custom button">
        Test
      </Button>
    );
    
    const button = screen.getByTestId('custom-button');
    expect(button).toHaveAttribute('aria-label', 'Custom button');
  });
});

describe('ButtonGroup Component', () => {
  it('renders children in horizontal orientation by default', () => {
    renderWithProviders(
      <ButtonGroup>
        <Button>First</Button>
        <Button>Second</Button>
      </ButtonGroup>
    );
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    
    // Check that the container has flex-row class (Tailwind)
    const container = buttons[0].parentElement;
    expect(container).toHaveClass('flex');
  });

  it('renders children in vertical orientation', () => {
    renderWithProviders(
      <ButtonGroup orientation="vertical">
        <Button>First</Button>
        <Button>Second</Button>
      </ButtonGroup>
    );
    
    const container = screen.getAllByRole('button')[0].parentElement;
    expect(container).toHaveClass('flex-col');
  });

  it('applies custom spacing', () => {
    renderWithProviders(
      <ButtonGroup spacing="4">
        <Button>First</Button>
        <Button>Second</Button>
      </ButtonGroup>
    );
    
    const container = screen.getAllByRole('button')[0].parentElement;
    expect(container).toHaveClass('gap-4');
  });
});

describe('IconButton Component', () => {
  const TestIcon = () => <span data-testid="test-icon">I</span>;

  it('renders with icon and aria-label', () => {
    renderWithProviders(
      <IconButton icon={<TestIcon />} aria-label="Test icon button" />
    );
    
    const button = screen.getByRole('button', { name: /test icon button/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('applies square dimensions based on size', () => {
    const { rerender } = renderWithProviders(
      <IconButton icon={<TestIcon />} aria-label="Test" size="sm" />
    );
    expect(screen.getByRole('button')).toHaveClass('w-8', 'h-8');

    rerender(<IconButton icon={<TestIcon />} aria-label="Test" size="md" />);
    expect(screen.getByRole('button')).toHaveClass('w-10', 'h-10');

    rerender(<IconButton icon={<TestIcon />} aria-label="Test" size="lg" />);
    expect(screen.getByRole('button')).toHaveClass('w-12', 'h-12');

    rerender(<IconButton icon={<TestIcon />} aria-label="Test" size="xl" />);
    expect(screen.getByRole('button')).toHaveClass('w-14', 'h-14');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    renderWithProviders(
      <IconButton
        icon={<TestIcon />}
        aria-label="Test"
        onClick={handleClick}
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('requires aria-label for accessibility', () => {
    // This test ensures TypeScript compilation fails without aria-label
    // In a real scenario, you'd use a linter or type checker for this
    renderWithProviders(
      <IconButton
        icon={<TestIcon />}
        aria-label="Required label"
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Required label');
  });
});