"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserAccount, UserRole } from "@/types/models";
import { DEFAULT_USERS, hashPassword, verifyPassword } from "@/lib/auth";

const STORAGE_KEY_USERS = "family_hub_users_v1";
const STORAGE_KEY_SESSION = "family_hub_session_v1";

interface AuthContextValue {
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  users: UserAccount[];
  hydrated: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  createUser: (data: {
    username: string;
    password: string;
    displayName: string;
    role: UserRole;
  }) => { success: boolean; error?: string };
  updateUser: (
    id: string,
    updates: { displayName?: string; role?: UserRole; password?: string }
  ) => { success: boolean; error?: string };
  deleteUser: (id: string) => { success: boolean; error?: string };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserAccount[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from LocalStorage on mount
  useEffect(() => {
    try {
      const rawUsers = localStorage.getItem(STORAGE_KEY_USERS);
      let loadedUsers: UserAccount[] = DEFAULT_USERS;

      if (rawUsers) {
        try {
          const parsed: UserAccount[] = JSON.parse(rawUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Ensure admin superuser is always present
            const hasAdmin = parsed.some((u) => u.username === "admin");
            if (!hasAdmin) {
              parsed.unshift(DEFAULT_USERS[0]);
            }
            loadedUsers = parsed;
          }
        } catch {
          loadedUsers = DEFAULT_USERS;
        }
      } else {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(DEFAULT_USERS));
      }

      setUsers(loadedUsers);

      const savedSessionId = localStorage.getItem(STORAGE_KEY_SESSION);
      if (savedSessionId) {
        const found = loadedUsers.find((u) => u.id === savedSessionId);
        if (found) {
          setCurrentUser(found);
        }
      }
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist users to LocalStorage whenever users list changes
  const persistUsers = (newUsers: UserAccount[]) => {
    setUsers(newUsers);
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(newUsers));
    } catch {
      // ignore
    }
  };

  const login = (
    usernameRaw: string,
    passwordRaw: string
  ): { success: boolean; error?: string } => {
    const username = usernameRaw.trim().toLowerCase();
    const password = passwordRaw.trim();

    if (!username || !password) {
      return { success: false, error: "Bitte Benutzername und Passwort eingeben." };
    }

    const user = users.find((u) => u.username.toLowerCase() === username);
    if (!user) {
      return { success: false, error: "Benutzername oder Passwort ist falsch." };
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return { success: false, error: "Benutzername oder Passwort ist falsch." };
    }

    const now = new Date().toISOString();
    const updatedUser = { ...user, lastLoginAt: now };

    const updatedUsers = users.map((u) => (u.id === user.id ? updatedUser : u));
    persistUsers(updatedUsers);

    setCurrentUser(updatedUser);
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, user.id);
    } catch {
      // ignore
    }

    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    } catch {
      // ignore
    }
  };

  const createUser = (data: {
    username: string;
    password: string;
    displayName: string;
    role: UserRole;
  }): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.role !== "admin") {
      return { success: false, error: "Nur Administratoren können Benutzer anlegen." };
    }

    const username = data.username.trim().toLowerCase();
    const password = data.password.trim();
    const displayName = data.displayName.trim();

    if (!username) {
      return { success: false, error: "Der Benutzername darf nicht leer sein." };
    }

    if (username.length < 3) {
      return { success: false, error: "Der Benutzername muss mindestens 3 Zeichen lang sein." };
    }

    if (users.some((u) => u.username.toLowerCase() === username)) {
      return { success: false, error: `Der Benutzername "${username}" existiert bereits.` };
    }

    if (!password || password.length < 3) {
      return { success: false, error: "Das Passwort muss mindestens 3 Zeichen lang sein." };
    }

    const newUser: UserAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username,
      displayName: displayName || username,
      passwordHash: hashPassword(password),
      role: data.role || "member",
      createdAt: new Date().toISOString(),
    };

    const newUsers = [...users, newUser];
    persistUsers(newUsers);

    return { success: true };
  };

  const updateUser = (
    id: string,
    updates: { displayName?: string; role?: UserRole; password?: string }
  ): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.role !== "admin") {
      return { success: false, error: "Nur Administratoren dürfen Benutzer bearbeiten." };
    }

    const targetUser = users.find((u) => u.id === id);
    if (!targetUser) {
      return { success: false, error: "Benutzer wurde nicht gefunden." };
    }

    // Protect against demoting the last admin
    if (
      targetUser.role === "admin" &&
      updates.role === "member" &&
      users.filter((u) => u.role === "admin").length <= 1
    ) {
      return {
        success: false,
        error: "Es muss mindestens ein Administrator im System verbleiben.",
      };
    }

    let updatedHash = targetUser.passwordHash;
    if (updates.password && updates.password.trim()) {
      if (updates.password.trim().length < 3) {
        return { success: false, error: "Das neue Passwort muss mindestens 3 Zeichen lang sein." };
      }
      updatedHash = hashPassword(updates.password.trim());
    }

    const updatedUser: UserAccount = {
      ...targetUser,
      displayName: updates.displayName?.trim() || targetUser.displayName,
      role: updates.role || targetUser.role,
      passwordHash: updatedHash,
    };

    const newUsers = users.map((u) => (u.id === id ? updatedUser : u));
    persistUsers(newUsers);

    // If updating currently logged in user
    if (currentUser.id === id) {
      setCurrentUser(updatedUser);
    }

    return { success: true };
  };

  const deleteUser = (id: string): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.role !== "admin") {
      return { success: false, error: "Nur Administratoren dürfen Benutzer löschen." };
    }

    if (currentUser.id === id) {
      return { success: false, error: "Du kannst deinen eigenen aktuell eingeloggten Benutzer nicht löschen." };
    }

    const targetUser = users.find((u) => u.id === id);
    if (!targetUser) {
      return { success: false, error: "Benutzer nicht gefunden." };
    }

    if (targetUser.username === "admin") {
      return { success: false, error: "Der Standard-Administrator (admin) kann nicht gelöscht werden." };
    }

    if (targetUser.role === "admin" && users.filter((u) => u.role === "admin").length <= 1) {
      return { success: false, error: "Der letzte verbleibende Administrator kann nicht gelöscht werden." };
    }

    const newUsers = users.filter((u) => u.id !== id);
    persistUsers(newUsers);

    return { success: true };
  };

  const isAuthenticated = Boolean(currentUser);
  const isAdmin = currentUser?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isAdmin,
        users,
        hydrated,
        login,
        logout,
        createUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
