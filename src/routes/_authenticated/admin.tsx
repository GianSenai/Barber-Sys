import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { addAbsence, removeAbsence, saveSchedule } from "@/lib/barbearia/cloud";
import { useEffect, useState } from "react";
import { CalendarOff, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/site/common";
import { hydrateStore, useAppState } from "@/lib/barbearia/store";
import { fmtDate } from "@/lib/barbearia/format";
import { dateKey } from "@/lib/barbearia/time";
import type { Absence, DaySchedule } from "@/lib/barbearia/types";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel da barbearia — Folgas e horários" },
      { name: "description", content: "Área do barbeiro para bloquear dias, folgas e horários de trabalho." },
      { property: "og:title", content: "Painel da barbearia" },
      { property: "og:description", content: "Gerencie folgas e horários dos barbeiros." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function AdminPage() {
  const state = useAppState();
  useEffect(() => hydrateStore(), []);
  const [barberId, setBarberId] = useState(state.barbers[0]?.id ?? "");
  const barber = state.barbers.find((b) => b.id === barberId);
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return setIsAdmin(false);
      const { data: ok } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
      setIsAdmin(!!ok);
    });
  }, []);
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen">
      <Toaster />
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Logo name={state.settings.name} logoUrl={state.settings.logoUrl} />
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/">Ver site</Link></Button>
            <Button variant="outline" size="sm" onClick={signOut}><LogOut className="mr-1 h-4 w-4" />Sair</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="eyebrow">Painel do barbeiro</p>
        <h1 className="mt-1 font-display text-3xl">Folgas e horários</h1>
        <p className="mt-2 text-sm text-muted-foreground">Os dias e horários bloqueados aqui somem automaticamente da tela de agendamento dos clientes.</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {state.barbers.map((b) => (
            <Button key={b.id} variant={b.id === barberId ? "default" : "outline"} size="sm" onClick={() => setBarberId(b.id)}>{b.name}</Button>
          ))}
        </div>

        {isAdmin === false && (
          <p className="mt-6 rounded-md border border-border bg-card p-4 text-sm">Sua conta não tem permissão de administrador. Peça ao dono da barbearia para liberar seu acesso.</p>
        )}
        {isAdmin && barber && (
          <Tabs defaultValue="folgas" className="mt-6">
            <TabsList>
              <TabsTrigger value="folgas">Dias e horários bloqueados</TabsTrigger>
              <TabsTrigger value="semana">Horário semanal</TabsTrigger>
            </TabsList>
            <TabsContent value="folgas"><Absences barberId={barber.id} /></TabsContent>
            <TabsContent value="semana"><WeekEditor key={barber.id} barberId={barber.id} /></TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

function Absences({ barberId }: { barberId: string }) {
  const state = useAppState();
  const today = dateKey(new Date());
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [partial, setPartial] = useState(false);
  const [start, setStart] = useState("12:00");
  const [end, setEnd] = useState("14:00");
  const [reason, setReason] = useState("");
  const list = state.absences
    .filter((a) => (a.barberId === barberId || a.barberId === null) && a.dateTo >= today)
    .sort((a, b) => a.dateFrom.localeCompare(b.dateFrom));

  const add = async () => {
    if (!from || !to || to < from) { toast.error("Confira as datas: a data final não pode ser antes da inicial."); return; }
    if (partial && start >= end) { toast.error("O horário final precisa ser depois do inicial."); return; }
    const ab: Omit<Absence, "id"> = { barberId, dateFrom: from, dateTo: to, reason: reason.trim() || (partial ? "Horário bloqueado" : "Folga"), ...(partial ? { start, end } : {}) };
    try { await addAbsence(ab); } catch { toast.error("Não foi possível salvar. Tente novamente."); return; }
    setReason("");
    toast.success("Bloqueio salvo. Esses horários não aparecem mais para os clientes.");
  };
  const remove = async (id: string) => {
    try { await removeAbsence(id); } catch { toast.error("Não foi possível remover. Tente novamente."); return; }
    toast.success("Bloqueio removido.");
  };

  return (
    <div className="mt-4 grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-display text-xl">Bloquear dia ou horário</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div><Label htmlFor="from">De</Label><Input id="from" type="date" min={today} value={from} onChange={(e) => { setFrom(e.target.value); if (to < e.target.value) setTo(e.target.value); }} /></div>
          <div><Label htmlFor="to">Até</Label><Input id="to" type="date" min={from} value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Switch id="partial" checked={partial} onCheckedChange={setPartial} />
          <Label htmlFor="partial">Bloquear só um horário (não o dia todo)</Label>
        </div>
        {partial && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div><Label htmlFor="st">Das</Label><Input id="st" type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div><Label htmlFor="en">Até</Label><Input id="en" type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          </div>
        )}
        <div className="mt-3"><Label htmlFor="reason">Motivo (opcional)</Label><Input id="reason" placeholder="Folga, férias, médico..." value={reason} onChange={(e) => setReason(e.target.value)} /></div>
        <Button className="mt-4 w-full" onClick={add}>Salvar bloqueio</Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-display text-xl">Próximos bloqueios</h2>
        {list.length === 0 ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><CalendarOff className="h-4 w-4" /> Nenhum dia ou horário bloqueado.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {list.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{a.dateFrom === a.dateTo ? fmtDate(a.dateFrom) : `${fmtDate(a.dateFrom)} a ${fmtDate(a.dateTo)}`}</p>
                  <p className="text-muted-foreground">{a.start ? `${a.start} às ${a.end}` : "Dia inteiro"} · {a.reason}{a.barberId === null ? " · barbearia toda" : ""}</p>
                </div>
                <Button variant="ghost" size="icon" aria-label="Remover bloqueio" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function WeekEditor({ barberId }: { barberId: string }) {
  const state = useAppState();
  const barber = state.barbers.find((b) => b.id === barberId)!;
  const [week, setWeek] = useState<DaySchedule[]>(barber.schedule);
  const patch = (i: number, p: Partial<DaySchedule>) => setWeek((w) => w.map((d, j) => (j === i ? { ...d, ...p } : d)));

  const save = async () => {
    for (const [i, d] of week.entries()) {
      if (!d.open) continue;
      if (d.start >= d.end) { toast.error(`${DAYS[i]}: o horário de saída precisa ser depois da entrada.`); return; }
      if (d.breakStart && d.breakEnd && d.breakStart >= d.breakEnd) { toast.error(`${DAYS[i]}: confira o intervalo.`); return; }
    }
    try { await saveSchedule(barberId, week); } catch { toast.error("Não foi possível salvar. Tente novamente."); return; }
    toast.success("Horário semanal salvo.");
  };

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-5">
      <div className="space-y-3">
        {week.map((d, i) => (
          <div key={i} className="grid items-center gap-3 border-b border-border/60 pb-3 sm:grid-cols-[140px_1fr]">
            <div className="flex items-center gap-3">
              <Switch checked={d.open} onCheckedChange={(v) => patch(i, { open: v })} aria-label={`Trabalha ${DAYS[i]}`} />
              <span className="font-medium">{DAYS[i]}</span>
            </div>
            {d.open ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Input type="time" aria-label="Entrada" value={d.start} onChange={(e) => patch(i, { start: e.target.value })} />
                <Input type="time" aria-label="Saída" value={d.end} onChange={(e) => patch(i, { end: e.target.value })} />
                <Input type="time" aria-label="Início do intervalo" value={d.breakStart ?? ""} onChange={(e) => patch(i, { breakStart: e.target.value || undefined })} />
                <Input type="time" aria-label="Fim do intervalo" value={d.breakEnd ?? ""} onChange={(e) => patch(i, { breakEnd: e.target.value || undefined })} />
              </div>
            ) : <span className="text-sm text-muted-foreground">Não trabalha</span>}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Colunas: entrada · saída · início do intervalo · fim do intervalo (o intervalo é opcional).</p>
      <Button className="mt-4" onClick={save}>Salvar horário semanal</Button>
    </div>
  );
}
