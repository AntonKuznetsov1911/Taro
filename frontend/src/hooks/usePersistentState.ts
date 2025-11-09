import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';

/**
 * Hook for persistent state that survives app restarts
 * Similar to useState but saves to AsyncStorage
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [state, setState] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial value from storage
  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        const stored = await storage.getItem<T>(key);
        if (stored !== null) {
          setState(stored);
        }
      } catch (error) {
        console.error(`Error loading ${key} from storage:`, error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    loadFromStorage();
  }, [key]);

  // Save to storage whenever state changes (after initial load)
  useEffect(() => {
    if (!isInitialized) return;

    const saveToStorage = async () => {
      try {
        await storage.setItem(key, state);
      } catch (error) {
        console.error(`Error saving ${key} to storage:`, error);
      }
    };

    saveToStorage();
  }, [key, state, isInitialized]);

  // Custom setState that works like regular useState
  const setPersistentState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prevState) => {
        const newState = value instanceof Function ? value(prevState) : value;
        return newState;
      });
    },
    []
  );

  return [state, setPersistentState, isLoading];
}

/**
 * Hook for persistent Set state
 */
export function usePersistentSet(
  key: string,
  initialValue: Set<string> = new Set()
): [Set<string>, (value: Set<string>) => void, boolean] {
  const [state, setState, isLoading] = usePersistentState<string[]>(
    key,
    Array.from(initialValue)
  );

  const setAsSet = new Set(state);

  const setSet = useCallback(
    (value: Set<string>) => {
      setState(Array.from(value));
    },
    [setState]
  );

  return [setAsSet, setSet, isLoading];
}

/**
 * Hook for persistent Map state
 */
export function usePersistentMap<V>(
  key: string,
  initialValue: Map<string, V> = new Map()
): [Map<string, V>, (value: Map<string, V>) => void, boolean] {
  const [state, setState, isLoading] = usePersistentState<[string, V][]>(
    key,
    Array.from(initialValue.entries())
  );

  const mapState = new Map(state);

  const setMap = useCallback(
    (value: Map<string, V>) => {
      setState(Array.from(value.entries()));
    },
    [setState]
  );

  return [mapState, setMap, isLoading];
}
