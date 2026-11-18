import { useCallback, useState } from "react";

/** Small reusable state holder for one user-initiated async action. */
export function useAsyncAction<TArgs extends unknown[], TResult>(action: (...args: TArgs) => Promise<TResult>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const run = useCallback(async (...args: TArgs) => {
    setPending(true);
    setError(null);
    try { return await action(...args); }
    catch (reason) { setError(reason); throw reason; }
    finally { setPending(false); }
  }, [action]);
  return { run, pending, error, clearError: () => setError(null) };
}
