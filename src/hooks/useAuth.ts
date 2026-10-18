import { useAuthStore } from '../stores';

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthModalOpen = useAuthStore((state) => state.isAuthModalOpen);
  const authModalTab = useAuthStore((state) => state.authModalTab);

  const openAuthModal = useAuthStore((state) => state.openAuthModal);
  const closeAuthModal = useAuthStore((state) => state.closeAuthModal);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);

  return {
    user,
    isAuthenticated: !!user,
    isAuthModalOpen,
    authModalTab,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    logout,
    updateUser,
  };
};
