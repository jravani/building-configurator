// Numeric input with increment/decrement arrow buttons.

import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

function formatSteppedValue(value: number, step: number): string {
  const decimals = `${step}`.includes('.') ? `${step}`.split('.')[1].length : 0;
  return value.toFixed(decimals);
}

function clampSteppedValue(value: number, min?: number, max?: number): number {
  const lower = min ?? Number.NEGATIVE_INFINITY;
  const upper = max ?? Number.POSITIVE_INFINITY;
  return Math.min(upper, Math.max(lower, value));
}

interface StepperNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  step: number;
  min?: number;
  max?: number;
}

/** Text input with ▲/▼ buttons that increment/decrement by `step`. */
export function StepperNumberInput({ value, onChange, step, min, max }: StepperNumberInputProps) {
  const adjust = (direction: 1 | -1) => {
    const current  = Number(value);
    const fallback = min ?? 0;
    const next = clampSteppedValue(
      (Number.isFinite(current) ? current : fallback) + direction * step,
      min,
      max,
    );
    onChange(formatSteppedValue(next, step));
  };

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[4px] border border-slate-200 bg-white px-1.5 py-1 pr-7 text-[11px] text-foreground outline-none focus:border-slate-300"
      />
      <div className="absolute inset-y-0 right-0 flex w-5 flex-col border-l border-slate-200 bg-slate-50/90">
        <button
          type="button"
          onClick={() => adjust(1)}
          className="flex flex-1 items-center justify-center text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Increase value"
        >
          <ChevronUp className="size-3" />
        </button>
        <button
          type="button"
          onClick={() => adjust(-1)}
          className="flex flex-1 items-center justify-center border-t border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Decrease value"
        >
          <ChevronDown className="size-3" />
        </button>
      </div>
    </div>
  );
}
