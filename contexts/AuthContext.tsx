import useAuthHook from "@/hooks/useAuth";
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
  getWorkerProfile: () => Promise<any>; // ✅ Thêm khai báo hàm ở đây
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
    getWorkerProfile, // ✅ Lấy hàm này từ useAuthHook
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
      if (me) {
        const mappedUser = mapUser(me);

        // Kiểm tra role có hợp lệ không
        if (mappedUser.role !== "Worker" && mappedUser.role !== "Supervisor") {
          // Role không hợp lệ - logout ngay
          await logout();
          throw new Error(
            `Quyền của bạn hiện tại (${mappedUser.role}) không thể đăng nhập vào hệ thống được.`,
          );
        }

        setAppUser(mappedUser);
      }
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

      // 1. Gọi API logout (nếu backend có)
      try {
        await logoutApi();
      } catch (apiError) {
        // ❗ Không block logout nếu API fail
        console.warn("Logout API failed:", apiError);
      }

      // 2. Xoá token/local storage
      await AsyncStorage.multiRemove([
        "access_token",
        "refresh_token",
        "userInfo",
      ]);

      // 3. Clear state user
      setAppUser(null);

      // 4. (Optional) clear axios header
      delete axios.defaults.headers.common["Authorization"];
    } catch (error) {
      console.error("Logout error:", error);
      throw error; // giữ lại nếu bạn muốn handle ở ngoài
    } finally {
      setIsLoading(false);
    }
  };

  // FORGOT PASSWORD
  const forgotPassword = async (email: string) => {
    try {
      await forgotPasswordApi(email);
    } catch (e) {
      throw e;
    }
  };

  // VERIFY OTP
  const verifyOtp = async (email: string, otpCode: string): Promise<string> => {
    try {
      const token = await verifyOtpApi(email, otpCode);
      return token;
    } catch (e) {
      throw e;
    }
  };

  // RESET PASSWORD
  const resetPassword = async (
    email: string,
    token: string,
    newPassword: string,
  ) => {
    try {
      await resetPasswordApi(email, token, newPassword);
    } catch (e) {
      throw e;
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
        forgotPassword,
        verifyOtp,
        resetPassword,
        getWorkerProfile, // ✅ Export ra cho toàn app dùng được
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
