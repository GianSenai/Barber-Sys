import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarX, Loader2, MessageCircle, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHeader } from "@/components/site/sections";
import { EmptyState, StatusBadge } from "@/components/site/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { canClientChange } from "@/lib/barbearia/availability";
import { brl, fmtDate, isValidPhone, maskPhone, waLink } from "@/lib/barbearia/format";
import { actions, useAppState } from "@/lib/barbearia/store";
import { dateKey } from "@/lib/barbearia/time";
import type { Appointment } from "@/lib/barbearia/types";

export const Route = createFileRoute("/meus-agendamentos")({
  head: () => ({
    meta: [
      { title: "Meus agendamentos — Barbearia Premium" },
      { name: "description", content: "Consulte, cancele ou altere seus agendamentos usando telefone e código." },
      { property: "og:title", content: "Meus agendamentos — Barbearia Premium" },
      { property: "og:description", content: "Consulte seus agendamentos." },
    ],
  }),
  component: MyAppointments,
});

function MyAppointments() {
  const state = useAppState();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState<string | null>(null); // telefone validado

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isValidPhone(phone)) return setError("Informe um telefone válido com DDD.");
    if (!code.trim()) return setError("Informe o código do agendamento.");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setLoading(false);
    const digits = phone.replace(/\D/g, "");
    const match = state.appointments.find((a) => a.phone === digits && a.code.toUpperCase() === code.trim().toUpperCase());
    if (!match) return setError("Não encontramos agendamento com esse telefone e código.");
    setFound(digits);
  };

  const now = new Date();
  const today = dateKey(now);
  const mine = found ? state.appointments.filter((a) => a.phone === found).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)) : [];
  const upcoming = mine.filter((a) => a.date >= today && (a.status === "agendado" || a.status === "confirmado"));
  const history = mine.filter((a) => !upcoming.includes(a)).reverse();

  return (
    <SiteLayout>
      <PageHeader eyebrow="Área do cliente" title="Meus agendamentos" text="Use o telefone e o código recebido ao agendar." />
      <div className="mx-auto max-w-3xl px-4 py-12">
        {!found ? (
          <form onSubmit={lookup} className="space-y-4 rounded-lg border border-border bg-card p-6" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" inputMode="tel" placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="code">Código</Label>
                <Input id="code" placeholder="BP-XXXXX" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
              </div>
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Search />} Consultar</Button>
            <p className="text-xs text-muted-foreground">Demonstração: experimente (11) 98765-4321 com o código de um agendamento exibido no painel.</p>
          </form>
        ) : (
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Telefone: {maskPhone(found)}</p>
              <Button variant="ghost" size="sm" onClick={() => { setFound(null); setCode(""); }}>Trocar consulta</Button>
            </div>
            <section>
              <h2 className="mb-4 text-3xl font-semibold">Próximos</h2>
              {upcoming.length ? (
                <div className="space-y-3">{upcoming.map((a) => <ApptCard key={a.id} a={a} canChange={canClientChange(state, a.date, a.start, now)} />)}</div>
              ) : (
                <EmptyState icon={CalendarX} title="Nenhum agendamento futuro" text="Que tal marcar o próximo corte?">
                  <Button asChild><Link to="/agendar">Agendar agora</Link></Button>
                </EmptyState>
              )}
            </section>
            <section>
              <h2 className="mb-4 text-3xl font-semibold">Histórico</h2>
              {history.length ? (
                <div className="space-y-3">{history.map((a) => <ApptCard key={a.id} a={a} />)}</div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem atendimentos anteriores.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function ApptCard({ a, canChange }: { a: Appointment; canChange?: boolean }) {
  const state = useAppState();
  const barber = state.barbers.find((b) => b.id === a.barberId);
  const svc = a.serviceIds.map((id) => state.services.find((s) => s.id === id)?.name).join(" + ");
  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl font-semibold">{fmtDate(a.date, "EEE, dd/MM")} · {a.start}</p>
          <p className="text-sm text-muted-foreground">{svc} com {barber?.name} · {brl(a.price)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Código {a.code}</p>
        </div>
        <StatusBadge status={a.status} />
      </div>
      {canChange !== undefined && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          {canChange ? (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="outline" size="sm">Cancelar</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
                    <AlertDialogDescription>{svc} em {fmtDate(a.date)} às {a.start}. Esta ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Manter</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => { actions.setStatus(a.id, "cancelado"); toast.success("Agendamento cancelado."); }}>
                      Sim, cancelar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button asChild variant="ghost" size="sm">
                <a href={waLink(state.settings.whatsapp, `Olá! Gostaria de alterar meu agendamento ${a.code} (${fmtDate(a.date)} às ${a.start}).`)} target="_blank" rel="noreferrer">
                  <MessageCircle /> Solicitar alteração
                </a>
              </Button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Prazo para cancelar ou alterar encerrado ({state.settings.cancelLimitHours}h antes). Fale com a barbearia.</p>
          )}
        </div>
      )}
    </article>
  );
}
