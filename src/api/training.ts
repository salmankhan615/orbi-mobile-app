import {
  bookPracticalTraining,
  getAvailableTrainingShifts,
  getCourseSettings,
  isSettingsActive,
  type TrainingShiftRaw,
} from '@/api/crm';

export type TrainingLocation = {
  id: string;
  title: string;
};

export type TrainingShiftOption = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  /** Free seat numbers for the picker. */
  freeSeats: number[];
  availableCount: number;
  bookingLimit: number;
};

function freeSeatsForShift(shift: TrainingShiftRaw): number[] {
  const limit = Number(shift.currentLimit ?? shift.defaultLimit ?? 0);
  if (!Number.isFinite(limit) || limit <= 0) return [];
  const booked = new Set(
    (Array.isArray(shift.bookedSeatNumbers) ? shift.bookedSeatNumbers : [])
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n)),
  );
  return Array.from({ length: limit }, (_, i) => i + 1).filter((n) => !booked.has(n));
}

export const trainingApi = {
  async listLocations(): Promise<TrainingLocation[]> {
    const settings = await getCourseSettings();
    return (settings.locations ?? [])
      .filter((item) => isSettingsActive(item?.status))
      .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
      .map((item) => ({
        id: String(item._id),
        title: item.title || 'Location',
      }));
  },

  async listShifts(date: string, locationId: string): Promise<TrainingShiftOption[]> {
    const raw = await getAvailableTrainingShifts({ date, location: locationId });
    const shifts = Array.isArray(raw?.data?.shifts) ? raw.data.shifts : [];
    return shifts
      .map((shift): TrainingShiftOption | null => {
        const id = shift._id ? String(shift._id) : '';
        if (!id) return null;
        const freeSeats = freeSeatsForShift(shift);
        const availableCount =
          typeof shift.availableSeats === 'number'
            ? shift.availableSeats
            : freeSeats.length;
        return {
          id,
          name: shift.name?.trim() || 'Shift',
          startTime: shift.startTime || '—',
          endTime: shift.endTime || '—',
          freeSeats,
          availableCount,
          bookingLimit: Number(shift.currentLimit ?? shift.defaultLimit ?? 0) || 0,
        };
      })
      .filter((item): item is TrainingShiftOption => Boolean(item));
  },

  async book(params: {
    locationId: string;
    shiftId: string;
    date: string;
    seat: number;
  }) {
    return bookPracticalTraining({
      location: params.locationId,
      shift: params.shiftId,
      date: params.date,
      seat: params.seat,
    });
  },
};
