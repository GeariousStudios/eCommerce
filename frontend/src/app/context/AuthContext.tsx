"use client";

import { createContext, useContext, ReactNode } from "react";
import useAuthStatus from "../hooks/useAuthStatus";

type AuthContextType = ReturnType<typeof useAuthStatus>;

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuthStatus();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return context;
};
