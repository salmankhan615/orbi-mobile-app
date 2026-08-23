import { create } from 'zustand';

export type ToastTone = 'success' | 'danger' | 'neutral';

interface ToastState {
  message: string | null;
  tone: ToastTone;
  show: (message: string, tone?: ToastTone) => void;
  hide: () => void;
}

// Global toast queue of one — good enough for the confirmations this app
// needs (added to calendar, joined session, sign-in errors, etc).
export const useToastStore = create<ToastState>((set) => ({
  message: null,
  tone: 'neutral',
  show: (message, tone = 'neutral') => set({ message, tone }),
  hide: () => set({ message: null }),
}));
