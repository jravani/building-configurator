import React, { useState, useRef, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Download, Upload, X, Building2, RotateCcw, Check, AlertTriangle, ChevronDown,
  ChevronUp,
  Pencil,
  Zap, Flame, Droplets,
  Sun, Battery, Thermometer, Plug,
} from 'lucide-react';

import { ElementPanel } from './ElementPanel';
import { GeneralConfig } from './GeneralConfig';
import { BuildingVisualization } from './BuildingVisualization';
import { LoadProfileViewer, type EnergyTotals } from './LoadProfileViewer';
import { RoofConfig, DEFAULT_ROOF_CONFIG } from './RoofConfigurator';
import {
  SegmentedControl, SectionLabel,
  ELEMENT_DOTS, ConfiguratorStyles,
} from './ui';
import { cn } from '../../lib/utils';
import type { BuildingElement } from './BuildingVisualization';

// --- Default state --------------------------------------------------------------

const DEFAULT_ELEMENTS: Record<string, BuildingElement> = {
  south_wall:     { id: 'south_wall',     label: 'South Wall',     type: 'wall',   area: 56.0, uValue: 0.24, gValue: null, tilt: 90, azimuth: 180 },
  east_wall:      { id: 'east_wall',      label: 'East Wall',      type: 'wall',   area: 37.8, uValue: 0.24, gValue: null, tilt: 90, azimuth: 90  },
  north_wall:     { id: 'north_wall',     label: 'North Wall',     type: 'wall',   area: 56.0, uValue: 0.24, gValue: null, tilt: 90, azimuth: 0   },
  west_wall:      { id: 'west_wall',      label: 'West Wall',      type: 'wall',   area: 37.8, uValue: 0.24, gValue: null, tilt: 90, azimuth: 270 },
  roof:           { id: 'roof',           label: 'Roof',           type: 'roof',   area: 98.0, uValue: 0.18, gValue: null, tilt: 35, azimuth: 180 },
  floor:          { id: 'floor',          label: 'Ground Floor',   type: 'floor',  area: 90.0, uValue: 0.30, gValue: null, tilt: 0,  azimuth: 0   },
  south_window_1: { id: 'south_window_1', label: 'South Window 1', type: 'window', area: 4.5,  uValue: 1.30, gValue: 0.60, tilt: 90, azimuth: 180 },
  south_window_2: { id: 'south_window_2', label: 'South Window 2', type: 'window', area: 4.5,  uValue: 1.30, gValue: 0.60, tilt: 90, azimuth: 180 },
  east_window:    { id: 'east_window',    label: 'East Window',    type: 'window', area: 3.0,  uValue: 1.30, gValue: 0.60, tilt: 90, azimuth: 90  },
  door:           { id: 'door',           label: 'Front Door',     type: 'door',   area: 2.1,  uValue: 1.80, gValue: null, tilt: 90, azimuth: 180 },
};

const DEFAULT_GENERAL = {
  buildingType:       'MFH',
  constructionPeriod: 'Post-2010',
  country:            'DE',
  floorArea:          363.4,
  roomHeight:         2.7,
  storeys:            4,
  n_air_infiltration: 0.4,
  n_air_use:          0.4,
  phi_int:            3.0,
  q_w_nd:             12.5,
  massClass:          'Medium',
  c_m:                110,
  use_milp:           false,
  electricityDemand:  4000,
  spaceHeatingDemand: 15000,
  dhwDemand:          2500,
};

// --- Header icon button --------------------------------------------------------

function HeaderBtn({
  onClick, children, tooltip,
}: { onClick?: () => void; children: React.ReactNode; tooltip?: string }) {
  const btn = (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className="size-7 flex items-center justify-center rounded-md cursor-pointer text-muted-foreground hover:bg-muted transition-colors duration-100 shrink-0 [&_svg]:size-4"
    >
      {children}
    </button>
  );
  return btn;
}

// --- Element list ------------------------------------------------------------

interface ElementListProps {
  elements: Record<string, BuildingElement>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  roofConfig: RoofConfig;
}

interface ElementCompositionSectionProps extends ElementListProps {
  onUpdate: (id: string, patch: Partial<BuildingElement>) => void;
}

type ElementGroupKey = 'wall' | 'window' | 'door' | 'roof' | 'floor';

const ELEMENT_GROUP_LABELS: Record<ElementGroupKey, string> = {
  wall: 'Walls',
  window: 'Windows',
  door: 'Doors',
  roof: 'Roof',
  floor: 'Floor',
};

function getGroupedElements(elements: Record<string, BuildingElement>) {
  return {
    wall: Object.values(elements).filter((element) => element.type === 'wall'),
    window: Object.values(elements).filter((element) => element.type === 'window'),
    door: Object.values(elements).filter((element) => element.type === 'door'),
    roof: Object.values(elements).filter((element) => element.type === 'roof'),
    floor: Object.values(elements).filter((element) => element.type === 'floor'),
  } satisfies Record<ElementGroupKey, BuildingElement[]>;
}

