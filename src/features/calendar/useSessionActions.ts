import { useState } from 'react';
import { Linking, Platform } from 'react-native';
import * as Calendar from 'expo-calendar';
import { useToastStore } from '@/store/useToastStore';
import { haptics } from '@/utils/haptics';
import { combineDateAndTime } from '@/utils/date';
import type { Session } from '@/api/sessions';

async function getWritableCalendarId(): Promise<string | null> {
  if (Platform.OS === 'ios') {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    return defaultCalendar.id;
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.find((cal) => cal.allowsModifications);
  return writable?.id ?? null;
}

// Drives the two "complete the flow" actions on a session: opening the
// meeting link (or a maps link for in-person sessions) and writing a real
// event to the device calendar. Both give haptic + toast feedback so the
// action reads as finished, not fire-and-forget.
export function useSessionActions(session: Session) {
  const [isJoining, setIsJoining] = useState(false);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  const [addedToCalendar, setAddedToCalendar] = useState(false);

  async function join() {
    setIsJoining(true);
    try {
      const url =
        session.mode === 'Online' && session.joinUrl
          ? session.joinUrl
          : session.location
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(session.location)}`
            : null;

      if (!url) {
        useToastStore.getState().show('No join link available for this session', 'danger');
        return;
      }

      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        useToastStore.getState().show('Unable to open this link', 'danger');
        return;
      }

      await Linking.openURL(url);
      haptics.success();
    } catch {
      useToastStore.getState().show('Something went wrong opening the session', 'danger');
    } finally {
      setIsJoining(false);
    }
  }

  async function addToCalendar() {
    setIsAddingToCalendar(true);
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        useToastStore.getState().show('Calendar access is needed to add this session', 'danger');
        return;
      }

      const calendarId = await getWritableCalendarId();
      if (!calendarId) {
        useToastStore.getState().show('No writable calendar found on this device', 'danger');
        return;
      }

      await Calendar.createEventAsync(calendarId, {
        title: session.title,
        startDate: combineDateAndTime(session.date, session.startTime),
        endDate: combineDateAndTime(session.date, session.endTime),
        notes: session.description,
        location: session.location ?? session.joinUrl,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      haptics.success();
      setAddedToCalendar(true);
      useToastStore.getState().show('Added to your calendar', 'success');
    } catch {
      useToastStore.getState().show('Could not add this session to your calendar', 'danger');
    } finally {
      setIsAddingToCalendar(false);
    }
  }

  return { join, isJoining, addToCalendar, isAddingToCalendar, addedToCalendar };
}
