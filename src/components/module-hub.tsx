import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type Tone = "blue" | "amber" | "rose" | "emerald" | "violet" | "sky" | "orange" | "slate";

const TONES: Record<Tone, { bg: string; fg: string; ring: string }> = {
  blue:    { bg: "bg-blue-100",    fg: "text-blue-600",    ring: "ring-blue-200/60" },
  amber:   { bg: "bg-amber-100",   fg: "text-amber-600",   ring: "ring-amber-200/60" },
  rose:    { bg: "bg-rose-100",    fg: "text-rose-600",    ring: "ring-rose-200/60" },
  emerald: { bg: "bg-emerald-100", fg: "text-emerald-600", ring: "ring-emerald-200/60" },
  violet:  { bg: "bg-violet-100",  fg: "text-violet-600",  ring: "ring-violet-200/60" },
  sky:     { bg: "bg-sky-100",     fg: "text-sky-600",     ring: "ring-sky-200/60" },
  orange:  { bg: "bg-orange-100",  fg: "text-orange-600",  ring: "ring-orange-200/60" },
  slate:   { bg: "bg-slate-100",   fg: "text-slate-600",   ring: "ring-slate-200/60" },
};

export type HubStat = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone: Tone;
};

export type HubItem = {
  to?: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  tone: Tone;
  ready?: boolean;
};

export function ModuleHub({
  title,
  subtitle,
  stats,
  items,
}: {
  title: string;
  subtitle?: string;
  stats?: HubStat[];
  items: HubItem[];
}) {
  return (
    <div className="space-y-8 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </header>

      {stats && stats.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} stat={s} />
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ModuleCard key={item.title} item={item} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ stat }: { stat: HubStat }) {
  const tone = TONES[stat.tone];
  const Icon = stat.icon;
  return (
    <Card className="overflow-hidden rounded-2xl border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-4",
            tone.bg,
            tone.ring,
          )}
        >
          <Icon className={cn("h-6 w-6", tone.fg)} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {stat.label}
          </p>
          <p className="truncate text-2xl font-bold text-foreground">{stat.value}</p>
          {stat.hint && <p className="truncate text-xs text-muted-foreground">{stat.hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function ModuleCard({ item }: { item: HubItem }) {
  const tone = TONES[item.tone];
  const Icon = item.icon;
  const disabled = item.ready === false || !item.to;

  const inner = (
    <Card
      className={cn(
        "group h-full overflow-hidden rounded-2xl border-border/60 bg-card transition-all",
        disabled
          ? "opacity-60"
          : "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg",
      )}
    >
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl ring-4",
              tone.bg,
              tone.ring,
            )}
          >
            <Icon className={cn("h-6 w-6", tone.fg)} />
          </div>
          {!disabled && (
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
          )}
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold leading-tight text-foreground">{item.title}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
        </div>
        <div className="mt-auto pt-2 text-xs font-medium text-muted-foreground">
          {disabled ? "Em construção" : "Abrir módulo →"}
        </div>
      </CardContent>
    </Card>
  );

  if (disabled) return <div>{inner}</div>;
  return <Link to={item.to!}>{inner}</Link>;
}
