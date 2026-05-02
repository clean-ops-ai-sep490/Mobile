// src/contexts/AuthContext.tsx

import useAuthHook from "@/hooks/useAuth";
import { setupFirebaseMessaging } from "@/services/firebase.service";
import { useNotificationStore } from "@/store/notification.store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────
type UserRole = "Worker" | "Supervisor";

interface AuthUser {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  // ✅ Thêm workerId — chỉ có khi role = Worker
  workerId?: string;
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
  forgotPassword: (email: string) => Promise<void>;
  verifyOtp: (email: string, otpCode: string) => Promise<string>;
  resetPassword: (
    email: string,
    token: string,
    newPassword: string,
  ) => Promise<void>;
  getWorkerProfile: () => Promise<any>;
  updateWorkerProfile: (id: string, formData: any) => Promise<any>;
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
    forgotPassword: forgotPasswordApi,
    resetPassword: resetPasswordApi,
    verifyOtp: verifyOtpApi,
    getWorkerProfile,
    updateWorkerProfile,
  } = useAuthHook();

  const [appUser, setAppUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapUser = (data: any): AuthUser => ({
    userId: data.userId,
    email: data.email,
    fullName: data.fullName,
    role: data.role,
  });

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const me = await getMe();
      if (me) {
        const mappedUser = mapUser(me);

        // ✅ Nếu là Worker thì lấy workerId luôn khi restore session
        if (mappedUser.role === "Worker") {
          try {
            const profile = await getWorkerProfile();
            if (profile?.id) {
              mappedUser.workerId = profile.id;
            }
          } catch (e) {
            console.warn(
              "Could not fetch worker profile on session restore:",
              e,
            );
          }
        }

        setAppUser(mappedUser);

        // ✅ Refresh unread count đúng cách sau khi restore session
        try {
          useNotificationStore.getState().fetchUnreadCount(mappedUser.workerId);
        } catch (e) {}
      } else {
        setAppUser(null);
      }
    } catch {
      setAppUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      await loginApi(email, password);

      const me = await getMe();
      if (me) {
        const mappedUser = mapUser(me);

        if (mappedUser.role !== "Worker" && mappedUser.role !== "Supervisor") {
          await logout();
          throw new Error(
            `Quyền của bạn hiện tại (${mappedUser.role}) không thể đăng nhập vào hệ thống được.`,
          );
        }

        // ✅ Lấy workerId trước khi setup Firebase và set user
        if (mappedUser.role === "Worker") {
          try {
            const profile = await getWorkerProfile();
            if (profile?.id) {
              mappedUser.workerId = profile.id;
            }
          } catch (e) {
            console.warn("Could not fetch worker profile on login:", e);
          }
        }

        setAppUser(mappedUser);

        // ✅ Setup Firebase với workerId đúng
        await setupFirebaseMessaging(mappedUser.workerId);
      }
    } catch (e) {
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      try {
        await logoutApi();
      } catch (apiError) {
        console.warn("Logout API failed:", apiError);
      }

      await AsyncStorage.multiRemove([
        "access_token",
        "refresh_token",
        "userInfo",
      ]);

      // ✅ Clear unread count khi logout
      useNotificationStore.getState().clearUnread();

      setAppUser(null);

      delete axios.defaults.headers.common["Authorization"];
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    await forgotPasswordApi(email);
  };

  const verifyOtp = async (email: string, otpCode: string): Promise<string> => {
    return await verifyOtpApi(email, otpCode);
  };

  const resetPassword = async (
    email: string,
    token: string,
    newPassword: string,
  ) => {
    await resetPasswordApi(email, token, newPassword);
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
        forgotPassword,
        verifyOtp,
        resetPassword,
        getWorkerProfile,
        updateWorkerProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được sử dụng bên trong AuthProvider");
  return ctx;
}

export function useIsWorker(): boolean {
  return useAuth().isWorker;
}

export function useIsSupervisor(): boolean {
  return useAuth().isSupervisor;
}

export function useUserRole(): UserRole | null {
  return useAuth().userRole;
}
