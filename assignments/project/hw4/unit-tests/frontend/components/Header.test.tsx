/**
 * Unit tests for Header component
 * Tests navigation header rendering and user interactions
 */

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../../../hw3/frontend/src/components/layout/Header';
import { AuthContext } from '../../../hw3/frontend/src/context/AuthContext';
import { User } from '../../../hw3/shared/types';

// Mock the auth service
jest.mock('../../../hw3/frontend/src/services/authService');

// Mock router hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard' })
}));

describe('Header', () => {
  const mockUser: User = {
    id: 'user123',
    email: 'test@example.com',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  };

  const mockAuthContextValue = {
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
    signup: jest.fn(),
    clearError: jest.fn()
  };

  const HeaderWithRouter = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContextValue}>
        {children}
      </AuthContext.Provider>
    </BrowserRouter>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render header with user information when authenticated', () => {
    // Act
    render(
      <HeaderWithRouter>
        <Header />
      </HeaderWithRouter>
    );

    // Assert
    expect(screen.getByText('Task Manager')).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('should render header without user info when not authenticated', () => {
    // Arrange
    const unauthenticatedContext = {
      ...mockAuthContextValue,
      user: null,
      isAuthenticated: false
    };

    // Act
    render(
      <BrowserRouter>
        <AuthContext.Provider value={unauthenticatedContext}>
          <Header />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByText('Task Manager')).toBeInTheDocument();
    expect(screen.queryByText(mockUser.email)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
  });

  it('should display navigation links when authenticated', () => {
    // Act
    render(
      <HeaderWithRouter>
        <Header />
      </HeaderWithRouter>
    );

    // Assert
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /tasks/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /completed/i })).toBeInTheDocument();
  });

  it('should highlight active navigation link', () => {
    // Act
    render(
      <HeaderWithRouter>
        <Header />
      </HeaderWithRouter>
    );

    // Assert
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveClass('nav-link--active');
  });

  it('should handle logout button click', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    render(
      <HeaderWithRouter>
        <Header />
      </HeaderWithRouter>
    );

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);

    // Assert
    expect(mockAuthContextValue.logout).toHaveBeenCalledTimes(1);
  });

  it('should navigate to home when logo is clicked', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    render(
      <HeaderWithRouter>
        <Header />
      </HeaderWithRouter>
    );

    const logo = screen.getByRole('link', { name: /task manager/i });
    await user.click(logo);

    // Assert
    expect(logo).toHaveAttribute('href', '/');
  });

  it('should display user menu when user avatar is clicked', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    render(
      <HeaderWithRouter>
        <Header />
      </HeaderWithRouter>
    );

    const userAvatar = screen.getByTestId('user-avatar');
    await user.click(userAvatar);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });
  });

  it('should close user menu when clicking outside', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    render(
      <HeaderWithRouter>
        <Header />
      </HeaderWithRouter>
    );

    // Open menu
    const userAvatar = screen.getByTestId('user-avatar');
    await user.click(userAvatar);

    await waitFor(() => {
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    // Click outside
    await user.click(document.body);

    // Assert
    await waitFor(() => {
      expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
    });
  });

  it('should display loading state appropriately', () => {
    // Arrange
    const loadingContext = {
      ...mockAuthContextValue,
      isLoading: true
    };

    // Act
    render(
      <BrowserRouter>
        <AuthContext.Provider value={loadingContext}>
          <Header />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByTestId('header-loading')).toBeInTheDocument();
  });

  it('should handle keyboard navigation for user menu', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    render(
      <HeaderWithRouter>
        <Header />
      </HeaderWithRouter>
    );

    const userAvatar = screen.getByTestId('user-avatar');
    
    // Focus and press Enter
    userAvatar.focus();
    await user.keyboard('{Enter}');

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    // Press Escape to close
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
    });
  });

  it('should display notification badge when there are notifications', () => {
    // Arrange
    const contextWithNotifications = {
      ...mockAuthContextValue,
      notifications: [
        { id: '1', message: 'Test notification', type: 'info', timestamp: new Date() }
      ]
    };

    // Act
    render(
      <BrowserRouter>
        <AuthContext.Provider value={contextWithNotifications}>
          <Header />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Assert
    expect(screen.getByTestId('notification-badge')).toBeInTheDocument();
  });

  it('should handle mobile menu toggle', async () => {
    // Arrange
    const user = userEvent.setup();

    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });
    window.dispatchEvent(new Event('resize'));

    // Act
    render(
      <HeaderWithRouter>
        <Header />
      </HeaderWithRouter>
    );

    const mobileMenuButton = screen.getByTestId('mobile-menu-button');
    await user.click(mobileMenuButton);

    // Assert
    expect(screen.getByTestId('mobile-menu')).toHaveClass('mobile-menu--open');
  });

  it('should display search functionality', () => {
    // Act
    render(
      <HeaderWithRouter>
        <Header />
      </HeaderWithRouter>
    );

    // Assert
    expect(screen.getByPlaceholderText(/search tasks/i)).toBeInTheDocument();
  });

  it('should handle search input changes', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockOnSearch = jest.fn();

    // Act
    render(
      <HeaderWithRouter>
        <Header onSearch={mockOnSearch} />
      </HeaderWithRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search tasks/i);
    await user.type(searchInput, 'test query');

    // Assert
    expect(searchInput).toHaveValue('test query');
  });

  it('should show theme toggle button', () => {
    // Act
    render(
      <HeaderWithRouter>
        <Header />
      </HeaderWithRouter>
    );

    // Assert
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('should handle theme toggle', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockToggleTheme = jest.fn();

    // Act
    render(
      <HeaderWithRouter>
        <Header onToggleTheme={mockToggleTheme} />
      </HeaderWithRouter>
    );

    const themeToggle = screen.getByTestId('theme-toggle');
    await user.click(themeToggle);

    // Assert
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('should be accessible with proper ARIA attributes', () => {
    // Act
    render(
      <HeaderWithRouter>
        <Header />
      </HeaderWithRouter>
    );

    // Assert
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    
    const userMenu = screen.getByTestId('user-avatar');
    expect(userMenu).toHaveAttribute('aria-haspopup', 'true');
  });

  it('should handle error states gracefully', () => {
    // Arrange
    const errorContext = {
      ...mockAuthContextValue,
      error: 'Authentication error'
    };

    // Act
    render(
      <BrowserRouter>
        <AuthContext.Provider value={errorContext}>
          <Header />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Assert
    // Should still render header even with errors
    expect(screen.getByText('Task Manager')).toBeInTheDocument();
  });
});