function getRoofGroupInfo(roofConfig: RoofConfig) {
  const count = roofConfig.surfaces.length;
  const descriptions: Record<string, string> = {
    flat: '1 surface · low-slope',
    'mono-pitch': '1 surface · single slope',
    gabled: '2 surfaces · S + N',
    hipped: '4 surfaces · S/N/E/W',
    'v-shape': '2 surfaces · inward slopes',
    'saw-tooth': `${count} surfaces · S-facing`,
    custom: `${count} surface${count !== 1 ? 's' : ''} · custom`,
  };

  return {
    count,
    description: descriptions[roofConfig.type] ?? `${count} surfaces`,
  };
}

function clampSurfacePatch(element: BuildingElement, draft: {
  area: string;
  uValue: string;
  gValue: string;
  tilt: string;
  azimuth: string;
}): Partial<BuildingElement> | null {
  const area = Number(draft.area);
  const uValue = Number(draft.uValue);
  const tilt = Number(draft.tilt);
  const azimuth = Number(draft.azimuth);

  if ([area, uValue, tilt, azimuth].some((value) => Number.isNaN(value))) {
    return null;
  }

  const patch: Partial<BuildingElement> = {
    area: Math.max(0.1, area),
    uValue: Math.max(0.01, uValue),
    tilt: Math.min(90, Math.max(0, tilt)),
    azimuth: ((azimuth % 360) + 360) % 360,
  };

  if (element.gValue !== null) {
    const gValue = Number(draft.gValue);
    if (Number.isNaN(gValue)) return null;
    patch.gValue = Math.min(1, Math.max(0, gValue));
  }

  return patch;
}

