import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { InventoryManager } from './InventoryManager';
import { LoginForm } from './LoginForm';
import { UserProfile } from './UserProfile';
import { AdminPage } from './AdminPage';

export type ViewMode = 'inventory' | 'profile' | 'admin';

export const AppRouter: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>('inventory');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  switch (currentView) {
    case 'profile':
      return <UserProfile onBack={() => setCurrentView('inventory')} />;
    case 'admin':
      return <AdminPage onBack={() => setCurrentView('inventory')} />;
    case 'inventory':
    default:
      return <InventoryManager onNavigate={setCurrentView} />;
  }
};