import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = (value: T | ((val: T) => T)) => void;

export default function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: {
    raw?: boolean;
    serializer?: (value: T) => string;
    deserializer?: (value: string) => T;
  } = {}
): [T, SetValue<T>] {
  const { raw = false, serializer = JSON.stringify, deserializer = JSON.parse } = options;

  // Get from local storage then parse stored json or return initialValue
  const readValue = useCallback((): T => {
    // Prevent build error "window is undefined" but keep working
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      return raw ? item : deserializer(item);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key, raw, deserializer]);

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue: SetValue<T> = useCallback(
    (value) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(readValue()) : value;
        
        // Save to state
        setStoredValue(valueToStore);
        
        // Save to local storage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            key,
            raw ? String(valueToStore) : serializer(valueToStore as T)
          );
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, raw, readValue, serializer]
  );

  // Sync changes across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== e.oldValue) {
        setStoredValue(readValue());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, readValue]);

  return [storedValue, setValue];
}

// Example usage:
// const [theme, setTheme] = useLocalStorage('theme', 'light');
// const [user, setUser] = useLocalStorage('user', { name: 'John', email: 'john@example.com' });
// const [count, setCount] = useLocalStorage('count', 0);
