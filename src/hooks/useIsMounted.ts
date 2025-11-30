import { useEffect, useRef } from "react";

/**
 * Hook to track if component is mounted
 * Use this to prevent setState calls on unmounted components
 */
export const useIsMounted = () => {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef;
};
