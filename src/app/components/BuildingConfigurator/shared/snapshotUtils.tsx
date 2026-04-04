// Utilities for comparing current building state against the default estimate
// and classifying the result as 'default' or 'modified'.

import React from 'react';
import { cn } from '@/lib/utils';
import type { BuildingElement } from '../configure/BuildingVisualization';
import {
  DEFAULT_ELEMENTS,
  DEFAULT_GENERAL,
  DEFAULT_TOTAL_AREA,
  DEFAULT_AVG_U_VALUE,
} from './buildingDefaults';

export type SnapshotStatus = 'default' | 'modified';

/** Returns a Tailwind class string for the given snapshot status. */
export function getSnapshotStatusClassName(status: SnapshotStatus): string {
  return status === 'modified'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-slate-200 bg-slate-100 text-slate-600';
}

/** Returns true when two floats are equal within `epsilon`. */
export function isCloseTo(a: number, b: number, epsilon = 1e-6): boolean {
  return Math.abs(a - b) <= epsilon;
}

/** Returns 'modified' if any property of `element` differs from its default. */
export function getElementStatus(element: BuildingElement): SnapshotStatus {
  const def = DEFAULT_ELEMENTS[element.id];

  if (!def) return 'modified';

  const matches = isCloseTo(element.area, def.area)
    && isCloseTo(element.uValue, def.uValue)
    && isCloseTo(element.tilt, def.tilt)
    && isCloseTo(element.azimuth, def.azimuth)
    && (
      (element.gValue === null && def.gValue === null)
      || (element.gValue !== null && def.gValue !== null && isCloseTo(element.gValue, def.gValue))
    );

  return matches ? 'default' : 'modified';
}

/** Small pill badge showing whether a value matches or diverges from the estimate. */
export function SnapshotStatusBadge({ status }: { status: SnapshotStatus }) {
  return (
    <span className={cn(
      'inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold capitalize',
      getSnapshotStatusClassName(status),
    )}>
      {status}
    </span>
  );
}

// Maps area-weighted avg U-value to a human-readable thermal efficiency label.
export function getThermalRating(u: number): { label: string; color: string; bg: string } {
  if (u < 0.20) return { label: 'Excellent', color: '#059669', bg: '#ecfdf5' };
  if (u < 0.30) return { label: 'Good',      color: '#16a34a', bg: '#f0fdf4' };
  if (u < 0.50) return { label: 'Fair',      color: '#d97706', bg: '#fffbeb' };
  if (u < 0.80) return { label: 'Poor',      color: '#dc2626', bg: '#fef2f2' };
  return             { label: 'Very Poor',   color: '#9f1239', bg: '#fff1f2' };
}

/** Builds the rows for the building info table, flagging each value against the default. */
export function buildSnapshotRows(
  general: typeof DEFAULT_GENERAL,
  elements: Record<string, BuildingElement>,
  totalArea: number,
): Array<{ label: string; value: string; status: SnapshotStatus }> {
  return [
    {
      label: 'Type',
      value: general.buildingType,
      status: general.buildingType === DEFAULT_GENERAL.buildingType ? 'default' : 'modified',
    },
    {
      label: 'Construction',
      value: general.constructionPeriod,
      status: general.constructionPeriod === DEFAULT_GENERAL.constructionPeriod ? 'default' : 'modified',
    },
    {
      label: 'Country',
      value: general.country,
      status: general.country === DEFAULT_GENERAL.country ? 'default' : 'modified',
    },
    {
      label: 'Floor area',
      value: `${general.floorArea.toFixed(1)} m²`,
      status: isCloseTo(general.floorArea, DEFAULT_GENERAL.floorArea) ? 'default' : 'modified',
    },
    {
      label: 'Volume',
      value: `${(general.floorArea * general.roomHeight).toFixed(0)} m³`,
      status: isCloseTo(general.floorArea, DEFAULT_GENERAL.floorArea)
        && isCloseTo(general.roomHeight, DEFAULT_GENERAL.roomHeight)
        ? 'default'
        : 'modified',
    },
    {
      label: 'Envelope',
      value: `${totalArea.toFixed(1)} m²  ·  ${Object.keys(elements).length} surfaces`,
      status: isCloseTo(totalArea, DEFAULT_TOTAL_AREA)
        && Object.keys(elements).length === Object.keys(DEFAULT_ELEMENTS).length
        ? 'default'
        : 'modified',
    },
  ];
}

/** Returns the snapshot status for the overall thermal efficiency metric. */
export function getThermalEfficiencyStatus(avgUValue: number): SnapshotStatus {
  return isCloseTo(avgUValue, DEFAULT_AVG_U_VALUE) ? 'default' : 'modified';
}
