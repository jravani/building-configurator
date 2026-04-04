// Narrow vertical list of surface face groups for the Configure view right column.
// Clicking a group selects it for the SurfaceGroupEditor panel.

import { cn } from '@/lib/utils';
import { ELEMENT_DOTS } from '../shared/ui';
import type { FaceGroup } from './BuildingVisualization';
import type { FaceGroupSummary } from '../shared/elementListUtils';

interface SurfaceGroupSelectorProps {
  groups: FaceGroupSummary[];
  selectedGroup: FaceGroup | null;
  onSelect: (group: FaceGroup) => void;
}

function groupsMatch(a: FaceGroup | null, b: FaceGroup): boolean {
  return a !== null && a.type === b.type && a.face === b.face;
}

/** Scrollable list of all face groups. Designed for a ~176px wide sidebar column. */
export function SurfaceGroupSelector({ groups, selectedGroup, onSelect }: SurfaceGroupSelectorProps) {
  return (
    <div className="flex flex-col gap-0.5 p-2">
      {groups.map((g) => {
        const group: FaceGroup = { type: g.type, face: g.face };
        const selected = groupsMatch(selectedGroup, group);
        return (
          <button
            key={`${g.type}::${g.face}`}
            type="button"
            onClick={() => onSelect(group)}
            className={cn(
              'flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left transition-colors cursor-pointer',
              selected
                ? 'bg-primary/10 ring-1 ring-inset ring-primary/20'
                : 'hover:bg-slate-100',
            )}
          >
            <span
              className="mt-0.5 size-2 shrink-0 rounded-full"
              style={{ backgroundColor: ELEMENT_DOTS[g.type] }}
            />
            <div className="min-w-0 flex-1">
              <p className={cn(
                'truncate text-[11px] font-semibold leading-tight',
                selected ? 'text-primary' : 'text-slate-700',
              )}>
                {g.label}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {g.count} · {g.totalArea.toFixed(1)} m²
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
