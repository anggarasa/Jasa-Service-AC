'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: number;
  label: string;
}

interface BookingStepperProps {
  currentStep: number;
  steps: StepItem[];
  onStepClick?: (step: number) => void;
}

export function BookingStepper({ currentStep, steps, onStepClick }: BookingStepperProps) {
  return (
    <div className="w-full py-4 mb-6">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-slate-200 z-0" />
        <div
          className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-primary transition-all duration-300 z-0"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center z-10 cursor-pointer select-none"
              onClick={() => {
                if (isCompleted && onStepClick) {
                  onStepClick(step.id);
                }
              }}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200 ${
                  isCompleted
                    ? 'bg-primary text-white shadow-md'
                    : isCurrent
                    ? 'bg-white border-2 border-primary text-primary shadow-lg ring-4 ring-primary/20'
                    : 'bg-slate-100 border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.id}
              </div>
              <span
                className={`text-xs mt-2 font-medium hidden md:block text-center max-w-[80px] ${
                  isCurrent ? 'text-primary font-bold' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
