import useAuthHook from "@/hooks/useAuth";
import React, { createContext, useContext, useEffect, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────
type UserRole = "Worker" | "Supervisor";

interface AuthUser {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userRole: UserRole | null;
  isWorker: boolean;
  isSupervisor: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Context ───────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    user,
    login: loginApi,
    logout: logoutApi,
    getMe,
    loading,
  } = useAuthHook();

  const [appUser, setAppUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  //map BE → FE model
  const mapUser = (data: any): AuthUser => ({
    userId: data.userId,
    email: data.email,
    fullName: data.fullName,
    role: data.role,
  });

  //check session khi mở app
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const me = await getMe();
      if (me) {
        setAppUser(mapUser(me));
      } else {
        setAppUser(null);
      }
    } catch {
      setAppUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  //LOGIN
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      await loginApi(email, password);

      const me = await getMe();
      if (me) setAppUser(mapUser(me));
    } catch (e) {
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  //LOGOUT
  const logout = async () => {
    try {
      setIsLoading(true);
      await logoutApi();
      setAppUser(null);
    } catch (e) {
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: appUser,
        isLoading: isLoading || loading,
        isAuthenticated: !!appUser,
        userRole: appUser?.role ?? null,
        isWorker: appUser?.role === "Worker",
        isSupervisor: appUser?.role === "Supervisor",
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook dùng global ──────────────────────────────────────────
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

// ─── Role hooks ────────────────────────────────────────────────
export function useIsWorker(): boolean {
  return useAuth().isWorker;
}

export function useIsSupervisor(): boolean {
  return useAuth().isSupervisor;
}

export function useUserRole(): UserRole | null {
  return useAuth().userRole;
}
