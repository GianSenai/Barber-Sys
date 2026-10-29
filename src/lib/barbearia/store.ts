import { useSyncExternalStore } from "react";
import { createSeed, SEED_VERSION } from "./seed";
import type { AppState, Appointment, AppointmentStatus } from "./types";
import { getSlots, totalDuration, totalPrice } from "./availability";

/**
 * Persistência LOCAL de demonstração (localStorage). Não é segurança real:
 * qualquer pessoa com acesso ao navegador pode ver/alterar os dados.
 * Substituir por chamadas ao backend (mesma interface de `actions`) na integração real.
 */
const KEY = "barbearia-demo-v1";
let state: AppState = createSeed(new Date());
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function hydrateStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as AppState) : null;
    if (parsed && parsed.version === SEED_VERSION) state = parsed;
  } catch {
    /* dados corrompidos: mantém seed */
  }
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useAppState() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export const getState = () => state;

function set(fn: (s: AppState) => AppState) {
  state = fn(state);
  emit();
}

const uid = () => Math.random().toString(36).slice(2, 10);
const genCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "BP-" + Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export interface BookingInput {
  serviceIds: string[];
  barberId: string | "any";
  date: string;
  start: string;
  clientName: string;
  phone: string;
  email?: string;
  status?: AppointmentStatus;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const actions = {
  /** Revalida a disponibilidade no momento da gravação (no backend real isto deve ser transacional). */
  book(input: BookingInput, now = new Date()): Result<Appointment> {
    const slot = getSlots(state, { serviceIds: input.serviceIds, barberId: input.barberId, date: input.date, now }).find(
      (s) => s.time === input.start,
    );
    if (!slot?.available || !slot.barberId) {
      return { ok: false, error: "Esse horário acabou de ficar indisponível. Escolha outro, por favor." };
    }
    const appt: Appointment = {
      id: uid(),
      code: genCode(),
      serviceIds: input.serviceIds,
      barberId: slot.barberId,
      date: input.date,
      start: input.start,
      duration: totalDuration(state, input.serviceIds),
      price: totalPrice(state, input.serviceIds),
      clientName: input.clientName.trim(),
      phone: input.phone.replace(/\D/g, ""),
      email: input.email?.trim() || undefined,
      status: input.status ?? "agendado",
      createdAt: now.toISOString(),
    };
    set((s) => ({ ...s, appointments: [...s.appointments, appt] }));
    return { ok: true, value: appt };
  },
  setStatus(id: string, status: AppointmentStatus) {
    set((s) => ({ ...s, appointments: s.appointments.map((a) => (a.id === id ? { ...a, status } : a)) }));
  },
  update<K extends "services" | "barbers" | "absences">(key: K, list: AppState[K]) {
    set((s) => ({ ...s, [key]: list }));
  },
  updateSettings(patch: Partial<AppState["settings"]>) {
    set((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  },
  reset() {
    state = createSeed(new Date());
    emit();
  },
  newId: uid,
};
