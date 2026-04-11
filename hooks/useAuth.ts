import axiosInstance from "@/config/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  //LOGIN
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const res = await axiosInstance.post("/Auths/login", {
        email,
        password,
      });
      console.log("Login response:", JSON.stringify(res.data));

      const { accessToken, refreshToken } = res.data;

      // lưu token
      await AsyncStorage.setItem("access_token", accessToken);
      await AsyncStorage.setItem("refresh_token", refreshToken);

      // lấy user
      await getMe();

      return res;
    } catch (err) {
      setError(err?.response?.data?.message || "Đăng nhập thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  //REGISTER
  const register = async (data) => {
    setLoading(true);
    setError(null);

    try {
      return await axiosInstance.post("/Auths/register", data);
    } catch (err) {
      setError(err?.response?.data?.message || "Đăng ký thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  //GET ME
  const getMe = async () => {
    try {
      const res = await axiosInstance.get("/Auths/me");
      setUser(res.data);
      return res.data;
    } catch (err) {
      await logout();
      return null;
    }
  };

  //LOGOUT
  const logout = async () => {
    await AsyncStorage.removeItem("access_token");
    await AsyncStorage.removeItem("refresh_token");
    setUser(null);
  };

  //REFRESH TOKEN
  const refreshToken = async () => {
    try {
      const storedRefreshToken = await AsyncStorage.getItem("refresh_token");

      const res = await axiosInstance.post("/Auths/refresh", {
        refreshToken: storedRefreshToken,
      });

      await AsyncStorage.setItem("access_token", res.data.accessToken);
      return res;
    } catch (err) {
      await logout();
      throw err;
    }
  };

  //FORGOT PASSWORD
  const forgotPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.post("/Auths/forgot-password", { email });
      return res.data;
    } catch (err) {
      setError(err?.response?.data?.message || "Gửi email thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  //RESET PASSWORD
  const resetPassword = async (
    email: string,
    token: string,
    newPassword: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.post("/Auths/reset-password", {
        email,
        token,
        newPassword,
      });
      return res.data;
    } catch (err) {
      setError(err?.response?.data?.message || "Đặt lại mật khẩu thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email: string, otpCode: string): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.post("/Auths/verify-otp", {
        email,
        otpCode,
      });
      return res.data.token;
    } catch (err) {
      setError(
        err?.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getWorkerProfile = async () => {
    try {
      const res = await axiosInstance.get("/Workers/me");
      if (res.data && res.data.length > 0) {
        return res.data[0];
      }
      return null;
    } catch (err) {
      console.error("Error fetching worker profile:", err);
      return null;
    }
  };

  const updateWorkerProfile = async (id, formData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.put(`/Workers/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    } catch (err) {
      console.error("Error updating worker profile:", err);
      setError(err?.response?.data?.message || "Cập nhật hồ sơ thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    forgotPassword,
    resetPassword,
    login,
    register,
    logout,
    getMe,
    refreshToken,
    verifyOtp,
    getWorkerProfile,
    updateWorkerProfile,
  };
};

export default useAuth;
