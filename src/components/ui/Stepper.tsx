import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface Step {
  id: string;
  label: string;
  shortLabel?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number; // 0-indexed
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <nav aria-label="Evaluation progress" className={cn("w-full", className)}>
      <ol className="flex items-center w-full">
        {steps.map((step, index) => {
          const isDone = index < currentStep;
          const isActive = index === currentStep;
          const isPending = index > currentStep;
          const isLast = index === steps.length - 1;

          return (
            <li key={step.id} className={cn("flex items-center", !isLast && "flex-1")}>
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold border-2 transition-all duration-300",
                    isDone && "bg-brand border-brand text-white",
                    isActive && "bg-brand-dark border-brand-dark text-white shadow-focus",
                    isPending && "bg-white border-surface-border text-gray-400"
                  )}
                >
                  {isDone ? <Check size={14} strokeWidth={3} /> : <span>{index + 1}</span>}
                </div>
                <span
                  className={cn(
                    "mt-1.5 text-xs font-medium text-center max-w-[80px] leading-tight hidden sm:block",
                    isActive && "text-brand-dark",
                    isDone && "text-brand",
                    isPending && "text-gray-400"
                  )}
                >
                  {step.shortLabel ?? step.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className={cn("flex-1 h-0.5 mx-2 rounded-full transition-all duration-300", isDone ? "bg-brand" : "bg-surface-border")} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Compact pill stepper for mobile/narrow spaces
export function PillStepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i < currentStep && "bg-brand w-3",
            i === currentStep && "bg-brand-dark w-6",
            i > currentStep && "bg-surface-border w-3"
          )}
        />
      ))}
    </div>
  );
}
