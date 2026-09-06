import { create } from 'zustand';

interface AnnouncementAckState {
  acknowledgedIds: string[];
  acknowledge: (id: string) => void;
}

export const useAnnouncementAckStore = create<AnnouncementAckState>((set) => ({
  acknowledgedIds: [],
  acknowledge: (id) =>
    set((state) =>
      state.acknowledgedIds.includes(id)
        ? state
        : { acknowledgedIds: [...state.acknowledgedIds, id] },
    ),
}));
