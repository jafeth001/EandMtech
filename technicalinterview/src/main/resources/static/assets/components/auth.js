import { useState, useContext, createContext, useEffect } from 'react';

// Auth Context
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// API configuration
const API = "http://localhost:8080/api";

export async function apiFetch(path, opts = {}, token) {
  const headers = { 
    "Content-Type": "application/json", 
    ...(token ? { Authorization: `Bearer ${token}` } : {}) 
  };
  
  const res = await fetch(`${API}${path}`, { 
    ...opts, 
    headers: { ...headers, ...opts.headers } 
  });
  
  if (!res.ok) {
    const txt = await res.text().catch(() => "Error");
    throw new Error(txt || res.statusText);
  }
  
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}