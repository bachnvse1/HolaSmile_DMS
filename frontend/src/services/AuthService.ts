import axiosInstance from "../lib/axios";
import axios from "axios";
import type { EnhancedUserInfo } from "../types/user.types";
import { TokenUtils } from "../utils/tokenUtils";

export interface OTPRequestPayload {
  phoneNumber: string;
}

export interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface LoginResponse {
  success: boolean;
  token: string;
  refreshToken?: string;
  role: string;
  patientId?: string;
}

export interface RoleRedirectMap {
  [key: string]: string;
}

export class AuthService {
  // Define redirect paths for each role
  private static readonly ROLE_REDIRECTS: RoleRedirectMap = {
    Patient: "/patient/dashboard",
    Administrator: "/dashboard",
    Owner: "/dashboard",
    Receptionist: "/dashboard",
    Assistant: "/dashboard",
    Dentist: "/dashboard",
  };
  static async login(
    username: string,
    password: string
  ): Promise<LoginResponse> {
    try {
      const response = await axiosInstance.post("/user/login", {
        username,
        password,
      });

      const { success, token, refreshToken, role } = response.data;

      if (!success || !token || !role) {
        throw new Error("Thông tin đăng nhập không hợp lệ");
      }

      // Save token for normal login
      TokenUtils.saveLoginToken(token, refreshToken);

      let patientId: string | undefined;
      if (role === "Patient") {
        patientId = TokenUtils.getRoleTableIdFromToken(token) || undefined;
      }

      return { success, token, refreshToken, role, patientId };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Lỗi đăng nhập");
      }
      throw new Error("Lỗi không xác định");
    }
  }
  static async fetchUserProfile(): Promise<EnhancedUserInfo> {
    try {
      const response = await axiosInstance.get(`/user/profile`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Không thể lấy thông tin người dùng";
        throw new Error(errorMessage);
      }
      throw new Error("Lỗi không xác định khi lấy thông tin người dùng");
    }
  }

  static getRedirectPath(role: string): string {
    return this.ROLE_REDIRECTS[role] || "/";
  }
  static async loginWithGoogle(): Promise<void> {
    const baseURL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5135/api";
    window.location.href = `${baseURL}/Auth/login-google`;
  }

  static logout(): void {
    TokenUtils.clearTokenData();
  }
  static saveAuthData(token: string, refreshToken?: string): void {
    localStorage.setItem("authToken", token);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
  }

  static getAuthData(): {
    token: string | null;
    role: string | null;
    refreshToken: string | null;
  } {
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const role = token ? TokenUtils.getRoleFromToken(token) : null;

    return {
      token,
      role,
      refreshToken,
    };
  }

  static async refreshToken(): Promise<{ success: boolean; token?: string }> {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }
      const response = await axiosInstance.post("/auth/refresh", {
        refreshToken,
      });

      const { success, token } = response.data;
      if (success && token) {
        localStorage.setItem("token", token);
        return { success: true, token };
      }

      return { success: false };
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.logout();
      return { success: false };
    }
  }
  static async makeAuthenticatedRequest(
    url: string,
    options: Record<string, unknown> = {}
  ) {
    // Interceptor will automatically add token and handle refresh
    return axiosInstance({
      ...options,
      url: url,
    });
  }

  /**
   * Handle Google OAuth callback
   */
  static async handleGoogleCallback(
    token: string,
    refreshToken?: string
  ): Promise<boolean> {
    try {
      return TokenUtils.saveGoogleAuthToken(token, refreshToken);
    } catch (error) {
      console.error("Error handling Google callback:", error);
      return false;
    }
  }

  static async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<void> {
    try {
      await axiosInstance.put("/user/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Lỗi đổi mật khẩu");
      }
      throw new Error("Lỗi không xác định khi đổi mật khẩu");
    }
  }

}

// Setup axios interceptor to automatically add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");

    if (config.headers && typeof config.headers.set === "function") {
      config.headers.set("ngrok-skip-browser-warning", "true");

      if (token && !config.headers.has("Authorization")) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for automatic token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResult = await AuthService.refreshToken();
        if (refreshResult.success && refreshResult.token) {
          originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        AuthService.logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const requestOtpSms = async (payload: OTPRequestPayload): Promise<string> => {
  try {
    const response = await axiosInstance.post<string>("/user/OTP-Request-sms", payload, {
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data || "OTP request failed");
    }
    throw new Error("Network error");
  }
};



