// Accordion table of building envelope surfaces with inline editing.
// Used in the Overview panel's right column.

import React, { useState, useRef } from 'react';
import { ChevronDown, Check, X, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ELEMENT_DOTS } from '../shared/ui';
import type { BuildingElement } from '../configure/BuildingVisualization';
import type { RoofConfig } from '../configure/RoofConfigurator';
import {
  ElementGroupKey,
  ELEMENT_GROUP_LABELS,
  getGroupedElements,
  getRoofGroupInfo,
} from '../shared/elementListUtils';
import {
  SnapshotStatus,
  SnapshotStatusBadge,
  getElementStatus,
} from '../shared/snapshotUtils';
import { StepperNumberInput } from '../shared/StepperInput';
import { scheduleScrollIntoView } from '../shared/scrollUtils';

export interface ElementCompositionSectionProps {
  elements: Record<string, BuildingElement>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<BuildingElement>) => void;
  roofConfig: RoofConfig;
}

type EditingDraft = { area: string; uValue: string; gValue: string; tilt: string; azimuth: string };

/** Validates and clamps draft field values before committing an element edit. */
function clampSurfacePatch(
  element: BuildingElement,
  draft: EditingDraft,
): Partial<BuildingElement> | null {
  const area    = Number(draft.area);
  const uValue  = Number(draft.uValue);
  const tilt    = Number(draft.tilt);
  const azimuth = Number(draft.azimuth);

  if ([area, uValue, tilt, azimuth].some(Number.isNaN)) return null;

  const patch: Partial<BuildingElement> = {
    area:    Math.max(0.1, area),
    uValue:  Math.max(0.01, uValue),
    tilt:    Math.min(90, Math.max(0, tilt)),
    azimuth: ((azimuth % 360) + 360) % 360,
  };

  if (element.gValue !== null) {
    const gValue = Number(draft.gValue);
    if (Number.isNaN(gValue)) return null;
    patch.gValue = Math.min(1, Math.max(0, gValue));
  }

  return patch;
}

const EMPTY_DRAFT: EditingDraft = { area: '', uValue: '', gValue: '', tilt: '', azimuth: '' };

