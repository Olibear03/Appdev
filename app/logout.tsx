import React, { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { router } from 'expo-router';

export default function LogoutScreen() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
    router.replace('/');
  }, [logout]);

  return null;
}