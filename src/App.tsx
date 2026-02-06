import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { Dashboard } from './components/Layout/Dashboard';
import './styles/auth.css';

function App() {

  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}

export default App;
