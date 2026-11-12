import { supabase } from "@/integrations/supabase/client";
import { patchState } from "./store";
import type { Absence, WeekSchedule } from "./types";

type AbsenceRow = {
  id: string; barber_id: string | null; date_from: string; date_to: string;
  start_time: string | null; end_time: string | null; reason: string;
};

const toAbsence = (r: AbsenceRow): Absence => ({
  id: r.id, barberId: r.barber_id, dateFrom: r.date_from, dateTo: r.date_to, reason: r.reason,
  ...(r.start_time && r.end_time ? { start: r.start_time, end: r.end_time } : {}),
});

/** Carrega folgas e horários salvos no Cloud e substitui os dados locais. */
export async function loadFromCloud() {
  const [sch, abs] = await Promise.all([
    supabase.from("barber_schedules").select("barber_id, schedule"),
    supabase.from("absences").select("*"),
  ]);
  if (sch.error || abs.error) return;
  const map = new Map(sch.data.map((r) => [r.barber_id, r.schedule as unknown as WeekSchedule]));
  patchState((s) => ({
    ...s,
    barbers: s.barbers.map((b) => (map.has(b.id) ? { ...b, schedule: map.get(b.id)! } : b)),
    absences: (abs.data as AbsenceRow[]).map(toAbsence),
  }));
}

export async function addAbsence(a: Omit<Absence, "id">) {
  const { data, error } = await supabase.from("absences").insert({
    barber_id: a.barberId, date_from: a.dateFrom, date_to: a.dateTo, reason: a.reason,
    start_time: a.start ?? null, end_time: a.end ?? null,
  }).select().single();
  if (error) throw error;
  const ab = toAbsence(data as AbsenceRow);
  patchState((s) => ({ ...s, absences: [...s.absences, ab] }));
}

export async function removeAbsence(id: string) {
  const { error } = await supabase.from("absences").delete().eq("id", id);
  if (error) throw error;
  patchState((s) => ({ ...s, absences: s.absences.filter((a) => a.id !== id) }));
}

export async function saveSchedule(barberId: string, schedule: WeekSchedule) {
  const clean = schedule.map((d) => ({ ...d, breakStart: d.breakStart ?? null, breakEnd: d.breakEnd ?? null }));
  const { error } = await supabase.from("barber_schedules")
    .upsert({ barber_id: barberId, schedule: clean, updated_at: new Date().toISOString() });
  if (error) throw error;
  patchState((s) => ({ ...s, barbers: s.barbers.map((b) => (b.id === barberId ? { ...b, schedule } : b)) }));
}
