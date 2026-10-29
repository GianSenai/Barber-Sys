export type ServiceIcon = "scissors" | "fade" | "baby" | "beard" | "combo" | "eye";

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number; // em reais
  duration: number; // minutos
  icon: ServiceIcon;
  active: boolean;
}

export interface DaySchedule {
  open: boolean;
  start: string; // "HH:mm"
  end: string;
  breakStart?: string;
  breakEnd?: string;
}

/** Índice 0 = domingo ... 6 = sábado */
export type WeekSchedule = DaySchedule[];

export interface Barber {
  id: string;
  name: string;
  photo: string; // chave de foto local (barber-1) ou URL
  specialties: string[];
  serviceIds: string[];
  schedule: WeekSchedule;
  active: boolean;
}

/** Folga, férias, ausência ou bloqueio de horário. barberId null = barbearia inteira. */
export interface Absence {
  id: string;
  barberId: string | null;
  dateFrom: string; // "yyyy-MM-dd"
  dateTo: string;
  start?: string; // se definido, bloqueio parcial do dia
  end?: string;
  reason: string;
}

export type AppointmentStatus = "agendado" | "confirmado" | "concluido" | "cancelado";

export interface Appointment {
  id: string;
  code: string;
  serviceIds: string[];
  barberId: string;
  date: string; // "yyyy-MM-dd"
  start: string; // "HH:mm"
  duration: number;
  price: number;
  clientName: string;
  phone: string; // apenas dígitos
  email?: string | undefined;
  status: AppointmentStatus;
  createdAt: string;
}

export interface Settings {
  name: string;
  tagline: string;
  logoUrl?: string;
  address: string;
  city: string;
  phone: string;
  whatsapp: string; // apenas dígitos, com DDI
  instagram: string;
  facebook: string;
  openingHoursText: string;
  slotStep: number; // minutos entre opções de horário
  bufferMinutes: number; // intervalo entre atendimentos
  minAdvanceMinutes: number; // antecedência mínima
  cancelLimitHours: number; // prazo para cancelar/alterar
  bookingWindowDays: number;
  cancellationPolicy: string;
  welcomeMessage: string;
  successMessage: string;
}

export interface AppState {
  version: number;
  services: Service[];
  barbers: Barber[];
  absences: Absence[];
  appointments: Appointment[];
  settings: Settings;
}
