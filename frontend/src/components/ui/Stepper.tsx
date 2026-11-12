'use client';

import { ReactNode } from 'react';
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
        {/* Connecting line */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700" />

        <div className="relative flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              {/* Step Circle */}
              <div className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300',
                step.id < currentStep
                  ? 'bg-primary border-primary text-primary-foreground'
                  : step.id === currentStep
                  ? 'bg-background border-primary text-primary ring-4 ring-primary/20'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
              )}>
                {step.id < currentStep ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.icon
                )}
              </div>

              {/* Step Title */}
              <span className={cn(
                'mt-2 text-sm font-medium text-center max-w-[100px]',
                step.id <= currentStep
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-gray-500 dark:text-gray-400'
              )}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}