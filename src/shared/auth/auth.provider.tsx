// auth.provider.tsx
import { message } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext, type AuthState, type JwtPayload } from "./auth.context";

import {
  useAuthControllerLogOut,
  useAuthControllerSignIn,
  type SignInDto,
  type SignInDtoResponse,
} from "@/api";
import { AppPaths } from "@/pages/appPaths";
import { LocalStorageUtil } from "../utils/local-storage";

const TokenUtils = {
  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error("Failed to decode token:", error);
      return true;
    }
  },

  getTokenPayload: (token: string): JwtPayload | null => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (error) {
      console.error("Failed to decode token payload:", error);
      return null;
    }
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();

  const [authState, setAuthState] = useState<AuthState>({
    accessToken: LocalStorageUtil.get("accessToken"),
    refreshToken: LocalStorageUtil.get("refreshToken"),
    isAuthenticated: false,
    isLoading: true,
  });

  /* -------------------- API mutations -------------------- */

  const loginMutation = useAuthControllerSignIn({
    mutation: {
      onSuccess: (data) => {
        loginSuccess(data.data);
        message.success("Đăng nhập thành công!");
      },
      onError: () => {
        message.error("Đăng nhập thất bại.");
      },
    },
  });

  const logoutMutation = useAuthControllerLogOut({
    mutation: {
      onSuccess: () => {
        LocalStorageUtil.clear();
        setAuthState({
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
        navigate(AppPaths.auth.login);
        message.success("Đăng xuất thành công!");
      },
      onError: (error) => {
        console.error("Logout failed:", error);
      },
    },
  });

  /* -------------------- Actions -------------------- */

  const login = useCallback(
    async (credentials: SignInDto) => {
      await loginMutation.mutateAsync({ data: credentials });
    },
    [loginMutation],
  );

  const loginSuccess = useCallback(
    async (response: SignInDtoResponse) => {
      const { accessToken, refreshToken } = response;

      LocalStorageUtil.set("accessToken", accessToken);
      LocalStorageUtil.set("refreshToken", refreshToken);

      setAuthState({
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });

      navigate(AppPaths.dashboard.dashboard);
    },
    [navigate],
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  /* -------------------- Init auth on mount -------------------- */

  useEffect(() => {
    const accessToken = LocalStorageUtil.get("accessToken");
    const refreshToken = LocalStorageUtil.get("refreshToken");

    if (
      accessToken &&
      refreshToken &&
      !TokenUtils.isTokenExpired(accessToken)
    ) {
      setAuthState({
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      LocalStorageUtil.clear();
      setAuthState({
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  /* -------------------- Token payload -------------------- */

  const payload = useMemo(() => {
    return authState.accessToken
      ? TokenUtils.getTokenPayload(authState.accessToken)
      : null;
  }, [authState.accessToken]);

  /* -------------------- Provider value -------------------- */

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        payload,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
