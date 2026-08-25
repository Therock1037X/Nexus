/**
 * Auth & Role Context
 * Manages active user session, role scoping, and 1-click persona switching.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getPersistedUser,
  persistUser,
  DEMO_PERSONAS,
  loginWithEmail,
  signupWithEmail,
  logoutUser
} from '../firebase/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => getPersistedUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    persistUser(currentUser);
  }, [currentUser]);

  const switchPersona = (personaId) => {
    const found = DEMO_PERSONAS.find(p => p.id === personaId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await loginWithEmail(email, password);
      if (res.user) setCurrentUser(res.user);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, role, name) => {
    setLoading(true);
    try {
      const res = await signupWithEmail(email, password, role, name);
      if (res.user) setCurrentUser(res.user);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  const setRole = (role) => {
    if (currentUser) {
      setCurrentUser(prev => ({ ...prev, role }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || 'doctor',
        isAuthenticated: !!currentUser,
        loading,
        personas: DEMO_PERSONAS,
        switchPersona,
        login,
        signup,
        logout,
        setRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
