import type { AppState, Barber } from "./types";
import { dateKey, overlaps, parseDateKey, toHHMM, toMin } from "./time";

/**
 * Regras de disponibilidade. Funções puras para que a mesma lógica possa ser
 * reaproveitada no backend quando houver integração real (a checagem no navegador
 * não impede reservas simultâneas).
 */

export interface Slot {
  time: string;
  available: boolean;
  barberId?: string | undefined; // barbeiro que atenderá (útil para "qualquer profissional")
}

const nowMinutesOn = (date: string, now: Date) => {
  const day = parseDateKey(date);
  return Math.floor((now.getTime() - day.getTime()) / 60000);
};

export function eligibleBarbers(state: AppState, serviceIds: string[]): Barber[] {
  return state.barbers.filter(
    (b) => b.active && serviceIds.every((id) => b.serviceIds.includes(id)),
  );
}

/** Ausências que cobrem o dia inteiro (folga, férias, fechamento). */
function fullDayOff(state: AppState, barberId: string, date: string) {
  return state.absences.some(
    (a) =>
      (a.barberId === null || a.barberId === barberId) &&
      !a.start &&
      date >= a.dateFrom &&
      date <= a.dateTo,
  );
}

export function barberWorksOn(state: AppState, barber: Barber, date: string) {
  const day = barber.schedule[parseDateKey(date).getDay()];
  if (!day?.open) return false;
  return !fullDayOff(state, barber.id, date);
}

export function barberSlots(
  state: AppState,
  barber: Barber,
  date: string,
  duration: number,
  now: Date,
  ignoreAppointmentId?: string,
): Slot[] {
  if (!barberWorksOn(state, barber, date)) return [];
  const { slotStep, bufferMinutes, minAdvanceMinutes } = state.settings;
  const day = barber.schedule[parseDateKey(date).getDay()];
  if (!day) return [];
  const open = toMin(day.start);
  const close = toMin(day.end);
  const earliest = nowMinutesOn(date, now) + minAdvanceMinutes;

  const busy: [number, number][] = [];
  if (day.breakStart && day.breakEnd) busy.push([toMin(day.breakStart), toMin(day.breakEnd)]);
  for (const a of state.appointments) {
    if (a.barberId !== barber.id || a.date !== date || a.status === "cancelado") continue;
    if (a.id === ignoreAppointmentId) continue;
    const s = toMin(a.start);
    busy.push([s - bufferMinutes, s + a.duration + bufferMinutes]);
  }
  for (const ab of state.absences) {
    if (!ab.start || !ab.end) continue;
    if (ab.barberId !== null && ab.barberId !== barber.id) continue;
    if (date < ab.dateFrom || date > ab.dateTo) continue;
    busy.push([toMin(ab.start), toMin(ab.end)]);
  }

  const slots: Slot[] = [];
  for (let t = open; t + duration <= close; t += slotStep) {
    const free = t >= earliest && !busy.some(([s, e]) => overlaps(t, t + duration, s, e));
    slots.push({ time: toHHMM(t), available: free, barberId: free ? barber.id : undefined });
  }
  return slots;
}

/** Horários para um barbeiro específico ou "any" (qualquer profissional disponível). */
export function getSlots(
  state: AppState,
  opts: { serviceIds: string[]; barberId: string | "any"; date: string; now: Date },
): Slot[] {
  const duration = totalDuration(state, opts.serviceIds);
  if (!duration) return [];
  const barbers =
    opts.barberId === "any"
      ? eligibleBarbers(state, opts.serviceIds)
      : state.barbers.filter((b) => b.id === opts.barberId && b.active);
  const map = new Map<string, Slot>();
  for (const b of barbers) {
    for (const s of barberSlots(state, b, opts.date, duration, opts.now)) {
      const prev = map.get(s.time);
      if (!prev || (!prev.available && s.available)) map.set(s.time, s);
    }
  }
  return [...map.values()].sort((a, b) => a.time.localeCompare(b.time));
}

export function isDateBookable(
  state: AppState,
  opts: { serviceIds: string[]; barberId: string | "any"; date: Date; now: Date },
) {
  const key = dateKey(opts.date);
  const today = dateKey(opts.now);
  if (key < today) return false;
  const limit = new Date(opts.now);
  limit.setDate(limit.getDate() + state.settings.bookingWindowDays);
  if (key > dateKey(limit)) return false;
  return getSlots(state, { ...opts, date: key }).some((s) => s.available);
}

export function totalDuration(state: AppState, serviceIds: string[]) {
  return serviceIds.reduce((sum, id) => sum + (state.services.find((s) => s.id === id)?.duration ?? 0), 0);
}

export function totalPrice(state: AppState, serviceIds: string[]) {
  return serviceIds.reduce((sum, id) => sum + (state.services.find((s) => s.id === id)?.price ?? 0), 0);
}

/** O cliente ainda pode cancelar/alterar? */
export function canClientChange(state: AppState, date: string, start: string, now: Date) {
  const at = parseDateKey(date).getTime() + toMin(start) * 60000;
  return at - now.getTime() >= state.settings.cancelLimitHours * 3600000;
}
