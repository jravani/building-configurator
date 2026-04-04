// Utilities for grouping and describing building envelope elements.
// Used by both ElementList (configure sidebar) and ElementCompositionSection (overview).

import type { BuildingElement } from '../configure/BuildingVisualization';
import type { RoofConfig } from '../configure/RoofConfigurator';

export type ElementGroupKey = 'wall' | 'window' | 'door' | 'roof' | 'floor';

export const ELEMENT_GROUP_LABELS: Record<ElementGroupKey, string> = {
  wall:   'Walls',
  window: 'Windows',
  door:   'Doors',
  roof:   'Roof',
  floor:  'Floor',
};

/** Partitions the elements record into buckets by type. */
export function getGroupedElements(
  elements: Record<string, BuildingElement>,
): Record<ElementGroupKey, BuildingElement[]> {
  return {
    wall:   Object.values(elements).filter((el) => el.type === 'wall'),
    window: Object.values(elements).filter((el) => el.type === 'window'),
    door:   Object.values(elements).filter((el) => el.type === 'door'),
    roof:   Object.values(elements).filter((el) => el.type === 'roof'),
    floor:  Object.values(elements).filter((el) => el.type === 'floor'),
  };
}

/** Returns the surface count and a short description string for a roof group. */
export function getRoofGroupInfo(roofConfig: RoofConfig): { count: number; description: string } {
  const count = roofConfig.surfaces.length;
  const descriptions: Record<string, string> = {
    flat:          '1 surface · low-slope',
    'mono-pitch':  '1 surface · single slope',
    gabled:        '2 surfaces · S + N',
    hipped:        '4 surfaces · S/N/E/W',
    'v-shape':     '2 surfaces · inward slopes',
    'saw-tooth':   `${count} surfaces · S-facing`,
    custom:        `${count} surface${count !== 1 ? 's' : ''} · custom`,
  };

  return {
    count,
    description: descriptions[roofConfig.type] ?? `${count} surfaces`,
  };
}
