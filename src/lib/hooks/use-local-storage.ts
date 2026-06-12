import { useCallback, useEffect, useState } from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Sync on mount (SSR-safe)
  useEffect(() => {
    setStoredValue(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const newValue = value instanceof Function ? value(storedValue) : value;
        window.localStorage.setItem(key, JSON.stringify(newValue));
        setStoredValue(newValue);
        window.dispatchEvent(new Event("local-storage"));
      } catch {
        console.warn(`useLocalStorage: could not set key "${key}"`);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      window.dispatchEvent(new Event("local-storage"));
    } catch {
      console.warn(`useLocalStorage: could not remove key "${key}"`);
    }
  }, [key, initialValue]);

  // Listen for changes across tabs
  useEffect(() => {
    const handler = () => setStoredValue(readValue());
    window.addEventListener("local-storage", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("local-storage", handler);
      window.removeEventListener("storage", handler);
    };
  }, [readValue]);

  return [storedValue, setValue, removeValue];
}
