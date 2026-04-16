import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://192.168.1.176:5000/api",
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: attempt refresh on 401 and retry original request
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem("refresh_token");
        if (!refreshToken) return Promise.reject(error);

        // Use base axios to call refresh (avoid axiosInstance to skip interceptor loop)
        const res = await axios({
          method: "post",
          url: "/Auths/refresh",
          baseURL: axiosInstance.defaults.baseURL,
          data: { refreshToken },
        });

        const newAccessToken = res.data?.accessToken;
        if (newAccessToken) {
          await AsyncStorage.setItem("access_token", newAccessToken);
          axiosInstance.defaults.headers.common["Authorization"] =
            `Bearer ${newAccessToken}`;
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        }

        return Promise.reject(error);
      } catch (e) {
        // clear tokens on refresh failure
        await AsyncStorage.removeItem("access_token");
        await AsyncStorage.removeItem("refresh_token");
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
