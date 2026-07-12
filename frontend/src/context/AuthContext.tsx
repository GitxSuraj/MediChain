
 import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

import type { AuthUser } from "../types/auth";

interface AuthContextType {
  user: AuthUser;

  login: (user: AuthUser) => void;

  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser>({
    role: "",
    patient_id: "",
    hospital_id: "",
  });

  function login(userData: AuthUser) {
    setUser(userData);
  }

  function logout() {
    setUser({
      role: "",
      patient_id: "",
      hospital_id: "",
    });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}