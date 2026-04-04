// Right column of the Overview view: load profile chart and element composition accordion.

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionLabel } from '../shared/ui';
import { LoadProfileViewer, type EnergyTotals } from './LoadProfileViewer';
import type { BuildingElement } from '../configure/BuildingVisualization';
import type { RoofConfig } from '../configure/RoofConfigurator';
import { ElementCompositionSection } from './ElementCompositionSection';

export interface EnergyEnvelopeColumnProps {
  uploadError: string | null;
  onClearError: () => void;
  onTotalsChange: (totals: EnergyTotals) => void;
  elements: Record<string, BuildingElement>;
  selectedId: string | null;
  onSelectElement: (id: string) => void;
  onUpdateElement: (id: string, patch: Partial<BuildingElement>) => void;
  roofConfig: RoofConfig;
  /** Re-triggers the scroll indicator check when the panel becomes visible. */
  isActive: boolean;
}

/** Right panel of the overview: energy chart, element composition accordion, scroll indicator. */
export function EnergyEnvelopeColumn({
  uploadError,
  onClearError,
  onTotalsChange,
  elements,
  selectedId,
  onSelectElement,
  onUpdateElement,
  roofConfig,
  isActive,
}: EnergyEnvelopeColumnProps) {
  const scrollRef = useRef<HTMLElement>(null);
  const [hasMore, setHasMore] = useState(false);

  // Recheck scroll indicator whenever content height changes (accordion expand/collapse).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setHasMore(el.scrollTop + el.clientHeight < el.scrollHeight - 8);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isActive]);

  return (
    <div className="relative min-h-0 overflow-hidden">
      <section
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          setHasMore(el.scrollTop + el.clientHeight < el.scrollHeight - 8);
        }}
        className="h-full overflow-y-auto bg-slate-200 p-4
          [&::-webkit-scrollbar]:w-2.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-slate-400
          hover:[&::-webkit-scrollbar-thumb]:bg-slate-500"
      >
        <div className="flex flex-col gap-4 pb-4">
          {uploadError && (
            <div className="flex items-start gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 shadow-[0_10px_24px_rgba(239,68,68,0.08)]">
              <p className="flex-1 text-[11px] leading-snug text-destructive">{uploadError}</p>
              <button
                type="button"
                onClick={onClearError}
                className="shrink-0 cursor-pointer text-sm leading-none text-destructive"
              >×</button>
            </div>
          )}

          <div className="px-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Energy &amp; Envelope</p>
            <p className="mt-1 text-lg font-semibold text-foreground">Performance Overview</p>
          </div>

          <div className="h-[300px] shrink-0">
            <LoadProfileViewer buildingId="Building 3" onTotalsChange={onTotalsChange} />
          </div>

          <div className="px-1">
            <SectionLabel>Element Composition</SectionLabel>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              Expand a group to inspect all surfaces and edit quick values inline. Switch to configure mode for detailed changes.
            </p>
          </div>

          <ElementCompositionSection
            elements={elements}
            selectedId={selectedId}
            onSelect={onSelectElement}
            onUpdate={onUpdateElement}
            roofConfig={roofConfig}
          />
        </div>
      </section>

      {/* Floating scroll-down indicator */}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-end transition-opacity duration-300',
          hasMore ? 'opacity-100' : 'opacity-0',
        )}
      >
        <div className="h-16 w-full bg-gradient-to-t from-white/80 to-transparent" />
        <button
          type="button"
          aria-label="Scroll down"
          onClick={() => scrollRef.current?.scrollBy({ top: 200, behavior: 'smooth' })}
          className="pointer-events-auto absolute bottom-4 right-5 flex size-7 items-center justify-center rounded-md border border-slate-200 bg-white shadow-md text-muted-foreground transition-colors hover:bg-slate-50 hover:text-foreground [&_svg]:size-4"
        >
          <ChevronDown />
        </button>
      </div>
    </div>
  );
}
