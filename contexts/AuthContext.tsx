import React, { createContext, useContext, useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type UserRole = "worker" | "supervisor";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  avatarColor: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Mock user (xóa khi gắn Auth0 thật) ──────────────────────────────────────
const MOCK_USER: AuthUser = {
  id: "CS-8892",
  name: "Jordan Smith",
  email: "jordan@cleanops.com",
  role: "worker", // đổi "supervisor" để test
  avatar: "JS",
  avatarColor: "#7DD3B0",
};

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Kiểm tra session khi app khởi động
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // TODO: thay bằng Auth0 thật
      // const credentials = await auth0.credentialsManager.getCredentials();
      // const userInfo = await auth0.auth.userInfo({ token: credentials.accessToken });
      // setUser(mapAuth0UserToAppUser(userInfo));

      // Mock: chưa có session → về login
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    try {
      setIsLoading(true);

      // TODO: thay bằng Auth0 thật
      // const credentials = await auth0.webAuth.authorize({
      //   scope: "openid profile email",
      //   audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE,
      // });
      // const userInfo = await auth0.auth.userInfo({ token: credentials.accessToken });
      // setUser(mapAuth0UserToAppUser(userInfo));

      setUser(MOCK_USER); // mock
    } catch (e) {
      console.error("Login failed:", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      // TODO: thay bằng Auth0 thật
      // await auth0.webAuth.clearSession();
      // await auth0.credentialsManager.clearCredentials();

      setUser(null); // xóa session → isAuthenticated = false → tự redirect về login
    } catch (e) {
      console.error("Logout failed:", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

// ─── Helper map Auth0 user → AppUser (bỏ comment khi gắn Auth0 thật) ─────────
// function mapAuth0UserToAppUser(userInfo: any): AuthUser {
//   return {
//     id: userInfo.sub,
//     name: userInfo.name,
//     email: userInfo.email,
//     role: userInfo["https://cleanops.com/role"] ?? "worker",
//     avatar: userInfo.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2),
//     avatarColor: "#7DD3B0",
//   };
// }
