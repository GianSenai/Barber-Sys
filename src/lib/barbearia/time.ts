import { format } from "date-fns";

export const toMin = (hhmm: string) => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const toHHMM = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export const dateKey = (d: Date) => format(d, "yyyy-MM-dd");

/** Converte "yyyy-MM-dd" em Date local (meia-noite). */
export const parseDateKey = (key: string) => {
  const [y = 1970, m = 1, d = 1] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  aStart < bEnd && bStart < aEnd;