/** Accordion of element groups with expandable tables and per-row inline editing. */
export function ElementCompositionSection({
  elements,
  selectedId,
  onSelect,
  onUpdate,
  roofConfig,
}: ElementCompositionSectionProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    wall: false, roof: false, floor: false, window: false, door: false,
  });
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<EditingDraft>(EMPTY_DRAFT);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const grouped    = getGroupedElements(elements);
  const roofInfo   = getRoofGroupInfo(roofConfig);
  const types      = (Object.keys(grouped) as ElementGroupKey[]).filter((t) => grouped[t].length > 0);
  const activeType = types.find((t) => expandedGroups[t]) ?? null;

  const toggleGroup = (type: string) => {
    const willExpand = !expandedGroups[type];
    setExpandedGroups((prev) => {
      const allClosed = Object.fromEntries(Object.keys(prev).map((k) => [k, false]));
      return { ...allClosed, [type]: !prev[type] };
    });
    if (willExpand) {
      requestAnimationFrame(() => scheduleScrollIntoView(cardRefs.current[type]));
    }
  };

  const startEditing = (el: BuildingElement) => {
    setEditingId(el.id);
    setEditingDraft({
      area:    el.area.toFixed(1),
      uValue:  el.uValue.toFixed(2),
      gValue:  el.gValue !== null ? el.gValue.toFixed(2) : '',
      tilt:    String(Math.round(el.tilt)),
      azimuth: String(Math.round(el.azimuth)),
    });
  };

  const cancelEditing = () => { setEditingId(null); setEditingDraft(EMPTY_DRAFT); };

  const saveEditing = (el: BuildingElement) => {
    const patch = clampSurfacePatch(el, editingDraft);
    if (!patch) return;
    onUpdate(el.id, patch);
    cancelEditing();
  };

  const renderHeader = (type: ElementGroupKey, compact: boolean) => {
    const items         = grouped[type];
    const isExpanded    = expandedGroups[type] ?? false;
    const totalArea     = items.reduce((sum, el) => sum + el.area, 0);
    const displayCount  = type === 'roof' ? roofInfo.count : items.length;
    const description   = type === 'roof' ? roofInfo.description : `${totalArea.toFixed(1)} m²`;
    const modifiedCount = items.filter((el) => getElementStatus(el) === 'modified').length;
    const groupStatus: SnapshotStatus = modifiedCount > 0 ? 'modified' : 'default';

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
              {modifiedCount > 0 ? ` · ${modifiedCount} modified` : ''}
            </p>
          )}
        </div>
        {!compact && <SnapshotStatusBadge status={groupStatus} />}
        <div className="rounded-[6px] border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 shrink-0">
          {displayCount}
        </div>
        <ChevronDown className={cn('size-3.5 shrink-0 text-muted-foreground transition-transform duration-300', isExpanded && 'rotate-180')} />
      </button>
    );
  };

  const renderTable = (type: ElementGroupKey) => {
    const items      = grouped[type];
    const isExpanded = expandedGroups[type] ?? false;

    return (
      <div className={cn(
        'grid transition-[grid-template-rows] duration-300 ease-in-out',
        isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
      )}>
        <div className="overflow-hidden">
          <div className="border-t border-slate-200 bg-white/80 px-3 py-3">
            <table className="w-full table-fixed border-collapse text-left bg-white">
              <thead className="text-[10px] uppercase tracking-[0.05em] text-slate-400">
                <tr className="border-b border-slate-200/80">
                  <th className="px-2 py-1.5 font-semibold">Surface</th>
                  <th className="w-24 border-l border-slate-100 px-2 py-1.5 font-semibold">Status</th>
                  <th className="w-20 border-l border-slate-100 px-2 py-1.5 font-semibold">Area</th>
                  <th className="w-[72px] border-l border-slate-100 px-2 py-1.5 font-semibold">U</th>
                  <th className="w-[72px] border-l border-slate-100 px-2 py-1.5 font-semibold">g</th>
                  <th className="w-20 border-l border-slate-100 px-2 py-1.5 font-semibold">Tilt</th>
                  <th className="w-20 border-l border-slate-100 px-2 py-1.5 font-semibold">Az</th>
                  <th className="w-16 border-l border-slate-100 px-2 py-1.5 font-semibold text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="text-[11px] divide-y divide-slate-100">
                {items.map((el) => renderRow(el))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderRow = (el: BuildingElement) => {
    const isEditing    = editingId === el.id;
    const active       = selectedId === el.id || isEditing;
    const elementStatus = getElementStatus(el);

    const patchField = (key: keyof EditingDraft) => (value: string) =>
      setEditingDraft((prev) => ({ ...prev, [key]: value }));

    return (
      <tr
        key={el.id}
        className={cn(
          'transition-colors',
          active
            ? 'bg-primary/10'
            : elementStatus === 'modified'
              ? 'bg-emerald-50/50 hover:bg-emerald-50/70'
              : 'hover:bg-slate-50',
        )}
      >
        <td className="px-2 py-2.5 font-medium text-foreground">
          <span className="truncate">{el.label}</span>
        </td>
        <td className="border-l border-slate-100 px-2 py-2.5 text-muted-foreground">
          <SnapshotStatusBadge status={elementStatus} />
        </td>
        <td className="border-l border-slate-100 px-2 py-2.5 text-muted-foreground">
          {isEditing
            ? <StepperNumberInput value={editingDraft.area}    onChange={patchField('area')}    step={0.1} min={0.1} />
            : el.area.toFixed(1)}
        </td>
        <td className="border-l border-slate-100 px-2 py-2.5 text-muted-foreground">
          {isEditing
            ? <StepperNumberInput value={editingDraft.uValue}  onChange={patchField('uValue')}  step={0.01} min={0.01} />
            : el.uValue.toFixed(2)}
        </td>
        <td className="border-l border-slate-100 px-2 py-2.5 text-muted-foreground">
          {el.gValue === null
            ? '—'
            : isEditing
              ? <StepperNumberInput value={editingDraft.gValue} onChange={patchField('gValue')} step={0.01} min={0} max={1} />
              : el.gValue.toFixed(2)}
        </td>
        <td className="border-l border-slate-100 px-2 py-2.5 text-muted-foreground">
          {isEditing
            ? <StepperNumberInput value={editingDraft.tilt}    onChange={patchField('tilt')}    step={1} min={0} max={90} />
            : `${Math.round(el.tilt)}°`}
        </td>
        <td className="border-l border-slate-100 px-2 py-2.5 text-muted-foreground">
          {isEditing
            ? <StepperNumberInput value={editingDraft.azimuth} onChange={patchField('azimuth')} step={1} min={0} max={360} />
            : `${Math.round(el.azimuth)}°`}
        </td>
        <td className="border-l border-slate-100 px-2 py-2.5 text-right">
          {isEditing ? (
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => saveEditing(el)}
                className="inline-flex size-6 items-center justify-center rounded-[4px] border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100"
                aria-label={`Save ${el.label}`}
              >
                <Check className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="inline-flex size-6 items-center justify-center rounded-[4px] border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
                aria-label={`Cancel editing ${el.label}`}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => startEditing(el)}
              className="inline-flex size-6 items-center justify-center rounded-[4px] border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100"
              aria-label={`Edit ${el.label}`}
            >
              <Pencil className="size-3" />
            </button>
          )}
        </td>
      </tr>
    );
  };

  const getCardClass = (type: ElementGroupKey, highlightModified = false) => {
    const hasModified = grouped[type].some((el) => getElementStatus(el) === 'modified');
    return cn(
      'overflow-hidden rounded-lg border bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07),0_4px_16px_rgba(15,23,42,0.08)]',
      highlightModified && hasModified
        ? 'border-emerald-200 bg-emerald-50/20 shadow-[0_1px_3px_rgba(5,150,105,0.10),0_4px_16px_rgba(5,150,105,0.12)]'
        : 'border-white',
    );
  };

  if (activeType) {
    const sidebarTypes = types.filter((t) => t !== activeType);
    return (
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <div ref={(el) => { cardRefs.current[activeType] = el; }} className={getCardClass(activeType)}>
            {renderHeader(activeType, false)}
            {renderTable(activeType)}
          </div>
        </div>
        <div className="flex w-44 shrink-0 flex-col gap-2">
          {sidebarTypes.map((type) => (
            <div key={type} ref={(el) => { cardRefs.current[type] = el; }} className={getCardClass(type, true)}>
              {renderHeader(type, true)}
              {renderTable(type)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 grid-cols-2 xl:grid-cols-3">
      {types.map((type) => (
        <div key={type} ref={(el) => { cardRefs.current[type] = el; }} className={getCardClass(type)}>
          {renderHeader(type, false)}
          {renderTable(type)}
        </div>
      ))}
    </div>
  );
}