function findScrollParent(node: HTMLElement | null): HTMLElement | null {
  let current = node?.parentElement ?? null;

  while (current) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    const canScroll = overflowY === 'auto' || overflowY === 'scroll';

    if (canScroll && current.scrollHeight > current.clientHeight) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function scrollIntoViewWithMargin(node: HTMLElement | null, margin = 24) {
  if (!node) return;

  const scrollParent = findScrollParent(node);

  if (!scrollParent) {
    node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  const nodeRect = node.getBoundingClientRect();
  const parentRect = scrollParent.getBoundingClientRect();
  const topDelta = nodeRect.top - (parentRect.top + margin);
  const bottomDelta = nodeRect.bottom - (parentRect.bottom - margin);

  if (bottomDelta > 0) {
    scrollParent.scrollBy({ top: bottomDelta, behavior: 'smooth' });
    return;
  }

  if (topDelta < 0) {
    scrollParent.scrollBy({ top: topDelta, behavior: 'smooth' });
  }
}

function scheduleScrollIntoView(node: HTMLElement | null, duration = 260) {
  if (!node) return;

  let frameId = 0;
  let timeoutId = 0;
  let resizeObserver: ResizeObserver | null = null;

  const runScroll = () => scrollIntoViewWithMargin(node);
  const cleanup = () => {
    if (frameId) cancelAnimationFrame(frameId);
    if (timeoutId) window.clearTimeout(timeoutId);
    resizeObserver?.disconnect();
  };

  frameId = requestAnimationFrame(() => {
    runScroll();

    resizeObserver = new ResizeObserver(() => {
      runScroll();
    });
    resizeObserver.observe(node);

    timeoutId = window.setTimeout(() => {
      cleanup();
    }, duration);
  });
}

function formatSteppedValue(value: number, step: number) {
  const decimals = `${step}`.includes('.') ? `${step}`.split('.')[1].length : 0;
  return value.toFixed(decimals);
}

function clampSteppedValue(value: number, min?: number, max?: number) {
  const lowerBound = min ?? Number.NEGATIVE_INFINITY;
  const upperBound = max ?? Number.POSITIVE_INFINITY;
  return Math.min(upperBound, Math.max(lowerBound, value));
}

function StepperNumberInput({
  value,
  onChange,
  min,
  max,
  step,
}: {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step: number;
}) {
  const adjustValue = (direction: 1 | -1) => {
    const currentValue = Number(value);
    const fallbackValue = min ?? 0;
    const nextValue = clampSteppedValue(
      (Number.isFinite(currentValue) ? currentValue : fallbackValue) + direction * step,
      min,
      max,
    );
    onChange(formatSteppedValue(nextValue, step));
  };

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[4px] border border-slate-200 bg-white px-1.5 py-1 pr-7 text-[11px] text-foreground outline-none focus:border-slate-300"
      />
      <div className="absolute inset-y-0 right-0 flex w-5 flex-col border-l border-slate-200 bg-slate-50/90">
        <button
          type="button"
          onClick={() => adjustValue(1)}
          className="flex flex-1 items-center justify-center text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Increase value"
        >
          <ChevronUp className="size-3" />
        </button>
        <button
          type="button"
          onClick={() => adjustValue(-1)}
          className="flex flex-1 items-center justify-center border-t border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Decrease value"
        >
          <ChevronDown className="size-3" />
        </button>
      </div>
    </div>
  );
}

function ElementList({ elements, selectedId, onSelect, roofConfig }: ElementListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    wall: true,
    roof: false,
    floor: false,
    window: false,
    door: false,
  });

  const grouped = getGroupedElements(elements);
  const roofInfo = getRoofGroupInfo(roofConfig);

  return (
    <div className="flex flex-col gap-2">
        {(Object.keys(grouped) as ElementGroupKey[]).map((type) => {
          const items = grouped[type];
          if (items.length === 0) return null;

          const isExpanded = expandedGroups[type] ?? false;
          const totalTypeArea = items.reduce((sum, item) => sum + item.area, 0);
          const displayCount = type === 'roof' ? roofInfo.count : items.length;
          const displayDescription = type === 'roof' ? roofInfo.description : null;

          return (
            <div key={type} className="overflow-hidden border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.88),rgba(255,255,255,1))] shadow-[0_10px_22px_rgba(15,23,42,0.05)]">
              <button
                type="button"
                onClick={() => setExpandedGroups((prev) => ({ ...prev, [type]: !prev[type] }))}
                className="flex w-full items-center gap-2 border-b border-border/70 bg-slate-50 px-3 py-2 text-left transition-colors hover:bg-slate-100/80"
              >
                <span
                  className="size-2 shrink-0"
                  style={{ backgroundColor: ELEMENT_DOTS[type] }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-700">{ELEMENT_GROUP_LABELS[type]}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {displayCount} surface{displayCount !== 1 ? 's' : ''}
                    {displayDescription ? ` · ${displayDescription}` : ` · ${totalTypeArea.toFixed(1)} m²`}
                  </p>
                </div>
                <div className="rounded-[6px] border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {displayCount}
                </div>
                <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-200', isExpanded && 'rotate-180')} />
              </button>

              {isExpanded && (
                <div className="px-2 py-2">
                  <div className="bg-white">
                    <table className="w-full table-fixed border-collapse text-left">
                      <thead className="text-[10px] uppercase tracking-[0.05em] text-slate-400">
                        <tr className="border-b border-slate-200/80">
                          <th className="px-2 py-1.5 font-semibold">Surface</th>
                          <th className="w-16 border-l border-slate-100 px-2 py-1.5 font-semibold">Area</th>
                          <th className="w-16 border-l border-slate-100 px-2 py-1.5 font-semibold">U</th>
                          <th className="w-16 border-l border-slate-100 px-2 py-1.5 font-semibold">Az</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white text-[11px] divide-y divide-slate-100">
                        {items.map((el) => {
                          const active = selectedId === el.id;

                          return (
                            <tr
                              key={el.id}
                              className={cn(
                                'cursor-pointer transition-colors',
                                active ? 'bg-primary/10' : 'hover:bg-slate-50',
                              )}
                              onClick={() => onSelect(el.id)}
                            >
                              <td className="px-2 py-2.5 font-medium text-foreground">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="size-2 rounded-full shrink-0"
                                    style={{ backgroundColor: ELEMENT_DOTS[el.type] }}
                                  />
                                  <span className="truncate">{el.label}</span>
                                </div>
                              </td>
                              <td className="border-l border-slate-100 px-2 py-2.5 text-muted-foreground">{el.area.toFixed(1)}</td>
                              <td className="border-l border-slate-100 px-2 py-2.5 text-muted-foreground">{el.uValue.toFixed(2)}</td>
                              <td className="border-l border-slate-100 px-2 py-2.5 text-muted-foreground">{Math.round(el.azimuth)}°</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}


function ElementCompositionSection({
  elements,
  selectedId,
  onSelect,
  roofConfig,
  onUpdate,
}: ElementCompositionSectionProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    wall: false,
    roof: false,
    floor: false,
    window: false,
    door: false,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState({ area: '', uValue: '', gValue: '', tilt: '', azimuth: '' });

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggleGroup = (type: string) => {
    const willExpand = !expandedGroups[type];
    setExpandedGroups((prev) => {
      const allClosed = Object.fromEntries(Object.keys(prev).map((k) => [k, false]));
      return { ...allClosed, [type]: !prev[type] };
    });
    if (willExpand) {
      requestAnimationFrame(() => {
        scheduleScrollIntoView(cardRefs.current[type]);
      });
    }
  };

  const grouped  = getGroupedElements(elements);
  const roofInfo = getRoofGroupInfo(roofConfig);
  const types    = (Object.keys(grouped) as ElementGroupKey[]).filter((t) => grouped[t].length > 0);
  const activeType = types.find((t) => expandedGroups[t]) ?? null;

  const startEditing = (element: BuildingElement) => {
    setEditingId(element.id);
    setEditingDraft({
      area: element.area.toFixed(1),
      uValue: element.uValue.toFixed(2),
      gValue: element.gValue !== null ? element.gValue.toFixed(2) : '',
      tilt: String(Math.round(element.tilt)),
      azimuth: String(Math.round(element.azimuth)),
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingDraft({ area: '', uValue: '', gValue: '', tilt: '', azimuth: '' });
  };

  const saveEditing = (element: BuildingElement) => {
    const patch = clampSurfacePatch(element, editingDraft);
    if (!patch) return;
    onUpdate(element.id, patch);
    cancelEditing();
  };

  // Renders the header button shared by both expanded and sidebar cards.
  const renderHeader = (type: ElementGroupKey, compact: boolean) => {
    const items        = grouped[type];
    const isExpanded   = expandedGroups[type] ?? false;
    const totalArea    = items.reduce((sum, el) => sum + el.area, 0);
    const displayCount = type === 'roof' ? roofInfo.count : items.length;
    const description  = type === 'roof' ? roofInfo.description : `${totalArea.toFixed(1)} m²`;
    return (
      <button
        type="button"
        onClick={() => toggleGroup(type)}
        className={cn(
          'flex w-full items-center gap-3 px-3 text-left transition-colors hover:bg-slate-50',
          compact ? 'py-2.5' : 'min-h-[72px] py-3',
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-700 leading-tight">
            {ELEMENT_GROUP_LABELS[type]}
          </p>
          {!compact && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {displayCount} surface{displayCount !== 1 ? 's' : ''} · {description}
            </p>
          )}
        </div>
        <div className="rounded-[6px] border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 shrink-0">
          {displayCount}
        </div>
        <ChevronDown className={cn('size-3.5 shrink-0 text-muted-foreground transition-transform duration-300', isExpanded && 'rotate-180')} />
      </button>
    );
  };

  // Renders the animated table panel (always present in DOM so animation works).
  const renderTable = (type: ElementGroupKey) => {
    const items      = grouped[type];
    const isExpanded = expandedGroups[type] ?? false;

    return (
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-in-out',
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-slate-200 bg-white/80 px-3 py-3">
            <div className="bg-white">
              <table className="w-full table-fixed border-collapse text-left">
                <thead className="text-[10px] uppercase tracking-[0.05em] text-slate-400">
                  <tr className="border-b border-slate-200/80">
                    <th className="px-2 py-1.5 font-semibold">Surface</th>
                    <th className="w-20 border-l border-slate-100 px-2 py-1.5 font-semibold">Area</th>
                    <th className="w-[72px] border-l border-slate-100 px-2 py-1.5 font-semibold">U</th>
                    <th className="w-[72px] border-l border-slate-100 px-2 py-1.5 font-semibold">g</th>
                    <th className="w-20 border-l border-slate-100 px-2 py-1.5 font-semibold">Tilt</th>
                    <th className="w-20 border-l border-slate-100 px-2 py-1.5 font-semibold">Az</th>
                    <th className="w-24 border-l border-slate-100 px-2 py-1.5 font-semibold text-right">Edit</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-[11px] divide-y divide-slate-100">
                  {items.map((element) => {
                    const isEditing = editingId === element.id;
                    const active = selectedId === element.id || isEditing;
                    return (
                      <tr
                        key={element.id}
                        className={cn(
                          'transition-colors',
                          active ? 'bg-primary/10' : 'hover:bg-slate-50',
                        )}
                      >
                        <td className="px-2 py-2.5 font-medium text-foreground">
                          <span className="truncate">{element.label}</span>
                        </td>
                        <td className="border-l border-slate-100 px-2 py-2.5 text-muted-foreground">
                          {isEditing ? (
                            <StepperNumberInput
                              value={editingDraft.area}
                              onChange={(value) => setEditingDraft((previous) => ({ ...previous, area: value }))}
                              step={0.1}
                              min={0.1}
                            />
                          ) : element.area.toFixed(1)}
                        </td>
                        <td className="border-l border-slate-100 px-2 py-2.5 text-muted-foreground">
                          {isEditing ? (
                            <StepperNumberInput
                              value={editingDraft.uValue}
                              onChange={(value) => setEditingDraft((previous) => ({ ...previous, uValue: value }))}
                              step={0.01}
                              min={0.01}
                            />
                          ) : element.uValue.toFixed(2)}
                        </td>
                        <td className="border-l border-slate-100 px-2 py-2.5 text-muted-foreground">
                          {element.gValue === null ? '—' : isEditing ? (
                            <StepperNumberInput
                              value={editingDraft.gValue}
                              onChange={(value) => setEditingDraft((previous) => ({ ...previous, gValue: value }))}
                              step={0.01}
                              min={0}
                              max={1}
                            />
                          ) : element.gValue.toFixed(2)}
                        </td>
                        <td className="border-l border-slate-100 px-2 py-2.5 text-muted-foreground">
                          {isEditing ? (
                            <StepperNumberInput
                              value={editingDraft.tilt}
                              onChange={(value) => setEditingDraft((previous) => ({ ...previous, tilt: value }))}
                              step={1}
                              min={0}
                              max={90}
                            />
                          ) : `${Math.round(element.tilt)}°`}
                        </td>
                        <td className="border-l border-slate-100 px-2 py-2.5 text-muted-foreground">
                          {isEditing ? (
                            <StepperNumberInput
                              value={editingDraft.azimuth}
                              onChange={(value) => setEditingDraft((previous) => ({ ...previous, azimuth: value }))}
                              step={1}
                              min={0}
                              max={360}
                            />
                          ) : `${Math.round(element.azimuth)}°`}
                        </td>
                        <td className="border-l border-slate-100 px-2 py-2.5 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => saveEditing(element)}
                                className="inline-flex size-6 items-center justify-center rounded-[4px] border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100"
                                aria-label={`Save ${element.label}`}
                              >
                                <Check className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditing}
                                className="inline-flex size-6 items-center justify-center rounded-[4px] border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
                                aria-label={`Cancel editing ${element.label}`}
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEditing(element)}
                              className="inline-flex items-center justify-end gap-1 rounded-[4px] border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                              aria-label={`Edit ${element.label}`}
                            >
                              <Pencil className="size-3" />
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const cardClass = 'overflow-hidden rounded-lg border border-white bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07),0_4px_16px_rgba(15,23,42,0.08)]';

  // When a group is expanded: expanded card on the left, remaining tabs stacked on the right.
  if (activeType) {
    const sidebarTypes = types.filter((t) => t !== activeType);
    return (
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <div ref={(el) => { cardRefs.current[activeType] = el; }} className={cardClass}>
            {renderHeader(activeType, false)}
            {renderTable(activeType)}
          </div>
        </div>
        <div className="flex w-44 shrink-0 flex-col gap-2">
          {sidebarTypes.map((type) => (
            <div key={type} ref={(el) => { cardRefs.current[type] = el; }} className={cardClass}>
              {renderHeader(type, true)}
              {renderTable(type)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: uniform grid when nothing is expanded.
  return (
    <div className="grid gap-3 grid-cols-2 xl:grid-cols-3">
      {types.map((type) => (
        <div key={type} ref={(el) => { cardRefs.current[type] = el; }} className={cardClass}>
          {renderHeader(type, false)}
          {renderTable(type)}
        </div>
      ))}
    </div>
  );
}

function SummaryCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  const accent = label === 'Total Area'
    ? 'from-sky-50 to-white text-sky-700 border-sky-200'
    : label === 'Avg U-value'
      ? 'from-amber-50 to-white text-amber-700 border-amber-200'
      : 'from-emerald-50 to-white text-emerald-700 border-emerald-200';

  return (
    <div className={cn(
      'rounded-lg border bg-gradient-to-br px-3 py-2.5 shadow-[0_10px_24px_rgba(15,23,42,0.06)]',
      accent,
    )}>
      <p className="text-[9px] text-muted-foreground uppercase tracking-[0.06em]">{label}</p>
      <p className="mt-1 text-lg font-bold leading-none text-foreground">{value}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{unit}</p>
    </div>
  );
}

// Maps area-weighted avg U-value to a human-readable thermal efficiency label.
function getThermalRating(u: number): { label: string; color: string; bg: string } {
  if (u < 0.20) return { label: 'Excellent', color: '#059669', bg: '#ecfdf5' };
  if (u < 0.30) return { label: 'Good',      color: '#16a34a', bg: '#f0fdf4' };
  if (u < 0.50) return { label: 'Fair',      color: '#d97706', bg: '#fffbeb' };
  if (u < 0.80) return { label: 'Poor',      color: '#dc2626', bg: '#fef2f2' };
  return             { label: 'Very Poor',   color: '#9f1239', bg: '#fff1f2' };
}


// --- Technologies section ----------------------------------------------------

interface Technology {
  id: string;
  label: string;
  Icon: React.ElementType;
  installed: boolean;
  capacity: string | null;
}

const DEFAULT_TECHNOLOGIES: Technology[] = [
  { id: 'solar_pv',    label: 'Solar PV',    Icon: Sun,         installed: false, capacity: null },
  { id: 'battery',     label: 'Battery',     Icon: Battery,     installed: false, capacity: null },
  { id: 'heat_pump',   label: 'Heat Pump',   Icon: Thermometer, installed: false, capacity: null },
  { id: 'ev_charger',  label: 'EV Charger',  Icon: Plug,        installed: false, capacity: null },
];

/** Grid of technology cards. Each card toggles installed/not-installed on click. */
function TechnologiesSection() {
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

// --- Main component ----------------------------------------------------------

interface BuildingConfiguratorProps {
  onClose?: () => void;
}

export function BuildingConfigurator({ onClose }: BuildingConfiguratorProps) {
  const [workspaceView, setWorkspaceView] = useState<'overview' | 'configure'>('overview');
  const [mode,        setMode]       = useState<'basic' | 'expert'>('basic');
  const [elements,    setElements]   = useState(DEFAULT_ELEMENTS);
  const [general,     setGeneralRaw] = useState(DEFAULT_GENERAL);
  const [roofConfig,  setRoofConfig] = useState<RoofConfig>(DEFAULT_ROOF_CONFIG);
  const [selectedId,  setSelectedId] = useState<string | null>(null);
  const [hoveredId,   setHoveredId]  = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [expanded,    setExpanded]   = useState<Record<string, boolean>>({
    identity: true, metrics: true, demand: true,
    ventilation: false, internal: false, thermal: false, solver: false,
  });

  const [savedState,       setSavedState]       = useState({ elements: DEFAULT_ELEMENTS, general: DEFAULT_GENERAL, roofConfig: DEFAULT_ROOF_CONFIG });
  const [showCloseDialog,  setShowCloseDialog]  = useState(false);

  const hasUnsavedChanges = JSON.stringify({ elements, general, roofConfig }) !== JSON.stringify(savedState);

  const [energyTotals, setEnergyTotals] = useState<EnergyTotals>({ electricity: '—', heating: '—', hotwater: '—', unit: 'kWh/day' });

  const fileInputRef       = useRef<HTMLInputElement>(null);
  const overviewScrollRef  = useRef<HTMLElement>(null);
  const [overviewHasMore, setOverviewHasMore] = useState(false);

  // Recheck scroll indicator whenever the overview scroll container resizes
  // (e.g. when element composition groups expand/collapse).
  useEffect(() => {
    const el = overviewScrollRef.current;
    if (!el) return;
    const check = () => setOverviewHasMore(el.scrollTop + el.clientHeight < el.scrollHeight - 8);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [workspaceView]);

  // --- Handlers ---------------------------------------------------------------

  const updateElement = (id: string, patch: Partial<BuildingElement>) =>
    setElements((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const handleSelectElement = (id: string) => {
    setSelectedId(id);
    setWorkspaceView('configure');
  };

  const setGen = (key: string, value: any) =>
    setGeneralRaw((prev) => ({ ...prev, [key]: value }));

  const toggleSection = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleReset = () => {
    setElements(DEFAULT_ELEMENTS);
    setGeneralRaw(DEFAULT_GENERAL);
    setRoofConfig(DEFAULT_ROOF_CONFIG);
    setSelectedId(null);
    setUploadError(null);
  };

  const handleApply = () => {
    console.log('Apply:', { elements, general, roofConfig });
    setSavedState({ elements, general, roofConfig });
  };

  // --- JSON export ------------------------------------------------------------

  const handleDownload = () => {
    const payload = {
      version: '1.0',
      exported: new Date().toISOString(),
      elements,
      generalConfig: general,
      roofConfig,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'building-config.json'; a.click();
    URL.revokeObjectURL(url);
  };

  // --- JSON import ------------------------------------------------------------

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const cfg = JSON.parse(ev.target?.result as string);
        if (cfg.elements)      setElements({ ...DEFAULT_ELEMENTS, ...cfg.elements });
        if (cfg.generalConfig) setGeneralRaw({ ...DEFAULT_GENERAL, ...cfg.generalConfig });
        if (cfg.roofConfig)    setRoofConfig(cfg.roofConfig);
      } catch {
        setUploadError('Could not parse JSON — ensure the file was exported from this configurator.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- Derived ---------------------------------------------------------------

  const totalArea = Object.values(elements).reduce((sum, e) => sum + (e.area || 0), 0);
  const avgUValue = totalArea > 0
    ? Object.values(elements).reduce((sum, e) => sum + e.uValue * e.area, 0) / totalArea
    : 0;
  const thermalRating = getThermalRating(avgUValue);
  const selectedElement = selectedId ? elements[selectedId] ?? null : null;
  return (
    <div className="cfg-panel mr-[10px] h-[min(920px,calc(100vh-24px))] w-[min(1540px,calc(100vw-60px))] rounded-lg shadow-2xl flex flex-col bg-card overflow-hidden">
      <ConfiguratorStyles />

      {/* ── Header ── */}
      <div className="h-[52px] shrink-0 px-4 flex items-center gap-3 bg-card border-b border-border">
        {/* Icon + title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="size-7 bg-foreground rounded-md flex items-center justify-center shrink-0">
            <Building2 className="size-4 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground leading-tight">Building 3 · MFH</p>
            <p className="text-[11px] text-muted-foreground leading-tight">48.1351° N, 11.5820° E</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <SegmentedControl
            options={[{ value: 'overview', label: 'Overview' }, { value: 'configure', label: 'Configure' }]}
            value={workspaceView}
            onChange={(v) => setWorkspaceView(v as 'overview' | 'configure')}
          />
          <SegmentedControl
            options={[{ value: 'basic', label: 'Basic' }, { value: 'expert', label: 'Expert' }]}
            value={mode}
            onChange={(v) => setMode(v as 'basic' | 'expert')}
          />
          <HeaderBtn onClick={handleDownload} tooltip="Export JSON"><Download /></HeaderBtn>
          <HeaderBtn onClick={() => fileInputRef.current?.click()} tooltip="Import JSON"><Upload /></HeaderBtn>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleUpload} />
          <div className="w-px h-5 bg-border shrink-0 mx-1" />
          {onClose && (
            <HeaderBtn onClick={() => setShowCloseDialog(true)} tooltip="Close"><X /></HeaderBtn>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="min-h-0 flex-1 overflow-hidden bg-white flex flex-col">
        <div className="min-h-0 flex-1 overflow-hidden">
        {workspaceView === 'overview' ? (
          <div className="grid h-full min-h-0 grid-cols-[430px_minmax(0,1fr)] overflow-hidden">
            <aside className="min-h-0 overflow-y-auto border-r border-border/80 bg-slate-200 p-4">
              <div className="flex flex-col gap-4">
                {/* Title flat on column */}
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

                {/* Energy consumption — icon-identified cards, neutral colours */}
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

                {/* Unified building info table */}
                <div className="overflow-hidden rounded-md border border-slate-200/60 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.07)]">
                  <table className="w-full text-[11px]">
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { label: 'Type',         value: general.buildingType },
                        { label: 'Construction', value: general.constructionPeriod },
                        { label: 'Country',      value: general.country },
                        { label: 'Floor area',   value: `${general.floorArea.toFixed(1)} m²` },
                        { label: 'Volume',       value: `${(general.floorArea * general.roomHeight).toFixed(0)} m³` },
                        { label: 'Envelope',     value: `${totalArea.toFixed(1)} m²  ·  ${Object.keys(elements).length} surfaces` },
                      ].map(({ label, value }) => (
                        <tr key={label}>
                          <td className="px-3 py-1.5 text-slate-400">{label}</td>
                          <td className="px-3 py-1.5 text-right font-medium text-foreground">{value}</td>
                        </tr>
                      ))}
                      {/* Thermal efficiency — indicator in basic mode, value added in expert mode */}
                      <tr>
                        <td className="px-3 py-1.5 text-slate-400">Thermal efficiency</td>
                        <td className="px-3 py-1.5 text-right">
                          <span
                            className="inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold"
                            style={{ color: thermalRating.color, background: thermalRating.bg }}
                          >
                            {thermalRating.label}
                          </span>
                          {mode === 'expert' && (
                            <span className="ml-2 text-[10px] text-slate-400">{avgUValue.toFixed(2)} W/m²K</span>
                          )}
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

            {/* Wrapper provides the stacking context for the floating arrow */}
            <div className="relative min-h-0 overflow-hidden">
              <section
                ref={overviewScrollRef}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  setOverviewHasMore(el.scrollTop + el.clientHeight < el.scrollHeight - 8);
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
                        onClick={() => setUploadError(null)}
                        className="shrink-0 cursor-pointer text-sm leading-none text-destructive"
                      >×</button>
                    </div>
                  )}

                  {/* Right column title — mirrors the left column's "Building Snapshot" level */}
                  <div className="px-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Energy &amp; Envelope</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">Performance Overview</p>
                  </div>

                  <div className="h-[300px] shrink-0">
                    <LoadProfileViewer buildingId="Building 3" onTotalsChange={setEnergyTotals} />
                  </div>

                  {/* Title sits directly on the column background */}
                  <div className="px-1">
                    <SectionLabel>Element Composition</SectionLabel>
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                      Expand a group to inspect all surfaces and edit quick values inline. Use configuration mode for deeper changes.
                    </p>
                  </div>

                  {/* 2nd-layer content — accordion cards have their own cushion style */}
                  <ElementCompositionSection
                    elements={elements}
                    selectedId={selectedId}
                    onSelect={handleSelectElement}
                    onUpdate={updateElement}
                    roofConfig={roofConfig}
                  />
                </div>
              </section>

              {/* Floating scroll-down indicator */}
              <div
                className={cn(
                  'pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-end transition-opacity duration-300',
                  overviewHasMore ? 'opacity-100' : 'opacity-0',
                )}
              >
                {/* Gradient fade hinting at content below */}
                <div className="h-16 w-full bg-gradient-to-t from-white/80 to-transparent" />
                <button
                  type="button"
                  aria-label="Scroll down"
                  onClick={() => overviewScrollRef.current?.scrollBy({ top: 200, behavior: 'smooth' })}
                  className="pointer-events-auto absolute bottom-4 right-5 flex size-7 items-center justify-center rounded-md border border-slate-200 bg-white shadow-md text-muted-foreground transition-colors hover:bg-slate-50 hover:text-foreground [&_svg]:size-4"
                >
                  <ChevronDown />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid h-full min-h-0 grid-cols-[340px_minmax(0,1fr)] overflow-hidden">
            <aside className="min-h-0 border-r border-border/80 bg-slate-50/80 p-4">
              <div className="flex h-full min-h-0 flex-col gap-4">
                <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_16px_32px_rgba(15,23,42,0.08)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Active Element</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{selectedElement ? selectedElement.label : 'No element selected'}</p>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                    {selectedElement
                      ? `Editing ${selectedElement.type} with area ${selectedElement.area.toFixed(1)} m² and U-value ${selectedElement.uValue.toFixed(2)}.`
                      : 'Choose an element from the helper list or the mini preview below.'}
                  </p>
                </section>

                <section className="h-[260px] shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_16px_32px_rgba(15,23,42,0.08)]">
                  <div className="border-b border-border/80 px-4 py-3">
                    <p className="text-xs font-semibold text-foreground">Selection Helper</p>
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                      Keep a compact preview available while editing.
                    </p>
                  </div>
                  <div className="h-full overflow-hidden p-3">
                    <BuildingVisualization
                      elements={elements}
                      selectedId={selectedId}
                      hoveredId={hoveredId}
                      onSelect={setSelectedId}
                      onHover={setHoveredId}
                    />
                  </div>
                </section>

                <section className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_16px_32px_rgba(15,23,42,0.08)]">
                  <div className="border-b border-border/80 px-4 py-3">
                    <SectionLabel>Element Helper</SectionLabel>
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                      Select another surface without leaving configuration mode.
                    </p>
                  </div>
                  <div className="h-full overflow-y-auto px-4 pb-4 pt-3">
                    <ElementList
                      elements={elements}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      roofConfig={roofConfig}
                    />
                  </div>
                </section>
              </div>
            </aside>

            <section className="min-h-0 bg-[linear-gradient(180deg,rgba(250,250,252,0.9),rgba(255,255,255,1))] p-4">
              <div className="flex h-full min-h-0 flex-col gap-4">
            {uploadError && (
              <div className="flex items-start gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 shadow-[0_10px_24px_rgba(239,68,68,0.08)]">
                <p className="flex-1 text-[11px] leading-snug text-destructive">{uploadError}</p>
                <button
                  type="button"
                  onClick={() => setUploadError(null)}
                  className="shrink-0 cursor-pointer text-sm leading-none text-destructive"
                >×</button>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="flex min-h-full flex-col gap-4 pb-4">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_16px_32px_rgba(15,23,42,0.08)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Configuration</p>
                      <p className="mt-1 text-base font-semibold text-foreground">Editing workspace</p>
                      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                        Change detailed properties here without mixing them into the overview panels.
                      </p>
                    </div>
                    <div className="rounded-md bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-700">
                      {selectedElement ? `${selectedElement.label}` : 'No element selected'}
                    </div>
                  </div>
                </div>

                {selectedId ? (
                  <ElementPanel
                    selectedId={selectedId}
                    elements={elements}
                    onUpdate={updateElement}
                    onDeselect={() => setSelectedId(null)}
                    roofConfig={roofConfig}
                    onRoofConfigChange={setRoofConfig}
                  />
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-white p-5 text-center shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                    <p className="text-sm font-semibold text-foreground">Select an element to start editing</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Use the overview column to inspect the building and choose a surface. Detailed parameters will open here.
                    </p>
                  </div>
                )}

                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-[0_16px_32px_rgba(15,23,42,0.08)]">
                  <GeneralConfig
                    mode={mode}
                    general={general}
                    setGen={setGen}
                    expanded={expanded}
                    toggle={toggleSection}
                  />
                </div>
              </div>
            </div>
              </div>
            </section>
          </div>
        )}
        </div>

        <div className="border-t border-border/80 bg-white px-4 py-3 shadow-[0_-8px_20px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-slate-50 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors duration-100 hover:bg-muted"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex cursor-pointer items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-colors duration-100 hover:bg-primary/90 shadow-[0_10px_20px_rgba(47,93,138,0.22)]"
            >
              <Check className="size-3.5" />
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* ── Close confirmation dialog ── */}
      <DialogPrimitive.Root open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-background border border-border rounded-md p-6 shadow-xl w-full max-w-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <div className="flex items-center gap-2 mb-3">
              {hasUnsavedChanges && <AlertTriangle className="size-4 text-amber-500 shrink-0" />}
              <DialogPrimitive.Title className="text-base font-semibold text-foreground">
                {hasUnsavedChanges ? 'Unsaved Changes' : 'Close Configurator'}
              </DialogPrimitive.Title>
            </div>

            <div className="mb-4">
              {hasUnsavedChanges ? (
                <>
                  <p className="text-sm text-foreground mb-2">
                    You have unsaved changes to this building configuration. What would you like to do?
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-[6px] px-3 py-2">
                    <p className="text-xs text-amber-800">
                      Closing without saving will discard all modifications made since the last Apply.
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-foreground">
                  Close the building configurator and return to the map?
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCloseDialog(false)}
                className="px-3 py-1.5 text-sm font-medium text-foreground border border-border rounded-[6px] hover:bg-muted transition-colors cursor-pointer"
              >
                Continue Editing
              </button>
              {hasUnsavedChanges && (
                <button
                  type="button"
                  onClick={() => { handleApply(); onClose?.(); setShowCloseDialog(false); }}
                  className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-[6px] hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Save &amp; Close
                </button>
              )}
              <button
                type="button"
                onClick={() => { onClose?.(); setShowCloseDialog(false); }}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-[6px] transition-colors cursor-pointer',
                  hasUnsavedChanges
                    ? 'text-destructive border border-destructive/30 hover:bg-destructive/5'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90',
                )}
              >
                {hasUnsavedChanges ? 'Discard Changes' : 'Close'}
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
