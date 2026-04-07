import { cn } from "@/lib/utils";
import type { PriorityBand } from "@/types/evaluation";
import { bandColor, bandLabel } from "@/lib/scoring";

interface BadgeProps {
  children?: React.ReactNode;
  variant?: "default" | "outline" | "success" | "warning" | "danger" | "muted";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-brand/10 text-brand-dark",
    outline: "border border-current bg-transparent text-gray-600",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    muted: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Priority band chip
export function PriorityChip({ band, score }: { band: PriorityBand; score?: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        bandColor(band)
      )}
    >
      {bandLabel(band)}
      {score !== undefined && band !== "na" && (
        <span className="opacity-70">({score.toFixed(1)})</span>
      )}
    </span>
  );
}

// Risk severity chip
export function RiskChip({ label, score }: { label: string; score?: number }) {
  const colors: Record<string, string> = {
    Neutral: "bg-gray-100 text-gray-600",
    Sustainable: "bg-green-100 text-green-700",
    Moderate: "bg-amber-100 text-amber-700",
    Severe: "bg-red-100 text-red-700",
    Critical: "bg-red-900/10 text-red-900 font-bold",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", colors[label] ?? "bg-gray-100 text-gray-500")}>
      {label}
      {score !== undefined && <span className="opacity-70">({score})</span>}
    </span>
  );
}

// Opportunity chip
export function OpportunityChip({ label, score }: { label: string; score?: number }) {
  const colors: Record<string, string> = {
    Neutral: "bg-gray-100 text-gray-600",
    Small: "bg-emerald-50 text-emerald-700",
    Reasonable: "bg-green-100 text-green-700",
    Sustainable: "bg-zeeus-green3/15 text-zeeus-green3",
    Great: "bg-brand/15 text-brand-dark font-bold",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", colors[label] ?? "bg-gray-100 text-gray-500")}>
      {label}
      {score !== undefined && <span className="opacity-70">({score})</span>}
    </span>
  );
}

// Status chip
export function StatusChip({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
  };
  const labels: Record<string, string> = {
    draft: "Draft",
    in_progress: "In Progress",
    completed: "Completed",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", colors[status] ?? "bg-gray-100 text-gray-500")}>
      {labels[status] ?? status}
    </span>
  );
}

// Confidence band chip
export function ConfidenceChip({ level }: { level: "High" | "Moderate" | "Low" }) {
  const colors = {
    High: "bg-green-100 text-green-700",
    Moderate: "bg-amber-100 text-amber-700",
    Low: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", colors[level])}>
      {level} Confidence
    </span>
  );
}
