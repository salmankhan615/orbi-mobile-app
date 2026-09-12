import { useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';

/**
 * Become true after navigation animations finish so heavy CRM fetches
 * don't contend with the JS thread during the transition (frozen taps).
 */
export function useAfterInteractions(enabled = true): boolean {
  const [ready, setReady] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setReady(true);
      return;
    }
    setReady(false);
    const task = InteractionManager.runAfterInteractions(() => {
      setReady(true);
    });
    return () => task.cancel();
  }, [enabled]);

  return ready;
}
