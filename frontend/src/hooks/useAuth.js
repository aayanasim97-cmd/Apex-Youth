"use client";
import React, { createContext, useContext, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/store/authStore";

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  checkProfile: async () => {},
});

export function AuthProvider({ children }) {
  const { user, loading, setUser, setLoading } = useAuthStore();

  const checkProfile = async () => {
    try {
      const res = await apiFetch("/api/auth/profile");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credential) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        return { success: true };
      } else {
        const errData = await res.json();
        return { success: false, error: errData.error };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setUser(null);
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkProfile();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
