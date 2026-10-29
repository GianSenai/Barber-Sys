import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseDateKey } from "./time";
import type { AppointmentStatus } from "./types";
import barber1 from "@/assets/barber-1.jpg";
import barber2 from "@/assets/barber-2.jpg";
import barber3 from "@/assets/barber-3.jpg";

const brlFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const brl = (v: number) => brlFmt.format(v);

export const fmtDate = (key: string, pattern = "dd/MM/yyyy") => format(parseDateKey(key), pattern, { locale: ptBR });
export const fmtLongDate = (key: string) => fmtDate(key, "EEEE, d 'de' MMMM");

export const fmtDuration = (min: number) =>
  min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, "0") : ""}`;

export function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const isValidPhone = (v: string) => /^\d{10,11}$/.test(v.replace(/\D/g, ""));
export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export const waLink = (number: string, text?: string) =>
  `https://wa.me/${number.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

const photos: Record<string, string> = { "barber-1": barber1, "barber-2": barber2, "barber-3": barber3 };
export const barberPhoto = (photo: string) => photos[photo] ?? photo;

export const statusLabel: Record<AppointmentStatus, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const statusClass: Record<AppointmentStatus, string> = {
  agendado: "border-info/40 bg-info/10 text-info",
  confirmado: "border-primary/40 bg-primary/10 text-primary",
  concluido: "border-success/40 bg-success/10 text-success",
  cancelado: "border-destructive/40 bg-destructive/10 text-destructive line-through decoration-1",
};
