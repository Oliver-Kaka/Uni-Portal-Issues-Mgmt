/**
 * AdminAuthContext — login state and helpers for the admin area.
 * Demo Only: Use Fictional Data
 */
import { createContext, useContext, useState, useEffect } from 'react';
import api from './api.js';

const Ctx = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin]   = useState(null);   // null = unknown, false = not authed, object = authed
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api.get('/me')
      .then(r => setAdmin(r.data))
      .catch(() => setAdmin(false))
      .finally(() => setChecking(false));
  }, []);

  async function login(username, password) {
    await api.post('/login', { username, password });
    const r = await api.get('/me');
    setAdmin(r.data);
  }

  async function logout() {
    await api.post('/logout');
    setAdmin(false);
  }

  return (
    <Ctx.Provider value={{ admin, checking, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>');
  return ctx;
}
