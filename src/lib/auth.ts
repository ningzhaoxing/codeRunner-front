"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getCurrentUser,
  getGitHubLoginUrl,
  logoutCurrentUser,
  type AuthUser,
} from "./api";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const user = await getCurrentUser();
      setState({ user, loading: false, error: null });
    } catch (error) {
      setState({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : "加载登录状态失败",
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const user = await getCurrentUser();
        if (!cancelled) {
          setState({ user, loading: false, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            user: null,
            loading: false,
            error: error instanceof Error ? error.message : "加载登录状态失败",
          });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const loginWithGitHub = useCallback((returnTo = "/") => {
    window.location.assign(getGitHubLoginUrl(returnTo));
  }, []);

  const logout = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      await logoutCurrentUser();
      setState({ user: null, loading: false, error: null });
    } catch (error) {
      setState({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : "退出登录失败",
      });
    }
  }, []);

  return {
    ...state,
    refresh,
    loginWithGitHub,
    logout,
  };
}
