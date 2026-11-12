'use client';

import { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepperStep {
  id: number;
  title: string;
  icon: ReactNode;
}

interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="relative">
        {/* Connecting background line */}
        <div
          className="absolute top-4 left-6 right-6 h-0.5 bg-stone-200 dark:bg-stone-800 -z-0"
          aria-hidden="true"
        />

        <div className="relative flex items-center justify-between z-10">
          {steps.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center">
                {/* Step Circle */}
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors select-none',
                    isCompleted
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : isCurrent
                      ? 'bg-background border-2 border-primary text-primary ring-2 ring-primary/15 shadow-sm'
                      : 'bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 stroke-[2]" aria-hidden="true" />
                  ) : (
                    step.icon || step.id
                  )}
                </div>

                {/* Step Title */}
                <span
                  className={cn(
                    'mt-2 text-xs text-center max-w-[90px] leading-tight',
                    isCurrent
                      ? 'text-stone-900 dark:text-stone-100 font-medium'
                      : isCompleted
                      ? 'text-stone-700 dark:text-stone-300 font-normal'
                      : 'text-stone-400 dark:text-stone-500 font-normal'
                  )}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
