import { Baby, Eye, Scissors, Sparkles, SprayCan, Zap, type LucideIcon } from "lucide-react";
import type { AppointmentStatus, ServiceIcon as IconKey } from "@/lib/barbearia/types";
import { statusClass, statusLabel } from "@/lib/barbearia/format";
import { cn } from "@/lib/utils";

const icons: Record<IconKey, LucideIcon> = {
  scissors: Scissors,
  fade: Zap,
  baby: Baby,
  beard: SprayCan,
  combo: Sparkles,
  eye: Eye,
};

export function ServiceIcon({ icon, className }: { icon: IconKey; className?: string }) {
  const I = icons[icon] ?? Scissors;
  return <I className={cn("h-5 w-5", className)} aria-hidden />;
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", statusClass[status])}>
      {statusLabel[status]}
    </span>
  );
}

export function Logo({ name, logoUrl }: { name: string; logoUrl?: string | undefined }) {
  return (
    <span className="flex items-center gap-2.5">
      {logoUrl ? (
        <img src={logoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
      ) : (
        <span className="grid h-9 w-9 place-items-center rounded-full border border-primary/60 text-primary">
          <Scissors className="h-4 w-4" aria-hidden />
        </span>
      )}
      <span className="font-display text-xl font-semibold leading-none tracking-wide">{name}</span>
    </span>
  );
}

export function EmptyState({ icon: I, title, text, children }: { icon: LucideIcon; title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-12 text-center">
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-muted text-primary">
        <I className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="text-xl font-semibold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-4xl font-semibold md:text-5xl">{title}</h2>
      {text && <p className="mt-3 text-muted-foreground">{text}</p>}
    </div>
  );
}
