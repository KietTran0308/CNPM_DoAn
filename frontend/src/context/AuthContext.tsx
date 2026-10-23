'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import type { User } from '../types';
import { useAuthStore } from '../stores';

export type AuthTab = 'login' | 'register';
export type AuthResult = { success: boolean; error?: string };

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  isAuthModalOpen: boolean;
  authModalTab: AuthTab;
  openAuthModal: (tab?: AuthTab) => void;
  closeAuthModal: () => void;

  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<AuthResult>;
  logout: () => void;
  updateUser: (patch: Partial<User>) => Promise<void>;
  redeemPoints: (
    points: number
  ) => Promise<{ success: boolean; message: string; remainingPoints?: number }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthModalOpen = useAuthStore((s) => s.isAuthModalOpen);
  const authModalTab = useAuthStore((s) => s.authModalTab);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const closeAuthModal = useAuthStore((s) => s.closeAuthModal);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);
  const redeemPoints = useAuthStore((s) => s.redeemPoints);
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      isAuthModalOpen,
      authModalTab,
      openAuthModal,
      closeAuthModal,
      login,
      register,
      logout,
      updateUser,
      redeemPoints,
    }),
    [user, isLoading, isAuthModalOpen, authModalTab, openAuthModal, closeAuthModal, login, register, logout, updateUser, redeemPoints]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within an AuthProvider');
  return ctx;
};
