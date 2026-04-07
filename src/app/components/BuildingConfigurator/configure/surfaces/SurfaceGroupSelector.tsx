// Right-column overview panel for the Configure view.
// Shows Building, surface group summary cards, and Technologies.
// Clicking a group opens a detailed surface grid in the center panel.
// Individual surface rows are no longer shown here — the panel is intentionally passive.

import { useState } from 'react';
import { ChevronLeft, Building2, Sun, Battery, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ELEMENT_DOTS } from '@/app/components/BuildingConfigurator/shared/ui';
import type { BuildingElement } from '@/app/components/BuildingConfigurator/configure/model/buildingElements';
import {
  ELEMENT_GROUP_LABELS,
  type ElementGroupKey,
} from '@/app/components/BuildingConfigurator/shared/elementListUtils';
import { detectRoofType } from '@/app/components/BuildingConfigurator/configure/roof/RoofTypeGallery';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_ORDER: ElementGroupKey[] = ['wall', 'roof', 'floor', 'window', 'door'];

/** Surface types available via the "+ New" menu. */
const CREATE_OPTIONS: Array<{ type: BuildingElement['type']; label: string; detail: string }> = [
  { type: 'wall',   label: 'Wall',   detail: 'Vertical opaque surface' },
  { type: 'window', label: 'Window', detail: 'Transparent facade opening' },
  { type: 'door',   label: 'Door',   detail: 'Opaque entrance opening' },
  { type: 'roof',   label: 'Roof',   detail: 'Top envelope surface' },
  { type: 'floor',  label: 'Floor',  detail: 'Ground-contact surface' },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface SurfaceGroupSelectorProps {
  elements: Record<string, BuildingElement>;
  /** The group type currently shown in the center panel — drives highlight state. */
  activeGroupType: ElementGroupKey | null;
  /** Called when the user clicks a group card. */
  onSelectGroupType: (type: ElementGroupKey) => void;
  /** Called when the user picks a surface type from the "+ New" menu. */
  onCreateSurface: (type: BuildingElement['type']) => void;
  /** Short subtitle shown under "Building" — e.g. "Single-family House · 500 m²". */
  buildingSubtitle?: string;
  /** Whether the "Building" card is the active center panel. */
  buildingSelected: boolean;
  onSelectBuilding: () => void;
  /** Whether the configure center panel is showing the PV surface manager. */
  pvSelected?: boolean;
  /** Count of surfaces with PV installed. */
  pvSurfaceCount?: number;
  /** Total PV capacity across configured surfaces. */
  pvCapacityKw?: number;
  onSelectTechnologyPv?: () => void;
  /** Whether the configure center panel is showing the battery editor. */
  batterySelected?: boolean;
  /** Whether a battery system is marked as installed. */
  batteryInstalled?: boolean;
  onSelectTechnologyBattery?: () => void;
}

/** Read-only overview panel listing Building, surface group cards, and Technologies. */
export function SurfaceGroupSelector({
  elements,
  activeGroupType,
  onSelectGroupType,
  onCreateSurface,
  buildingSubtitle,
  buildingSelected,
  onSelectBuilding,
  pvSelected = false,
  pvSurfaceCount = 0,
  pvCapacityKw = 0,
  onSelectTechnologyPv,
  batterySelected = false,
  batteryInstalled = false,
  onSelectTechnologyBattery,
}: SurfaceGroupSelectorProps) {
  const [showCreate, setShowCreate] = useState(false);

  const typeGroups = TYPE_ORDER
    .map((type) => ({
      type,
      items: Object.values(elements).filter((el) => el.type === type),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-1.5 px-2 py-2">

      {/* ── Building card ── */}
      <button
        type="button"
        onClick={onSelectBuilding}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all cursor-pointer',
          buildingSelected
            ? 'border-primary/40 bg-primary/10 shadow-sm shadow-primary/10'
            : 'border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow',
        )}
      >
        <ChevronLeft className={cn('size-3.5 shrink-0', buildingSelected ? 'text-primary' : 'text-slate-300')} />
        <div className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg',
          buildingSelected ? 'bg-primary/15' : 'bg-slate-100',
        )}>
          <Building2 className={cn('size-4', buildingSelected ? 'text-primary' : 'text-slate-500')} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('text-[12px] font-semibold leading-tight', buildingSelected ? 'text-primary' : 'text-slate-700')}>
            Building
          </p>
          {buildingSubtitle && (
            <p className={cn('mt-0.5 truncate text-[10px]', buildingSelected ? 'text-primary/70' : 'text-slate-400')}>
              {buildingSubtitle}
            </p>
          )}
        </div>
      </button>

      {/* ── SURFACES section header ── */}
      <div className="flex items-center justify-between px-1 pt-1">
        <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">
          Surfaces
        </p>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors cursor-pointer',
            showCreate
              ? 'bg-slate-200 text-slate-700'
              : 'bg-primary/10 text-primary hover:bg-primary/15',
          )}
        >
          {showCreate ? <X className="size-3" /> : <Plus className="size-3" />}
          New
        </button>
      </div>

      {/* Create-surface dropdown */}
      {showCreate && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {CREATE_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              type="button"
              onClick={() => { onCreateSurface(opt.type); setShowCreate(false); }}
              className="flex w-full flex-col px-3 py-2 text-left transition-colors hover:bg-slate-50 border-b border-slate-100 last:border-0 cursor-pointer"
            >
              <span className="text-[10px] font-semibold text-slate-700">{opt.label}</span>
              <span className="text-[9px] text-slate-400">{opt.detail}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Group summary cards ── */}
      {typeGroups.map(({ type, items }) => {
        const isActive    = activeGroupType === type;
        const totalArea   = items.reduce((s, el) => s + el.area, 0);
        const dotColor    = ELEMENT_DOTS[type];
        const roofType    = type === 'roof' ? detectRoofType(items) : null;
        const roofLabel   = roofType
          ? roofType.charAt(0).toUpperCase() + roofType.slice(1)
          : null;

        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelectGroupType(type)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all cursor-pointer',
              isActive
                ? 'border-primary/40 bg-primary/10 shadow-sm shadow-primary/10'
                : 'border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow',
            )}
          >
            <ChevronLeft className={cn('size-3 shrink-0', isActive ? 'text-primary' : 'text-slate-300')} />
            <span className={cn(
              'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold',
              isActive ? 'bg-primary/15 text-primary' : 'bg-slate-100 text-slate-500',
            )}>
              {items.length}
            </span>
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: dotColor }}
            />
            <div className="min-w-0 flex-1">
              <p className={cn(
                'text-[11px] font-semibold leading-tight',
                isActive ? 'text-primary' : 'text-slate-700',
              )}>
                {ELEMENT_GROUP_LABELS[type]}
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5">
                {roofLabel ? `${roofLabel} · ${totalArea.toFixed(0)} m²` : `${totalArea.toFixed(0)} m²`}
              </p>
            </div>
          </button>
        );
      })}

      {/* ── Technologies section ── */}
      {onSelectTechnologyPv && (
        <>
          <div className="px-1 pt-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Technologies
            </p>
          </div>

          <button
            type="button"
            onClick={onSelectTechnologyPv}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all cursor-pointer',
              pvSelected
                ? 'border-primary/40 bg-primary/10 shadow-sm shadow-primary/10'
                : 'border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow',
            )}
          >
            <ChevronLeft className={cn('size-3 shrink-0', pvSelected ? 'text-primary' : 'text-slate-300')} />
            {pvSurfaceCount > 0 && (
              <span className={cn(
                'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold',
                pvSelected ? 'bg-primary/15 text-primary' : 'bg-slate-100 text-slate-500',
              )}>
                {pvSurfaceCount}
              </span>
            )}
            <Sun className={cn('size-3.5 shrink-0', pvSelected ? 'text-primary' : 'text-yellow-500')} />
            <div className="min-w-0 flex-1">
              <p className={cn('text-[11px] font-semibold', pvSelected ? 'text-primary' : 'text-slate-700')}>
                Solar PV
              </p>
              <p className="text-[9px] text-slate-400">
                {pvSurfaceCount > 0
                  ? `${pvSurfaceCount} ${pvSurfaceCount === 1 ? 'surface' : 'surfaces'} · ${pvCapacityKw.toFixed(1)} kWp`
                  : 'No surfaces configured'}
              </p>
            </div>
          </button>

          {onSelectTechnologyBattery && (
            <button
              type="button"
              onClick={onSelectTechnologyBattery}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all cursor-pointer',
                batterySelected
                  ? 'border-primary/40 bg-primary/10 shadow-sm shadow-primary/10'
                  : 'border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow',
              )}
            >
              <ChevronLeft className={cn('size-3 shrink-0', batterySelected ? 'text-primary' : 'text-slate-300')} />
              {batteryInstalled && (
                <span className={cn(
                  'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold',
                  batterySelected ? 'bg-primary/15 text-primary' : 'bg-slate-100 text-slate-500',
                )}>
                  ●
                </span>
              )}
              <Battery className={cn('size-3.5 shrink-0', batterySelected ? 'text-primary' : 'text-blue-500')} />
              <div className="min-w-0 flex-1">
                <p className={cn('text-[11px] font-semibold', batterySelected ? 'text-primary' : 'text-slate-700')}>
                  Battery Storage
                </p>
                <p className="text-[9px] text-slate-400">
                  {batteryInstalled ? 'Installed' : 'Not configured'}
                </p>
              </div>
            </button>
          )}
        </>
      )}

    </div>
  );
}
