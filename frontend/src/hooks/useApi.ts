'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseQueryOptions<T, TDeps extends readonly unknown[]> {
  enabled?: boolean;
  deps?: TDeps;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useQuery<T, TDeps extends readonly unknown[] = []>(
  queryFn: () => Promise<T>,
  options: UseQueryOptions<T, TDeps> = {}
): UseQueryResult<T> {
  const { enabled = true, deps = [] as unknown as TDeps, onSuccess, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);
  const depsRef = useRef(deps);
  depsRef.current = deps;

  const execute = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const result = await queryFnRef.current();
      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      setData(result);
      onSuccessRef.current?.(result);
    } catch (err) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      const error = err instanceof Error ? err : new Error('Unknown error');
      setIsError(true);
      setError(error);
      onErrorRef.current?.(error);
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Track previous deps to detect changes
  const prevDepsRef = useRef<readonly unknown[]>(deps);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) {
      execute();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [enabled, execute]);

  // Separate effect for deps changes to trigger re-fetch
  useEffect(() => {
    const prevDeps = prevDepsRef.current;
    const currentDeps = depsRef.current;

    // Check if deps actually changed (deep comparison for arrays)
    const depsChanged = prevDeps.length !== currentDeps.length ||
      currentDeps.some((dep, index) => dep !== prevDeps[index]);

    if (depsChanged && enabledRef.current) {
      prevDepsRef.current = currentDeps;
      execute();
    }
  }, deps);

  return { data, isLoading, isError, error, refetch: execute };
}

interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | null, error: Error | null, variables: TVariables) => void;
}

interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData | null>;
  mutateAsync: (variables: TVariables) => Promise<TData | null>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  data: TData | null;
  reset: () => void;
}

export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, TVariables> {
  const { onSuccess, onError, onSettled } = options;
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;
  const mountedRef = useRef(true);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | null> => {
      setIsPending(true);
      setIsError(false);
      setError(null);
      try {
        const result = await mutationFn(variables);
        if (!mountedRef.current) return null;
        setData(result);
        onSuccessRef.current?.(result, variables);
        onSettledRef.current?.(result, null, variables);
        return result;
      } catch (err) {
        if (!mountedRef.current) return null;
        const error = err instanceof Error ? err : new Error('Unknown error');
        setIsError(true);
        setError(error);
        onErrorRef.current?.(error, variables);
        onSettledRef.current?.(null, error, variables);
        return null;
      } finally {
        if (mountedRef.current) {
          setIsPending(false);
        }
      }
    },
    [mutationFn]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsError(false);
    setIsPending(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { mutate, mutateAsync: mutate, isPending, isError, error, data, reset };
}