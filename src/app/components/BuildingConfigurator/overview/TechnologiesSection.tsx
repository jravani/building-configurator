// Toggle grid for building-level technologies (PV, battery, heat pump, EV charger).

import React, { useState } from 'react';
import { Sun, Battery, Thermometer, Plug } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Technology {
  id: string;
  label: string;
  Icon: React.ElementType;
  installed: boolean;
  capacity: string | null;
}

const DEFAULT_TECHNOLOGIES: Technology[] = [
  { id: 'solar_pv',   label: 'Solar PV',   Icon: Sun,         installed: false, capacity: null },
  { id: 'battery',    label: 'Battery',    Icon: Battery,     installed: false, capacity: null },
  { id: 'heat_pump',  label: 'Heat Pump',  Icon: Thermometer, installed: false, capacity: null },
  { id: 'ev_charger', label: 'EV Charger', Icon: Plug,        installed: false, capacity: null },
];

/** Grid of technology cards. Each card toggles installed/not-installed on click. */
export function TechnologiesSection() {
  const [techs, setTechs] = useState<Technology[]>(DEFAULT_TECHNOLOGIES);

  const toggle = (id: string) =>
    setTechs((prev) => prev.map((t) => (t.id === id ? { ...t, installed: !t.installed } : t)));

  return (
    <div className="grid grid-cols-2 gap-2">
      {techs.map(({ id, label, Icon, installed }) => (
        <button
          key={id}
          type="button"
          onClick={() => toggle(id)}
          className={cn(
            'flex flex-col items-start gap-2 rounded-lg border px-3 py-3 text-left transition-colors',
            installed
              ? 'border-slate-300 bg-slate-700 shadow-[0_1px_3px_rgba(15,23,42,0.10),0_4px_12px_rgba(15,23,42,0.12)]'
              : 'border-slate-200/60 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.07)] hover:bg-slate-50',
          )}
        >
          <div className={cn(
            'flex size-7 items-center justify-center rounded-md',
            installed ? 'bg-white/15' : 'bg-slate-100',
          )}>
            <Icon className={cn('size-4', installed ? 'text-white' : 'text-slate-500')} />
          </div>
          <div>
            <p className={cn('text-[11px] font-semibold leading-tight', installed ? 'text-white' : 'text-foreground')}>
              {label}
            </p>
            <p className={cn('mt-0.5 text-[10px]', installed ? 'text-slate-300' : 'text-slate-400')}>
              {installed ? 'Installed' : 'Not installed'}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
