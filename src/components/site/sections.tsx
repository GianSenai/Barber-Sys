import { Link } from "@tanstack/react-router";
import { CalendarCheck, Clock, MapPin, MessageCircle, Phone, Quote, Scissors, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/lib/barbearia/store";
import { barberPhoto, brl, fmtDuration, waLink } from "@/lib/barbearia/format";
import heroImg from "@/assets/hero.jpg";
import { SectionTitle, ServiceIcon } from "./common";

export function Hero() {
  const { settings } = useAppState();
  return (
    <section className="relative isolate overflow-hidden">
      <img src={heroImg} alt="Barbeiro aparando a barba de um cliente" width={1600} height={1008} className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="bg-hero-overlay absolute inset-0 -z-10" />
      <div className="mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-4 py-24">
        <p className="eyebrow animate-fade-up">{settings.name}</p>
        <h1 className="animate-fade-up mt-4 max-w-2xl text-5xl font-semibold leading-[1.02] md:text-7xl">{settings.tagline}</h1>
        <p className="animate-fade-up mt-5 max-w-md text-lg text-muted-foreground">{settings.welcomeMessage}</p>
        <div className="animate-fade-up mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="h-12 px-8 tracking-wider">
            <Link to="/agendar">AGENDAR MEU CORTE</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 bg-transparent">
            <Link to="/servicos">Ver serviços e preços</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function About() {
  const items = [
    { icon: Scissors, title: "Profissionais experientes", text: "Técnica apurada do clássico ao degradê." },
    { icon: CalendarCheck, title: "Hora marcada", text: "Agende online em menos de um minuto." },
    { icon: UserCheck, title: "Ambiente acolhedor", text: "Café, boa conversa e atendimento sem pressa." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-end">
        <SectionTitle eyebrow="A barbearia" title="Tradição na tesoura, precisão no detalhe." />
        <p className="mb-10 text-muted-foreground">
          Unimos o melhor da barbearia clássica a técnicas contemporâneas. Cada atendimento é pensado para você sair com um visual que combina com seu estilo.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map(({ icon: I, title, text }) => (
          <div key={title} className="rounded-lg border border-border bg-card p-6">
            <I className="h-5 w-5 text-primary" aria-hidden />
            <h3 className="mt-4 text-xl font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ServicesSection({ title = true }: { title?: boolean }) {
  const { services } = useAppState();
  const list = services.filter((s) => s.active);
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      {title && <SectionTitle eyebrow="Serviços" title="Serviços e preços" text="Valores transparentes, sem surpresas." />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => (
          <article key={s.id} className="group flex flex-col rounded-lg border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-elegant">
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-muted text-primary"><ServiceIcon icon={s.icon} /></span>
              <span className="font-display text-3xl font-semibold text-primary">{brl(s.price)}</span>
            </div>
            <h3 className="mt-5 text-2xl font-semibold">{s.name}</h3>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{s.description}</p>
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Clock className="h-4 w-4" aria-hidden />{fmtDuration(s.duration)}</span>
              <Button asChild size="sm" variant="secondary">
                <Link to="/agendar" search={{ servico: s.id }}>Agendar</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function BarbersSection({ title = true }: { title?: boolean }) {
  const { barbers } = useAppState();
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      {title && <SectionTitle eyebrow="Equipe" title="Nossos barbeiros" />}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {barbers.filter((b) => b.active).map((b) => (
          <article key={b.id} className="group overflow-hidden rounded-lg border border-border bg-card">
            <div className="aspect-[4/5] overflow-hidden">
              <img src={barberPhoto(b.photo)} alt={`Foto de ${b.name}`} loading="lazy" width={768} height={960} className="h-full w-full object-cover grayscale-[30%] transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0" />
            </div>
            <div className="p-5">
              <h3 className="text-2xl font-semibold">{b.name}</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {b.specialties.map((sp) => (
                  <span key={sp} className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">{sp}</span>
                ))}
              </div>
              <Button asChild variant="link" className="mt-2 h-auto px-0">
                <Link to="/agendar" search={{ barbeiro: b.id }}>Agendar com {b.name.split(" ")[0]} →</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { n: "01", title: "Escolha o serviço", text: "Corte, barba ou o combo completo." },
    { n: "02", title: "Escolha barbeiro e horário", text: "Veja apenas horários realmente livres." },
    { n: "03", title: "Confirme e pronto", text: "Receba um código para consultar sua reserva." },
  ];
  return (
    <section className="border-y border-border bg-sidebar">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <SectionTitle eyebrow="Como funciona" title="Agendar é simples" />
        <ol className="grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n}>
              <span className="font-display text-5xl text-primary/70">{s.n}</span>
              <h3 className="mt-2 text-2xl font-semibold">{s.title}</h3>
              <p className="mt-1 text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
        <Button asChild size="lg" className="mt-10"><Link to="/agendar">AGENDAR MEU CORTE</Link></Button>
      </div>
    </section>
  );
}

export function Testimonials() {
  const items = [
    { name: "Cliente exemplo A", text: "Atendimento pontual e o degradê ficou impecável." },
    { name: "Cliente exemplo B", text: "Agendei pelo celular em segundos. Muito prático." },
    { name: "Cliente exemplo C", text: "Ambiente top e barba feita com toalha quente." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <SectionTitle eyebrow="Depoimentos" title="O que dizem nossos clientes" />
      <p className="-mt-6 mb-8 text-xs text-muted-foreground">Depoimentos fictícios, apenas para demonstração.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((t) => (
          <figure key={t.name} className="rounded-lg border border-border bg-card p-6">
            <Quote className="h-5 w-5 text-primary" aria-hidden />
            <blockquote className="mt-3 font-display text-xl leading-snug">“{t.text}”</blockquote>
            <figcaption className="mt-4 text-sm text-muted-foreground">— {t.name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function ContactSection() {
  const { settings } = useAppState();
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <SectionTitle eyebrow="Contato" title="Venha nos visitar" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6">
          <MapPin className="h-5 w-5 text-primary" aria-hidden />
          <h3 className="mt-3 text-xl font-semibold">Endereço</h3>
          <p className="mt-1 text-sm text-muted-foreground">{settings.address}<br />{settings.city}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <Clock className="h-5 w-5 text-primary" aria-hidden />
          <h3 className="mt-3 text-xl font-semibold">Horário</h3>
          <p className="mt-1 text-sm text-muted-foreground">{settings.openingHoursText}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <Phone className="h-5 w-5 text-primary" aria-hidden />
          <h3 className="mt-3 text-xl font-semibold">Telefone</h3>
          <p className="mt-1 text-sm text-muted-foreground">{settings.phone}</p>
          <Button asChild className="mt-4 w-full bg-success text-primary-foreground hover:bg-success/90">
            <a href={waLink(settings.whatsapp, "Olá! Gostaria de mais informações.")} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function PageHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="border-b border-border bg-sidebar">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-semibold md:text-6xl">{title}</h1>
        {text && <p className="mt-3 max-w-xl text-muted-foreground">{text}</p>}
      </div>
    </div>
  );
}
