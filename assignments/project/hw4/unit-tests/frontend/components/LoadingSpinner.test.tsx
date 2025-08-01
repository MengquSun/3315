/**
 * Unit tests for LoadingSpinner component
 * Tests loading indicator rendering and behavior
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { LoadingSpinner } from '../../../hw3/frontend/src/components/common/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render loading spinner with default props', () => {
    // Act
    render(<LoadingSpinner />);

    // Assert
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('loading-spinner');
  });

  it('should render with custom size', () => {
    // Act
    render(<LoadingSpinner size="large" />);

    // Assert
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('loading-spinner--large');
  });

  it('should render with custom message', () => {
    // Arrange
    const customMessage = 'Loading tasks...';

    // Act
    render(<LoadingSpinner message={customMessage} />);

    // Assert
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('should render with default message when no message provided', () => {
    // Act
    render(<LoadingSpinner />);

    // Assert
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render with custom className', () => {
    // Arrange
    const customClass = 'custom-spinner';

    // Act
    render(<LoadingSpinner className={customClass} />);

    // Assert
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('loading-spinner');
    expect(spinner).toHaveClass(customClass);
  });

  it('should render small size spinner', () => {
    // Act
    render(<LoadingSpinner size="small" />);

    // Assert
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('loading-spinner--small');
  });

  it('should render medium size spinner by default', () => {
    // Act
    render(<LoadingSpinner />);

    // Assert
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('loading-spinner--medium');
  });

  it('should have proper accessibility attributes', () => {
    // Act
    render(<LoadingSpinner />);

    // Assert
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveAttribute('role', 'status');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('should render without message when showMessage is false', () => {
    // Act
    render(<LoadingSpinner showMessage={false} />);

    // Assert
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should render with overlay when overlay prop is true', () => {
    // Act
    render(<LoadingSpinner overlay />);

    // Assert
    const overlay = screen.getByTestId('loading-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('loading-overlay');
  });

  it('should render without overlay by default', () => {
    // Act
    render(<LoadingSpinner />);

    // Assert
    expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();
  });

  it('should apply correct CSS classes for different combinations', () => {
    // Test size + overlay
    const { rerender } = render(<LoadingSpinner size="large" overlay />);
    
    let spinner = screen.getByTestId('loading-spinner');
    let overlay = screen.getByTestId('loading-overlay');
    
    expect(spinner).toHaveClass('loading-spinner--large');
    expect(overlay).toHaveClass('loading-overlay');

    // Test different size without overlay
    rerender(<LoadingSpinner size="small" />);
    
    spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('loading-spinner--small');
    expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();
  });

  it('should handle custom data attributes', () => {
    // Act
    render(<LoadingSpinner data-testid="custom-spinner" />);

    // Assert
    expect(screen.getByTestId('custom-spinner')).toBeInTheDocument();
  });

  it('should maintain proper structure when all props are provided', () => {
    // Act
    render(
      <LoadingSpinner
        size="large"
        message="Loading your tasks..."
        className="custom-class"
        overlay
        showMessage={true}
      />
    );

    // Assert
    const overlay = screen.getByTestId('loading-overlay');
    const spinner = screen.getByTestId('loading-spinner');
    const message = screen.getByText('Loading your tasks...');

    expect(overlay).toBeInTheDocument();
    expect(spinner).toHaveClass('loading-spinner--large', 'custom-class');
    expect(message).toBeInTheDocument();
  });

  it('should render spinner animation elements', () => {
    // Act
    render(<LoadingSpinner />);

    // Assert
    const spinner = screen.getByTestId('loading-spinner');
    const spinnerElement = spinner.querySelector('.spinner');
    
    expect(spinnerElement).toBeInTheDocument();
  });

  it('should be accessible with screen readers', () => {
    // Act
    render(<LoadingSpinner message="Loading tasks..." />);

    // Assert
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveAttribute('role', 'status');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
    
    // Message should be accessible
    const message = screen.getByText('Loading tasks...');
    expect(message).toBeInTheDocument();
  });

  it('should handle edge cases', () => {
    // Test with empty message
    const { rerender } = render(<LoadingSpinner message="" />);
    expect(screen.queryByText('')).not.toBeInTheDocument();

    // Test with undefined message
    rerender(<LoadingSpinner message={undefined} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Test with null className
    rerender(<LoadingSpinner className={null as any} />);
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('loading-spinner');
  });
});