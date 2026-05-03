import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, useLogin, useLogout } from "@workspace/api-client-react";
import type { AuthUser, LoginBody } from "@workspace/api-client-react/src/generated/api.schemas";
import { useLocation } from "wouter";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (data: LoginBody) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading: isMeLoading, refetch } = useGetMe({
    query: { retry: false }
  });
  
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const [, setLocation] = useLocation();

  const handleLogin = async (data: LoginBody) => {
    await loginMutation.mutateAsync({ data });
    await refetch();
    setLocation("/dashboard");
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    await refetch();
    setLocation("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading: isMeLoading,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
