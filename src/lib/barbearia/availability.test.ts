import { describe, expect, it } from "vitest";
import { createSeed } from "./seed";
import { canClientChange, getSlots, isDateBookable, totalPrice } from "./availability";
import type { AppState } from "./types";

// Segunda-feira, 2 de novembro de 2026, 08:00
const now = new Date(2026, 10, 2, 8, 0);
const base = (): AppState => ({ ...createSeed(now), appointments: [], absences: [] });
const slot = (s: AppState, time: string, date = "2026-11-03", serviceIds = ["corte-tradicional"], barberId = "rafael") =>
  getSlots(s, { serviceIds, barberId, date, now }).find((x) => x.time === time);

describe("disponibilidade", () => {
  it("horário reservado deixa de aparecer como disponível", () => {
    const s = base();
    s.appointments.push({ id: "a", code: "X", serviceIds: ["corte-tradicional"], barberId: "rafael", date: "2026-11-03", start: "10:00", duration: 30, price: 35, clientName: "A", phone: "11999999999", status: "agendado", createdAt: "" });
    expect(slot(s, "10:00")?.available).toBe(false);
    expect(slot(s, "10:15")?.available).toBe(false);
    expect(slot(s, "10:30")?.available).toBe(true);
  });

  it("considera a duração do serviço (corte+barba 60min não cabe antes de um agendamento às 10:30)", () => {
    const s = base();
    s.appointments.push({ id: "a", code: "X", serviceIds: ["barba"], barberId: "rafael", date: "2026-11-03", start: "10:30", duration: 20, price: 25, clientName: "A", phone: "11999999999", status: "agendado", createdAt: "" });
    expect(slot(s, "10:00", "2026-11-03", ["corte-barba"])?.available).toBe(false);
    expect(slot(s, "09:30", "2026-11-03", ["corte-barba"])?.available).toBe(true);
  });

  it("agendamento cancelado libera o horário", () => {
    const s = base();
    s.appointments.push({ id: "a", code: "X", serviceIds: ["corte-tradicional"], barberId: "rafael", date: "2026-11-03", start: "10:00", duration: 30, price: 35, clientName: "A", phone: "11999999999", status: "cancelado", createdAt: "" });
    expect(slot(s, "10:00")?.available).toBe(true);
  });

  it("respeita o intervalo de almoço", () => {
    expect(slot(base(), "12:00")?.available).toBe(false);
    expect(slot(base(), "11:45")?.available).toBe(false);
  });

  it("não permite horários no passado nem antes da antecedência mínima (60 min)", () => {
    const s = base();
    const later = new Date(2026, 10, 3, 9, 50);
    const at = (t: string) => getSlots(s, { serviceIds: ["corte-tradicional"], barberId: "rafael", date: "2026-11-03", now: later }).find((x) => x.time === t);
    expect(at("09:00")?.available).toBe(false);
    expect(at("10:45")?.available).toBe(false);
    expect(at("11:00")?.available).toBe(true);
    expect(isDateBookable(s, { serviceIds: ["barba"], barberId: "any", date: new Date(2026, 10, 1), now })).toBe(false);
  });

  it("não oferece horários fora do expediente nem aos domingos", () => {
    expect(slot(base(), "08:30")).toBeUndefined();
    expect(slot(base(), "18:45")).toBeUndefined();
    expect(getSlots(base(), { serviceIds: ["barba"], barberId: "any", date: "2026-11-08", now })).toEqual([]);
  });

  it("respeita folgas e bloqueios", () => {
    const s = base();
    s.absences.push({ id: "f", barberId: "rafael", dateFrom: "2026-11-03", dateTo: "2026-11-05", reason: "Férias" });
    s.absences.push({ id: "b", barberId: "diego", dateFrom: "2026-11-03", dateTo: "2026-11-03", start: "14:00", end: "16:00", reason: "Bloqueio" });
    expect(slot(s, "10:00")).toBeUndefined();
    expect(slot(s, "14:30", "2026-11-03", ["barba"], "diego")?.available).toBe(false);
    expect(slot(s, "16:00", "2026-11-03", ["barba"], "diego")?.available).toBe(true);
  });

  it("soma o valor total dos serviços escolhidos", () => {
    expect(totalPrice(base(), ["corte-degrade", "barba"])).toBe(70);
  });

  it("cliente só pode cancelar até 2 horas antes", () => {
    expect(canClientChange(base(), "2026-11-02", "10:00", now)).toBe(true);
    expect(canClientChange(base(), "2026-11-02", "09:30", now)).toBe(false);
  });
});
