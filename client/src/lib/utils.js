import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const API_URL = import.meta.env.VITE_API_URL || '/api'

// Cache utilities for localStorage with TTL
const CACHE_PREFIX = 'dsa_cache_';

export const setCache = (key, data, ttlMinutes = 5) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData));
  } catch (e) {
    console.warn('Cache set failed:', e);
  }
};

export const getCache = (key) => {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;

    const { data, timestamp, ttl } = JSON.parse(cached);
    if (Date.now() - timestamp > ttl) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch (e) {
    console.warn('Cache get failed:', e);
    return null;
  }
};

export const clearCache = (key) => {
  if (key) {
    localStorage.removeItem(CACHE_PREFIX + key);
  } else {
    // Clear all cache
    Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  }
};

export const isCacheValid = (key) => {
  return getCache(key) !== null;
};

// Debounce utility
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};
