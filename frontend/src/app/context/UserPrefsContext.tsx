"use client";

import { createContext, useContext, ReactNode } from "react";
import useUserPrefs from "../hooks/useUserPrefs";

type UserPrefsContextType = ReturnType<typeof useUserPrefs>;

const UserPrefsContext = createContext<UserPrefsContextType | null>(null);

export const UserPrefsProvider = ({ children }: { children: ReactNode }) => {
  const prefs = useUserPrefs();
  return (
    <UserPrefsContext.Provider value={prefs}>
      {children}
    </UserPrefsContext.Provider>
  );
};

export const useUserPrefsContext = (): UserPrefsContextType => {
  const context = useContext(UserPrefsContext);
  if (!context) {
    throw new Error(
      "useUserPrefsContext must be used within <UserPrefsProvider>",
    );
  }
  return context;
};
