import { createFileRoute, Link } from "@tanstack/react-router";
import { ptBR } from "date-fns/locale";
import { Check, CheckCircle2, ChevronLeft, Clock, Loader2, MessageCircle, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { EmptyState, ServiceIcon } from "@/components/site/common";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { eligibleBarbers, getSlots, isDateBookable, totalDuration, totalPrice } from "@/lib/barbearia/availability";
import { barberPhoto, brl, fmtDuration, fmtLongDate, isValidEmail, isValidPhone, maskPhone, waLink } from "@/lib/barbearia/format";
import { actions, useAppState } from "@/lib/barbearia/store";
import { dateKey, parseDateKey } from "@/lib/barbearia/time";
import type { Appointment } from "@/lib/barbearia/types";
import { cn } from "@/lib/utils";

const search = z.object({ servico: z.string().optional(), barbeiro: z.string().optional() });

export const Route = createFileRoute("/agendar")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Agendar horário — Barbearia Premium" },
      { name: "description", content: "Escolha serviço, barbeiro, data e horário e confirme seu agendamento online." },
      { property: "og:title", content: "Agendar horário — Barbearia Premium" },
      { property: "og:description", content: "Agende seu corte online em poucos passos." },
    ],
  }),
  component: BookingPage,
});

const STEPS = ["Serviço", "Profissional", "Data", "Horário", "Seus dados", "Confirmar"];

