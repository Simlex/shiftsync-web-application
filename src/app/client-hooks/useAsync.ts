import { useEffect, useState } from "react";

interface UseAsyncState<T, E> {
  status: "idle" | "pending" | "success" | "error";
  data: T | null;
  error: E | null;
}

export const useAsync = <T, E = Error>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true
): UseAsyncState<T, E> & { execute: () => Promise<void> } => {
  const [state, setState] = useState<UseAsyncState<T, E>>({
    status: "idle",
    data: null,
    error: null,
  });

  const execute = async () => {
    setState({ status: "pending", data: null, error: null });
    try {
      const response = await asyncFunction();
      setState({ status: "success", data: response, error: null });
    } catch (error) {
      setState({
        status: "error",
        data: null,
        error: error as E,
      });
    }
  };

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, []);

  return { ...state, execute };
};
