import { Link } from "@tanstack/react-router";
import { Menu, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/lib/barbearia/store";
import { waLink } from "@/lib/barbearia/format";
import { Logo } from "./common";

const nav = [
  { to: "/", label: "Início" },
  { to: "/servicos", label: "Serviços" },
  { to: "/profissionais", label: "Profissionais" },
  { to: "/meus-agendamentos", label: "Meus agendamentos" },
  { to: "/contato", label: "Contato" },
] as const;

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const { settings } = useAppState();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" aria-label="Página inicial">
            <Logo name={settings.name} logoUrl={settings.logoUrl} />
          </Link>
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Principal">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
                activeOptions={{ exact: true }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/agendar">Agendar meu corte</Link>
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open}>
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        {open && (
          <nav className="animate-fade-up border-t border-border px-4 py-4 lg:hidden" aria-label="Menu móvel">
            <ul className="space-y-1">
              {nav.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2.5 hover:bg-accent">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-3 w-full">
              <Link to="/agendar" onClick={() => setOpen(false)}>AGENDAR MEU CORTE</Link>
            </Button>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-sidebar">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo name={settings.name} logoUrl={settings.logoUrl} />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">{settings.welcomeMessage}</p>
          </div>
          <div className="text-sm">
            <p className="eyebrow mb-3">Visite</p>
            <p className="text-muted-foreground">{settings.address}</p>
            <p className="text-muted-foreground">{settings.city}</p>
            <p className="mt-2 text-muted-foreground">{settings.phone}</p>
          </div>
          <div className="text-sm">
            <p className="eyebrow mb-3">Links</p>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/agendar" className="hover:text-foreground">Agendar horário</Link></li>
              <li><Link to="/meus-agendamentos" className="hover:text-foreground">Meus agendamentos</Link></li>
              <li><a href={waLink(settings.whatsapp)} target="_blank" rel="noreferrer" className="hover:text-foreground">WhatsApp</a></li>
              <li><a href={settings.instagram} target="_blank" rel="noreferrer" className="hover:text-foreground">Instagram</a></li>
            </ul>
          </div>
        </div>
        <p className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {settings.name}. Todos os direitos reservados.
        </p>
      </footer>

      <a
        href={waLink(settings.whatsapp, "Olá! Gostaria de mais informações.")}
        target="_blank"
        rel="noreferrer"
        aria-label="Conversar no WhatsApp"
        className="fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-success text-primary-foreground shadow-elegant transition-transform hover:scale-105"
      >
        <MessageCircle className="h-5 w-5" />
      </a>
    </div>
  );
}
