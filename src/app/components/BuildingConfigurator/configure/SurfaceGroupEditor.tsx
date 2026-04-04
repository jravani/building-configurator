// Editing panel for a selected surface face group.
// Displays shared properties (U-value) for all elements in the group and lets the
// user update them. A change to U-value applies to every element in the group.

import { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ELEMENT_DOTS } from '../shared/ui';
import type { FaceGroup } from './BuildingVisualization';
import type { FaceGroupSummary } from '../shared/elementListUtils';

interface SurfaceGroupEditorProps {
  selectedGroup: FaceGroup | null;
  groups: FaceGroupSummary[];
  onUpdateGroup: (group: FaceGroup, uValue: number) => void;
}

// ─── Editable field ───────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: number;
  unit: string;
  editable?: boolean;
  onSave?: (v: number) => void;
}

/** Single row: label on the left, value + optional inline edit on the right. */
function EditableField({ label, value, unit, editable, onSave }: FieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value.toFixed(2));

  // Reset draft when the underlying value changes (e.g. user selects a different group).
  useEffect(() => {
    setDraft(value.toFixed(2));
    setEditing(false);
  }, [value]);

  const commit = () => {
    const n = parseFloat(draft);
    if (Number.isFinite(n) && n > 0) onSave?.(n);
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
      <span className="text-[11px] text-slate-500">{label}</span>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            step="0.01"
            min="0.01"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter')  { e.preventDefault(); commit(); }
              if (e.key === 'Escape') { setEditing(false); setDraft(value.toFixed(2)); }
            }}
            onBlur={commit}
            className="w-20 rounded border border-blue-300 bg-white px-2 py-0.5 text-right text-[11px] font-medium text-slate-700 outline-none ring-1 ring-blue-200 focus:ring-blue-400"
          />
          <span className="text-[10px] text-muted-foreground">{unit}</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => editable && setEditing(true)}
          title={editable ? 'Click to edit' : undefined}
          className={cn(
            'flex items-baseline gap-1.5 rounded px-1',
            editable ? 'cursor-pointer hover:bg-slate-100' : 'cursor-default',
          )}
        >
          <span className="text-[12px] font-semibold text-slate-800">{value.toFixed(2)}</span>
          <span className="text-[10px] text-muted-foreground">{unit}</span>
          {editable && <span className="ml-0.5 text-[9px] text-primary/50">edit</span>}
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/** Shows properties for the selected surface face group and allows editing. */
export function SurfaceGroupEditor({ selectedGroup, groups, onUpdateGroup }: SurfaceGroupEditorProps) {
  const summary = selectedGroup
    ? groups.find((g) => g.type === selectedGroup.type && g.face === selectedGroup.face) ?? null
    : null;

  if (!selectedGroup || !summary) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
          <Layers className="size-5 text-slate-300" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-600">No surface selected</p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            Click a face in the 3D preview or pick a group from the list on the right.
          </p>
        </div>
      </div>
    );
  }

  const dotColor = ELEMENT_DOTS[summary.type];

  return (
    <div className="flex h-full flex-col overflow-y-auto p-5">

      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${dotColor}22` }}
        >
          <span className="size-3.5 rounded-full" style={{ backgroundColor: dotColor }} />
        </div>
        <div>
          <p className="text-base font-bold text-slate-800">{summary.label}</p>
          <p className="text-[11px] text-muted-foreground">
            {summary.count} element{summary.count !== 1 ? 's' : ''} · {summary.totalArea.toFixed(1)} m² total
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-5 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400">Elements</p>
          <p className="mt-0.5 text-xl font-bold text-slate-700">{summary.count}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400">Total area</p>
          <p className="mt-0.5 text-xl font-bold text-slate-700">
            {summary.totalArea.toFixed(1)}
            <span className="ml-1 text-[11px] font-normal text-muted-foreground">m²</span>
          </p>
        </div>
      </div>

      {/* Thermal properties */}
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-1 shadow-sm">
        <p className="pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          Thermal properties
        </p>
        <EditableField
          label="U-value"
          value={summary.avgUValue}
          unit="W/m²K"
          editable
          onSave={(v) => onUpdateGroup(selectedGroup, v)}
        />
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground/60">
        U-value change applies to all {summary.count} element{summary.count !== 1 ? 's' : ''} in this group.
      </p>

    </div>
  );
}
