import { useMemo } from 'react';
import { closuresForDate, type CalendarClosure } from '@/api/staff';
import { useClosures } from '@/queries/useStaff';

/** First matching closure for a calendar day, if any. */
export function useDayClosure(
  iso: string | undefined,
  calendarId?: string,
): CalendarClosure | null {
  const { data: closures = [] } = useClosures();
  return useMemo(() => {
    if (!iso) return null;
    return closuresForDate(closures, iso, calendarId)[0] ?? null;
  }, [calendarId, closures, iso]);
}
