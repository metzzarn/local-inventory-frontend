import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { InventoryManager } from './components/InventoryManager';
import { AppRouter } from './components/AppRouter';

// Main App Component
const App: React.FC = () => {
    return (
      <AuthProvider>
        <div className="App">
          <AppRouter />
        </div>
      </AuthProvider>
    );
  };
  
  export default App;