// Left column of the Overview view: building identity, energy totals, key metrics.

import React from 'react';
import { AlertTriangle, Zap, Flame, Droplets } from 'lucide-react';
import type { EnergyTotals } from './LoadProfileViewer';
import { SnapshotStatus, SnapshotStatusBadge } from '../shared/snapshotUtils';
import { TechnologiesSection } from './TechnologiesSection';

export interface BuildingSnapshotAsideProps {
  mode: 'basic' | 'expert';
  energyTotals: EnergyTotals;
  snapshotRows: Array<{ label: string; value: string; status: SnapshotStatus }>;
  thermalRating: { label: string; color: string; bg: string };
  avgUValue: number;
  thermalEfficiencyStatus: SnapshotStatus;
}

/** Left panel of the overview: snapshot identity, energy summary, and installed technologies. */
export function BuildingSnapshotAside({
  mode,
  energyTotals,
  snapshotRows,
  thermalRating,
  avgUValue,
  thermalEfficiencyStatus,
}: BuildingSnapshotAsideProps) {
  return (
    <aside className="min-h-0 overflow-y-auto border-r border-border/80 bg-slate-200 p-4">
      <div className="flex flex-col gap-4">
        {/* Title */}
        <div className="flex items-start justify-between gap-3 px-1 pt-1">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Building Snapshot</p>
            <p className="mt-1 text-lg font-semibold text-foreground">Building 3</p>
            <p className="text-sm text-slate-500">Multi-Family House</p>
          </div>
          <div className="rounded-md bg-slate-700 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
            {mode}
          </div>
        </div>

        {/* Data-quality warning */}
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 shadow-[0_10px_24px_rgba(245,158,11,0.08)]">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">Public Data Estimate</p>
              <p className="mt-1 text-[11px] leading-snug text-amber-900">
                Current building information is based on publicly available data and may not reflect the real values. Use Configure mode to update this information and improve model quality.
              </p>
              <div className="mt-2 flex flex-col gap-1.5 text-[10px] text-amber-800">
                <div className="flex items-center gap-2">
                  <SnapshotStatusBadge status="default" />
                  <span>Matches the default estimate</span>
                </div>
                <div className="flex items-center gap-2">
                  <SnapshotStatusBadge status="modified" />
                  <span>Changed from the default estimate</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Energy consumption — icon-identified cards */}
        <div className="grid grid-cols-3 gap-2">
          {([
            { label: 'Electricity', value: energyTotals.electricity, Icon: Zap      },
            { label: 'Heating',     value: energyTotals.heating,     Icon: Flame     },
            { label: 'Hot Water',   value: energyTotals.hotwater,    Icon: Droplets  },
          ] as const).map(({ label, value, Icon }) => (
            <div key={label} className="rounded-md border border-slate-200/60 bg-white px-3 py-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.07)]">
              <div className="mb-1 flex items-center gap-1.5">
                <Icon className="size-3 shrink-0 text-slate-500" />
                <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              </div>
              <p className="text-base font-bold leading-none text-foreground">{value}</p>
              <p className="mt-0.5 text-[10px] text-slate-400">{energyTotals.unit}</p>
            </div>
          ))}
        </div>

        {/* Building info table */}
        <div className="overflow-hidden rounded-md border border-slate-200/60 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.07)]">
          <table className="w-full text-[11px]">
            <tbody className="divide-y divide-slate-100">
              {snapshotRows.map(({ label, value, status }) => (
                <tr key={label}>
                  <td className="px-3 py-1.5 text-slate-400">{label}</td>
                  <td className="px-3 py-1.5 text-right font-medium text-foreground">
                    <div className="flex items-center justify-end gap-2">
                      <span>{value}</span>
                      <SnapshotStatusBadge status={status} />
                    </div>
                  </td>
                </tr>
              ))}
              {/* Thermal efficiency — value shown only in expert mode */}
              <tr>
                <td className="px-3 py-1.5 text-slate-400">Thermal efficiency</td>
                <td className="px-3 py-1.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span
                      className="inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold"
                      style={{ color: thermalRating.color, background: thermalRating.bg }}
                    >
                      {thermalRating.label}
                    </span>
                    <SnapshotStatusBadge status={thermalEfficiencyStatus} />
                    {mode === 'expert' && (
                      <span className="text-[10px] text-slate-400">{avgUValue.toFixed(2)} W/m²K</span>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Technologies */}
        <div>
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Technologies</p>
          <TechnologiesSection />
        </div>
      </div>
    </aside>
  );
}