function BookingPage() {
  const state = useAppState();
  const sp = Route.useSearch();
  const [step, setStep] = useState(0);
  const [serviceIds, setServiceIds] = useState<string[]>(sp.servico ? [sp.servico] : []);
  const [barberId, setBarberId] = useState<string>(sp.barbeiro ?? "");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<Appointment | null>(null);
  const now = useMemo(() => new Date(), [step]);

  const services = state.services.filter((s) => s.active);
  const duration = totalDuration(state, serviceIds);
  const price = totalPrice(state, serviceIds);
  const barbers = eligibleBarbers(state, serviceIds);
  const slots = date && barberId ? getSlots(state, { serviceIds, barberId, date, now }) : [];

  const toggleService = (id: string) => {
    setServiceIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    setTime("");
  };

  const canNext = [
    serviceIds.length > 0,
    !!barberId && (barberId === "any" || barbers.some((b) => b.id === barberId)),
    !!date,
    !!time && slots.some((s) => s.time === time && s.available),
    true,
    true,
  ][step];

  const validate = () => {
    const e: { name?: string; phone?: string; email?: string } = {};
    if (form.name.trim().length < 3) e.name = "Informe seu nome completo.";
    if (!isValidPhone(form.phone)) e.phone = "Informe um telefone válido com DDD.";
    if (form.email && !isValidEmail(form.email)) e.email = "E-mail inválido.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (step === 4 && !validate()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirm = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    const res = actions.book({ serviceIds, barberId, date, start: time, clientName: form.name, phone: form.phone, email: form.email });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      setTime("");
      setStep(3);
      return;
    }
    toast.success("Agendamento confirmado!");
    setDone(res.value);
  };

  if (done) return <SiteLayout><Success appt={done} /></SiteLayout>;

  const barberName = barberId === "any" ? "Qualquer profissional disponível" : state.barbers.find((b) => b.id === barberId)?.name;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
        <p className="eyebrow">Agendamento online</p>
        <h1 className="mt-2 text-4xl font-semibold md:text-5xl">Agende seu horário</h1>

        <ol className="mt-8 grid grid-cols-6 gap-1.5" aria-label="Progresso">
          {STEPS.map((label, i) => (
            <li key={label} className="min-w-0">
              <div className={cn("h-1 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-muted")} />
              <p className={cn("mt-2 hidden truncate text-xs sm:block", i === step ? "text-foreground" : "text-muted-foreground")}>
                {i + 1}. {label}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-muted-foreground sm:hidden">Etapa {step + 1} de 6 — {STEPS[step]}</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
          <div key={step} className="animate-fade-up min-w-0">
            {step === 0 && (
              <Step title="Escolha o(s) serviço(s)" hint="Você pode combinar mais de um serviço.">
                <div className="grid gap-3 sm:grid-cols-2">
                  {services.map((s) => {
                    const on = serviceIds.includes(s.id);
                    return (
                      <button key={s.id} type="button" onClick={() => toggleService(s.id)} aria-pressed={on}
                        className={cn("flex items-start gap-3 rounded-lg border bg-card p-4 text-left transition-all hover:border-primary/60", on ? "border-primary ring-1 ring-primary" : "border-border")}>
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-muted text-primary"><ServiceIcon icon={s.icon} /></span>
                        <span className="flex-1">
                          <span className="block font-semibold">{s.name}</span>
                          <span className="mt-0.5 flex gap-3 text-sm text-muted-foreground"><span>{brl(s.price)}</span><span>· {fmtDuration(s.duration)}</span></span>
                        </span>
                        <span className={cn("grid h-5 w-5 place-items-center rounded-full border", on ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                          {on && <Check className="h-3 w-3" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Step>
            )}

            {step === 1 && (
              <Step title="Escolha o profissional">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => { setBarberId("any"); setTime(""); }} aria-pressed={barberId === "any"}
                    className={cn("flex items-center gap-4 rounded-lg border bg-card p-4 text-left hover:border-primary/60", barberId === "any" ? "border-primary ring-1 ring-primary" : "border-border")}>
                    <span className="grid h-16 w-16 place-items-center rounded-md bg-muted text-primary"><Users className="h-6 w-6" /></span>
                    <span><span className="block font-semibold">Qualquer profissional</span><span className="text-sm text-muted-foreground">Mais horários disponíveis</span></span>
                  </button>
                  {barbers.map((b) => (
                    <button key={b.id} type="button" onClick={() => { setBarberId(b.id); setTime(""); }} aria-pressed={barberId === b.id}
                      className={cn("flex items-center gap-4 rounded-lg border bg-card p-4 text-left hover:border-primary/60", barberId === b.id ? "border-primary ring-1 ring-primary" : "border-border")}>
                      <img src={barberPhoto(b.photo)} alt="" className="h-16 w-16 rounded-md object-cover" />
                      <span><span className="block font-semibold">{b.name}</span><span className="text-sm text-muted-foreground">{b.specialties.join(" · ")}</span></span>
                    </button>
                  ))}
                </div>
                {barbers.length === 0 && <p className="mt-4 text-sm text-destructive">Nenhum profissional realiza todos os serviços escolhidos juntos. Volte e ajuste a seleção.</p>}
              </Step>
            )}

            {step === 2 && (
              <Step title="Escolha a data" hint="Apenas dias com horários livres podem ser selecionados.">
                <div className="inline-block rounded-lg border border-border bg-card p-2">
                  <Calendar
                    mode="single"
                    locale={ptBR}
                    selected={date ? parseDateKey(date) : undefined}
                    onSelect={(d) => { if (d) { setDate(dateKey(d)); setTime(""); } }}
                    disabled={(d) => !isDateBookable(state, { serviceIds, barberId, date: d, now })}
                    startMonth={now}
                    className="bg-transparent [--cell-size:2.6rem]"
                  />
                </div>
              </Step>
            )}

            {step === 3 && (
              <Step title="Escolha o horário" hint={date ? fmtLongDate(date) : undefined}>
                {slots.some((s) => s.available) ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {slots.map((s) => (
                      <button key={s.time} type="button" disabled={!s.available} onClick={() => setTime(s.time)} aria-pressed={time === s.time}
                        className={cn("rounded-md border py-2.5 text-sm font-medium transition-colors",
                          !s.available && "cursor-not-allowed border-border/50 text-muted-foreground/40 line-through",
                          s.available && time !== s.time && "border-border bg-card hover:border-primary/60",
                          time === s.time && "border-primary bg-primary text-primary-foreground")}>
                        {s.time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Clock} title="Sem horários neste dia" text="Escolha outra data ou outro profissional.">
                    <Button variant="secondary" onClick={() => setStep(2)}>Escolher outra data</Button>
                  </EmptyState>
                )}
              </Step>
            )}

            {step === 4 && (
              <Step title="Seus dados">
                <div className="max-w-md space-y-4">
                  <Field id="name" label="Nome completo" error={errors.name}>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" aria-invalid={!!errors.name} />
                  </Field>
                  <Field id="phone" label="Telefone / WhatsApp" error={errors.phone}>
                    <Input id="phone" inputMode="tel" placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} autoComplete="tel" aria-invalid={!!errors.phone} />
                  </Field>
                  <Field id="email" label="E-mail (opcional)" error={errors.email}>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" aria-invalid={!!errors.email} />
                  </Field>
                </div>
              </Step>
            )}

            {step === 5 && (
              <Step title="Revise e confirme">
                <dl className="divide-y divide-border rounded-lg border border-border bg-card">
                  <Row k="Serviço">{serviceIds.map((id) => state.services.find((s) => s.id === id)?.name).join(" + ")}</Row>
                  <Row k="Profissional">{barberName}</Row>
                  <Row k="Data e horário">{fmtLongDate(date)} às {time}</Row>
                  <Row k="Duração estimada">{fmtDuration(duration)}</Row>
                  <Row k="Cliente">{form.name} · {form.phone}{form.email && ` · ${form.email}`}</Row>
                  <Row k="Total"><span className="font-display text-2xl text-primary">{brl(price)}</span></Row>
                </dl>
                <p className="mt-3 text-xs text-muted-foreground">{state.settings.cancellationPolicy}</p>
                <Button size="lg" className="mt-6 w-full tracking-wider sm:w-auto" onClick={confirm} disabled={saving}>
                  {saving && <Loader2 className="animate-spin" />} CONFIRMAR AGENDAMENTO
                </Button>
              </Step>
            )}

            <div className="mt-8 flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || saving}>
                <ChevronLeft /> Voltar
              </Button>
              {step < 5 && <Button onClick={next} disabled={!canNext}>Continuar</Button>}
            </div>
          </div>

          <aside className="h-fit rounded-lg border border-border bg-card p-5 lg:sticky lg:top-24">
            <p className="eyebrow">Resumo</p>
            {serviceIds.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nenhum serviço selecionado.</p>
            ) : (
              <ul className="mt-3 space-y-1.5 text-sm">
                {serviceIds.map((id) => {
                  const s = state.services.find((x) => x.id === id);
                  return s && <li key={id} className="flex justify-between gap-2"><span>{s.name}</span><span className="text-muted-foreground">{brl(s.price)}</span></li>;
                })}
              </ul>
            )}
            {barberName && <p className="mt-3 text-sm text-muted-foreground">{barberName}</p>}
            {date && <p className="text-sm text-muted-foreground">{fmtLongDate(date)}{time && ` · ${time}`}</p>}
            <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">{fmtDuration(duration || 0)}</span>
              <span className="font-display text-3xl font-semibold text-primary">{brl(price)}</span>
            </div>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}

function Step({ title, hint, children }: { title: string; hint?: string | undefined; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold md:text-3xl">{title}</h2>
      {hint && <p className="mt-1 text-sm capitalize-first text-muted-foreground">{hint}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-muted-foreground">{k}</dt>
      <dd className="font-medium sm:text-right">{children}</dd>
    </div>
  );
}

function Success({ appt }: { appt: Appointment }) {
  const state = useAppState();
  const barber = state.barbers.find((b) => b.id === appt.barberId);
  const svc = appt.serviceIds.map((id) => state.services.find((s) => s.id === id)?.name).join(" + ");
  const msg = `Olá! Acabei de agendar na ${state.settings.name}.\nCódigo: ${appt.code}\nServiço: ${svc}\nProfissional: ${barber?.name}\nData: ${fmtLongDate(appt.date)} às ${appt.start}\nNome: ${appt.clientName}`;
  return (
    <div className="animate-fade-up mx-auto max-w-xl px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-success" aria-hidden />
      <h1 className="mt-4 text-4xl font-semibold">Agendamento confirmado</h1>
      <p className="mt-2 text-muted-foreground">{state.settings.successMessage}</p>
      <div className="mt-8 rounded-lg border border-primary/40 bg-card p-6 text-left">
        <p className="text-center text-sm text-muted-foreground">Código do agendamento</p>
        <p className="text-center font-display text-4xl font-semibold tracking-widest text-primary">{appt.code}</p>
        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Serviço</dt><dd className="text-right">{svc}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Profissional</dt><dd>{barber?.name}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Data</dt><dd className="text-right">{fmtLongDate(appt.date)} às {appt.start}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Total</dt><dd>{brl(appt.price)}</dd></div>
        </dl>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Guarde o código: use-o com seu telefone em “Meus agendamentos”.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild className="bg-success text-primary-foreground hover:bg-success/90">
          <a href={waLink(state.settings.whatsapp, msg)} target="_blank" rel="noreferrer"><MessageCircle /> Enviar pelo WhatsApp</a>
        </Button>
        <Button asChild variant="secondary"><Link to="/meus-agendamentos">Meus agendamentos</Link></Button>
      </div>
    </div>
  );
}
