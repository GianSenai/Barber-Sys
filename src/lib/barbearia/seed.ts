import { addDays } from "date-fns";
import type { AppState, Appointment, AppointmentStatus, WeekSchedule } from "./types";
import { dateKey } from "./time";

const weekdays = (start: string, end: string, saturdayEnd = "17:00"): WeekSchedule => [
  { open: false, start, end },
  { open: true, start, end, breakStart: "12:00", breakEnd: "13:00" },
  { open: true, start, end, breakStart: "12:00", breakEnd: "13:00" },
  { open: true, start, end, breakStart: "12:00", breakEnd: "13:00" },
  { open: true, start, end, breakStart: "12:00", breakEnd: "13:00" },
  { open: true, start, end, breakStart: "12:00", breakEnd: "13:00" },
  { open: true, start: "08:00", end: saturdayEnd },
];

export const SEED_VERSION = 1;

export function createSeed(now: Date): AppState {
  const services = [
    { id: "corte-tradicional", name: "Corte tradicional", description: "Tesoura e máquina, acabamento na navalha.", price: 35, duration: 30, icon: "scissors" as const, active: true },
    { id: "corte-degrade", name: "Corte degradê", description: "Degradê preciso, do low ao high fade.", price: 45, duration: 40, icon: "fade" as const, active: true },
    { id: "corte-infantil", name: "Corte infantil", description: "Atendimento paciente para crianças até 12 anos.", price: 30, duration: 30, icon: "baby" as const, active: true },
    { id: "barba", name: "Barba", description: "Toalha quente, navalha e hidratação.", price: 25, duration: 20, icon: "beard" as const, active: true },
    { id: "corte-barba", name: "Corte + barba", description: "O combo completo para sair renovado.", price: 60, duration: 60, icon: "combo" as const, active: true },
    { id: "sobrancelha", name: "Sobrancelha", description: "Alinhamento discreto na navalha.", price: 10, duration: 10, icon: "eye" as const, active: true },
  ];
  const all = services.map((s) => s.id);
  const barbers = [
    { id: "rafael", name: "Rafael Moreira", photo: "barber-1", specialties: ["Corte clássico", "Barba"], serviceIds: all, schedule: weekdays("09:00", "19:00"), active: true },
    { id: "diego", name: "Diego Santos", photo: "barber-2", specialties: ["Degradê", "Desenhos"], serviceIds: all.filter((i) => i !== "corte-infantil"), schedule: weekdays("10:00", "20:00", "18:00"), active: true },
    { id: "antonio", name: "Antônio Ferraz", photo: "barber-3", specialties: ["Navalha", "Barba completa"], serviceIds: ["corte-tradicional", "barba", "corte-barba", "sobrancelha"], schedule: weekdays("09:00", "18:00"), active: true },
  ];

  const clients = [
    ["Lucas Almeida", "11987654321"], ["Pedro Henrique", "11991234567"], ["Marcos Vinícius", "11998887766"],
    ["João Pedro", "11976543210"], ["Gustavo Lima", "11965432109"], ["Bruno Carvalho", "11954321098"],
    ["Felipe Rocha", "11943210987"], ["Thiago Souza", "11932109876"],
  ];
  const times = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:30", "17:30"];
  const appointments: Appointment[] = [];
  let n = 0;
  for (let offset = -10; offset <= 6; offset++) {
    const d = addDays(now, offset);
    if (d.getDay() === 0) continue;
    const perDay = offset === 0 ? 5 : 3;
    for (let i = 0; i < perDay; i++) {
      n++;
      const svc = services[(n * 7) % services.length]!;
      const barber = barbers.filter((b) => b.serviceIds.includes(svc.id))[n % 2]!;
      const client = clients[(n * 3) % clients.length]! as [string, string];
      const start = times[(i * 2 + (offset & 1)) % times.length]!;
      let status: AppointmentStatus = offset < 0 ? "concluido" : offset === 0 ? (i < 2 ? "concluido" : "confirmado") : "agendado";
      if (n % 9 === 0) status = "cancelado";
      appointments.push({
        id: `seed-${n}`, code: `BP-${String(1000 + n)}`, serviceIds: [svc.id], barberId: barber.id,
        date: dateKey(d), start, duration: svc.duration, price: svc.price,
        clientName: client[0], phone: client[1], status, createdAt: addDays(d, -2).toISOString(),
      });
    }
  }

  return {
    version: SEED_VERSION,
    services,
    barbers,
    absences: [],
    appointments,
    settings: {
      name: "Barbearia Premium",
      tagline: "Seu estilo começa aqui",
      address: "Rua Augusta, 1200 — Consolação",
      city: "São Paulo — SP",
      phone: "(11) 3333-4444",
      whatsapp: "5511999990000",
      instagram: "https://instagram.com/",
      facebook: "https://facebook.com/",
      openingHoursText: "Seg a Sex: 9h às 20h · Sáb: 8h às 18h · Dom: fechado",
      slotStep: 15,
      bufferMinutes: 0,
      minAdvanceMinutes: 60,
      cancelLimitHours: 2,
      bookingWindowDays: 30,
      cancellationPolicy: "Cancelamentos e alterações podem ser feitos até 2 horas antes do horário marcado.",
      welcomeMessage: "Corte, barba e cuidado com hora marcada. Sem fila, sem espera.",
      successMessage: "Tudo certo! Te esperamos no horário marcado.",
    },
  };
}
