import React, { useState } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { VerifiedUser, CloudSync, WbSunny, Check, Add, Delete, RestartAlt, Warning } from '@mui/icons-material';
import { T, NumberInput, RangeSlider, FieldRow, FieldLabel, SegmentedControl, SectionLabel } from './ui';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoofSurface {
  id: string;
  name: string;
  tilt: number;
  azimuth: number;
  area: number;
  usefulArea: number;
  useForPV: boolean;
  fromCityData: boolean;
}

export type RoofType = 'flat' | 'mono-pitch' | 'gabled' | 'hipped' | 'v-shape' | 'saw-tooth' | 'custom';

export interface RoofConfig {
  type: RoofType;
  surfaces: RoofSurface[];
  from3DData: boolean;
}

// ─── Roof type definitions ────────────────────────────────────────────────────

interface RoofTypeDef {
  id: RoofType;
  label: string;
  subtitle: string;
  path: string; // SVG cross-section path
}

const ROOF_TYPES: RoofTypeDef[] = [
  { id: 'flat',       label: 'Flat',       subtitle: '1 surface · low-slope',    path: 'M8,32 H72' },
  { id: 'mono-pitch', label: 'Mono-pitch', subtitle: '1 surface · single slope', path: 'M8,34 L72,14' },
  { id: 'gabled',     label: 'Gabled',     subtitle: '2 surfaces · S + N',       path: 'M8,36 L40,10 L72,36' },
  { id: 'hipped',     label: 'Hipped',     subtitle: '4 surfaces · S/N/E/W',     path: 'M8,36 L22,14 L58,14 L72,36' },
  { id: 'v-shape',    label: 'Butterfly',  subtitle: '2 inward slopes · ↓ PV',   path: 'M8,12 L40,36 L72,12' },
  { id: 'saw-tooth',  label: 'Saw-tooth',  subtitle: '3+ S-facing slopes',       path: 'M8,36 L8,18 L26,36 L26,18 L44,36 L44,18 L62,36' },
  { id: 'custom',     label: 'Custom',     subtitle: 'Define manually',           path: 'M8,36 L16,22 L30,28 L46,12 L60,20 L72,36' },
];

// ─── Default surfaces per roof type ──────────────────────────────────────────

const DEFAULT_SURFACES: Record<RoofType, Omit<RoofSurface, 'id'>[]> = {
  flat:        [{ name: 'Flat Roof',   tilt: 3,    azimuth: 180,   area: 90,   usefulArea: 76,   useForPV: true,  fromCityData: false }],
  'mono-pitch':[{ name: 'Main Slope',  tilt: 15,   azimuth: 180,   area: 96,   usefulArea: 82,   useForPV: true,  fromCityData: false }],
  gabled: [
    { name: 'South Slope', tilt: 35, azimuth: 180, area: 52, usefulArea: 44, useForPV: true,  fromCityData: false },
    { name: 'North Slope', tilt: 35, azimuth: 0,   area: 52, usefulArea: 18, useForPV: false, fromCityData: false },
  ],
  hipped: [
    { name: 'South Face',  tilt: 35, azimuth: 180, area: 44, usefulArea: 37, useForPV: true,  fromCityData: false },
    { name: 'North Face',  tilt: 35, azimuth: 0,   area: 44, usefulArea: 12, useForPV: false, fromCityData: false },
    { name: 'East Face',   tilt: 35, azimuth: 90,  area: 28, usefulArea: 20, useForPV: false, fromCityData: false },
    { name: 'West Face',   tilt: 35, azimuth: 270, area: 28, usefulArea: 20, useForPV: false, fromCityData: false },
  ],
  'v-shape': [
    { name: 'East Wing',   tilt: 20, azimuth: 90,  area: 52, usefulArea: 0,  useForPV: false, fromCityData: false },
    { name: 'West Wing',   tilt: 20, azimuth: 270, area: 52, usefulArea: 0,  useForPV: false, fromCityData: false },
  ],
  'saw-tooth': [
    { name: 'S-Slope 1',   tilt: 15, azimuth: 180, area: 30, usefulArea: 26, useForPV: true,  fromCityData: false },
    { name: 'S-Slope 2',   tilt: 15, azimuth: 180, area: 30, usefulArea: 26, useForPV: true,  fromCityData: false },
    { name: 'S-Slope 3',   tilt: 15, azimuth: 180, area: 30, usefulArea: 26, useForPV: true,  fromCityData: false },
  ],
  custom: [],
};

// ─── Demo 3D city data (CityGML LoD2) ────────────────────────────────────────

interface Demo3D { source: string; buildingRef: string; surfaces: Omit<RoofSurface, 'id'>[] }

const DEMO_3D: Partial<Record<RoofType, Demo3D>> = {
  gabled: {
    source: 'CityGML LoD2', buildingRef: 'DEBW_0123456789',
    surfaces: [
      { name: 'South Slope', tilt: 38.5, azimuth: 176.2, area: 54.8, usefulArea: 47.2, useForPV: true,  fromCityData: true },
      { name: 'North Slope', tilt: 38.5, azimuth: 356.2, area: 54.8, usefulArea: 16.4, useForPV: false, fromCityData: true },
    ],
  },
  hipped: {
    source: 'CityGML LoD2', buildingRef: 'DEBW_0123456789',
    surfaces: [
      { name: 'South Face', tilt: 32.1, azimuth: 178.5, area: 44.2, usefulArea: 38.6, useForPV: true,  fromCityData: true },
      { name: 'North Face', tilt: 32.1, azimuth: 358.5, area: 44.2, usefulArea: 12.8, useForPV: false, fromCityData: true },
      { name: 'East Face',  tilt: 32.1, azimuth: 88.5,  area: 28.6, usefulArea: 21.4, useForPV: false, fromCityData: true },
      { name: 'West Face',  tilt: 32.1, azimuth: 268.5, area: 28.6, usefulArea: 18.2, useForPV: false, fromCityData: true },
    ],
  },
  flat: {
    source: 'CityGML LoD2', buildingRef: 'DEBW_0123456789',
    surfaces: [
      { name: 'Flat Roof',  tilt: 2.8, azimuth: 0, area: 92.4, usefulArea: 78.6, useForPV: true,  fromCityData: true },
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function buildSurfaces(type: RoofType, use3D: boolean): RoofSurface[] {
  const demo = DEMO_3D[type];
  const base = use3D && demo ? demo.surfaces : DEFAULT_SURFACES[type];
  return base.map((s) => ({ ...s, id: uid() }));
}

/** PV yield score 0–100 based on tilt and azimuth (simplified). */
function pvScore(tilt: number, az: number) {
  const tiltOpt = 35;
  const tiltS = Math.max(0, 1 - Math.abs(tilt - tiltOpt) / 50);
  const azNorm = ((az % 360) + 360) % 360;
  const azRad  = (azNorm - 180) * (Math.PI / 180);
  const azS    = (Math.cos(azRad) + 1) / 2;
  const score  = Math.round(tiltS * azS * 100);

  if (score >= 78) return { score, label: 'Excellent', color: '#16a34a', bg: '#dcfce7' };
  if (score >= 56) return { score, label: 'Good',      color: '#65a30d', bg: '#ecfccb' };
  if (score >= 34) return { score, label: 'Fair',      color: '#ca8a04', bg: '#fef9c3' };
  if (score >= 12) return { score, label: 'Poor',      color: '#ea580c', bg: '#ffedd5' };
  return             { score, label: 'Not suitable', color: '#dc2626', bg: '#fee2e2' };
}

function cardinalDir(az: number) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(((az % 360) + 360) % 360 / 45) % 8];
}

function tiltDesc(t: number) {
  if (t <= 5)  return 'Flat / near-horizontal';
  if (t <= 20) return 'Low-pitch';
  if (t <= 40) return 'Standard pitch (optimal for PV)';
  if (t <= 60) return 'Steep pitch';
  return 'Very steep / near-vertical';
}

// ─── Mini visualisations ──────────────────────────────────────────────────────

function MiniCompass({ azimuth }: { azimuth: number }) {
  const cx = 24, cy = 24, r = 16;
  const rad = (azimuth - 90) * (Math.PI / 180);
  const ax  = cx + r * Math.cos(rad);
  const ay  = cy + r * Math.sin(rad);
  return (
    <svg width={48} height={48} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={22} fill={T.inputBg} stroke={T.border} strokeWidth={1} />
      <circle cx={cx} cy={cy} r={r}  fill="none"    stroke={T.border} strokeWidth={0.6} strokeDasharray="2 3" />
      <line x1={cx} y1={cy} x2={ax} y2={ay} stroke={T.primary} strokeWidth={2} strokeLinecap="round" />
      <circle cx={ax} cy={ay} r={3} fill={T.primary} />
      <circle cx={cx} cy={cy} r={2.5} fill={T.foreground} />
      <circle cx={cx} cy={3}  r={3} fill="#c53030" />
      <text x={cx} y={2.5} textAnchor="middle" fontSize="6" fill="white" fontWeight="700" style={{ userSelect: 'none' }}>N</text>
    </svg>
  );
}

function TiltDiagram({ tilt }: { tilt: number }) {
  const rad = tilt * (Math.PI / 180);
  const bx = 6, by = 38, len = 34;
  const ex  = bx + len * Math.cos(rad);
  const ey  = by - len * Math.sin(rad);
  const ar  = 12;
  const arx = bx + ar * Math.cos(rad);
  const ary = by - ar * Math.sin(rad);
  return (
    <svg width={56} height={48} viewBox="0 0 56 48" style={{ flexShrink: 0 }}>
      <line x1={2} y1={40} x2={54} y2={40} stroke={T.border} strokeWidth={1.5} strokeLinecap="round" />
      <path d={`M ${bx + ar} ${by} A ${ar} ${ar} 0 0 0 ${arx} ${ary}`} fill="none" stroke="#93c5fd" strokeWidth={1.5} />
      <line x1={bx} y1={by} x2={ex} y2={ey} stroke={T.primary} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={bx} cy={by} r={2.5} fill={T.primary} />
      <text x={bx + ar + 8} y={by - 5} fontSize="9" fill={T.primary} fontWeight="600" style={{ userSelect: 'none' }}>
        {tilt.toFixed(1)}°
      </text>
    </svg>
  );
}

// ─── Mini toggle switch (compact) ────────────────────────────────────────────

function MiniToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Box
      onClick={() => onChange(!checked)}
      sx={{
        width:      36, height: 20, borderRadius: 10, flexShrink: 0,
        bgcolor:    checked ? T.primary : T.switchBg,
        position:   'relative', cursor: 'pointer',
        transition: 'background-color 200ms ease',
      }}
    >
      <Box sx={{
        position:   'absolute',
        top:        2, left: checked ? 18 : 2,
        width:      16, height: 16, borderRadius: '50%',
        bgcolor:    'white',
        transition: 'left 200ms ease',
        boxShadow:  '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </Box>
  );
}

// ─── Surface card ──────────────────────────────────────────────────────────────

interface SurfaceCardProps {
  surface: RoofSurface;
  index: number;
  canDelete: boolean;
  onChange: (s: RoofSurface) => void;
  onDelete: () => void;
}

function SurfaceCard({ surface, index, canDelete, onChange, onDelete }: SurfaceCardProps) {
  const pv  = pvScore(surface.tilt, surface.azimuth);
  const dir = cardinalDir(surface.azimuth);

  const update = (patch: Partial<RoofSurface>) => onChange({ ...surface, ...patch });

  // Azimuth direction badge color
  const dirBg    = dir === 'S' ? '#dcfce7' : ['SE', 'SW'].includes(dir) ? '#fef9c3' : T.muted;
  const dirColor = dir === 'S' ? '#16a34a' : ['SE', 'SW'].includes(dir) ? '#92400e' : T.mutedFg;

  return (
    <Box sx={{
      border:       `1.5px solid`,
      borderColor:  surface.useForPV ? `rgba(47,93,138,0.5)` : T.border,
      borderRadius: '8px',
      overflow:     'hidden',
      bgcolor:       T.card,
      transition:   'border-color 0.2s',
    }}>
      {/* Card header */}
      <Box sx={{
        px:         1.25, py: '8px',
        bgcolor:    surface.useForPV ? 'rgba(47,93,138,0.05)' : T.inputBg,
        borderBottom: `1px solid ${T.border}`,
        display:    'flex', alignItems: 'center', gap: '6px',
      }}>
        {/* Editable name */}
        <Box
          component="input"
          type="text"
          value={surface.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ name: e.target.value })}
          sx={{
            flex: 1, border: 'none', outline: 'none', bgcolor: 'transparent',
            fontSize: 12, fontWeight: 600,
            color: surface.useForPV ? T.primary : T.foreground,
            fontFamily: 'inherit', minWidth: 0,
          }}
        />

        {/* 3D city data badge */}
        {surface.fromCityData && (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: '3px',
            px: '5px', py: '2px', borderRadius: '4px',
            bgcolor: '#eff6ff', border: '1px solid #bfdbfe',
            flexShrink: 0,
          }}>
            <VerifiedUser sx={{ fontSize: '10px !important', color: '#1d4ed8' }} />
            <Typography sx={{ fontSize: 9, fontWeight: 600, color: '#1d4ed8' }}>3D</Typography>
          </Box>
        )}

        {/* PV score badge */}
        <Box sx={{
          px: '5px', py: '2px', borderRadius: '4px', flexShrink: 0,
          bgcolor: pv.bg,
        }}>
          <Typography sx={{ fontSize: 9, fontWeight: 600, color: pv.color }}>
            {pv.label} {pv.score}%
          </Typography>
        </Box>

        {/* Delete */}
        {canDelete && (
          <Box
            onClick={onDelete}
            sx={{
              width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '4px', cursor: 'pointer', flexShrink: 0,
              color: T.mutedFg, '&:hover': { bgcolor: '#fee2e2', color: '#dc2626' },
              '& svg': { fontSize: '14px !important' },
            }}
          >
            <Delete />
          </Box>
        )}
      </Box>

      {/* Card body */}
      <Box sx={{ p: 1.25, display: 'flex', flexDirection: 'column', gap: 1.25 }}>

        {/* ── Pitch ── */}
        <Box sx={{
          bgcolor: T.inputBg, borderRadius: '6px', p: '10px',
          border: `1px solid ${T.border}`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <TiltDiagram tilt={Math.round(surface.tilt)} />
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '4px' }}>
                <Typography sx={{ fontSize: 10, fontWeight: 600, color: T.mutedFg, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  PITCH
                </Typography>
                <NumberInput
                  value={parseFloat(surface.tilt.toFixed(1))}
                  onChange={(v) => update({ tilt: Math.min(90, Math.max(0, v)), fromCityData: false })}
                  unit="°" min={0} max={90} step={0.5}
                  width={80}
                />
              </Box>
              <RangeSlider
                value={surface.tilt}
                min={0} max={90} step={0.5}
                marks={[
                  { value: 0,  label: '0° flat'  },
                  { value: 15, label: '15°'       },
                  { value: 30, label: '30°'       },
                  { value: 45, label: '45°'       },
                  { value: 90, label: '90° wall'  },
                ]}
                onChange={(v) => update({ tilt: v, fromCityData: false })}
              />
              <Typography sx={{ fontSize: 10, color: T.mutedFg, mt: '3px' }}>
                {tiltDesc(surface.tilt)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* ── Azimuth ── */}
        <Box sx={{
          bgcolor: T.inputBg, borderRadius: '6px', p: '10px',
          border: `1px solid ${T.border}`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <MiniCompass azimuth={surface.azimuth} />
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '4px', gap: '6px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 600, color: T.mutedFg, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    AZIMUTH
                  </Typography>
                  <Box sx={{ px: '5px', py: '2px', borderRadius: '4px', bgcolor: dirBg }}>
                    <Typography sx={{ fontSize: 9, fontWeight: 700, color: dirColor }}>{dir}</Typography>
                  </Box>
                </Box>
                <NumberInput
                  value={parseFloat(surface.azimuth.toFixed(1))}
                  onChange={(v) => update({ azimuth: ((v % 360) + 360) % 360, fromCityData: false })}
                  unit="°" min={0} max={360} step={0.5}
                  width={80}
                />
              </Box>
              <RangeSlider
                value={surface.azimuth}
                min={0} max={360} step={1}
                marks={[
                  { value: 0,   label: 'N'  },
                  { value: 90,  label: 'E'  },
                  { value: 180, label: 'S ★' },
                  { value: 270, label: 'W'  },
                  { value: 360, label: 'N'  },
                ]}
                onChange={(v) => update({ azimuth: v, fromCityData: false })}
              />
            </Box>
          </Box>
        </Box>

        {/* ── Areas ── */}
        <FieldRow>
          <Tooltip
            title={<Typography sx={{ fontSize: 11 }}>Total gross surface area of this roof face.</Typography>}
            placement="top" arrow
          >
            <Box>
              <NumberInput
                label="Gross area"
                value={surface.area}
                onChange={(v) => update({ area: v, usefulArea: Math.min(surface.usefulArea, v) })}
                unit="m²" step={0.1} min={0}
              />
            </Box>
          </Tooltip>
          <Tooltip
            title={
              <Typography sx={{ fontSize: 11 }}>
                Net area usable for PV — after setbacks, chimneys, skylight exclusions. Max: {surface.area.toFixed(1)} m².
              </Typography>
            }
            placement="top" arrow
          >
            <Box>
              <NumberInput
                label="Useful (PV)"
                value={surface.usefulArea}
                onChange={(v) => update({ usefulArea: Math.min(v, surface.area) })}
                unit="m²" step={0.1} min={0}
              />
            </Box>
          </Tooltip>
        </FieldRow>

        {/* ── PV toggle ── */}
        <Box sx={{
          px: '10px', py: '8px', borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
          bgcolor:    surface.useForPV ? 'rgba(22,163,74,0.07)' : T.inputBg,
          border:     `1px solid`,
          borderColor: surface.useForPV ? 'rgba(22,163,74,0.35)' : T.border,
          transition: 'all 0.2s',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <WbSunny sx={{ fontSize: '14px !important', color: surface.useForPV ? '#ca8a04' : T.mutedFg }} />
            <Box>
              <Typography sx={{ fontSize: 11, color: surface.useForPV ? T.foreground : T.mutedFg, fontWeight: surface.useForPV ? 500 : 400 }}>
                Include in PV simulation
              </Typography>
              {surface.useForPV && (
                <Typography sx={{ fontSize: 10, color: '#16a34a' }}>
                  {surface.usefulArea.toFixed(1)} m² contributing
                </Typography>
              )}
            </Box>
          </Box>
          <MiniToggle checked={surface.useForPV} onChange={(v) => update({ useForPV: v })} />
        </Box>
      </Box>
    </Box>
  );
}

// ─── Main RoofConfigurator ────────────────────────────────────────────────────

interface RoofConfiguratorProps {
  config: RoofConfig;
  onChange: (c: RoofConfig) => void;
}

export function RoofConfigurator({ config, onChange }: RoofConfiguratorProps) {
  const demo3D = DEMO_3D[config.type];
  const has3D  = Boolean(demo3D);
  const [showWarning, setShowWarning] = useState(false);

  // Check if any surfaces were modified from original 3D data
  const hasModifiedSurfaces = config.from3DData && config.surfaces.some((s) => !s.fromCityData);

  // ── Roof type change ────────────────────────────────────────────────────────
  const handleTypeChange = (type: RoofType) => {
    const demo = DEMO_3D[type];
    onChange({ type, from3DData: Boolean(demo), surfaces: buildSurfaces(type, Boolean(demo)) });
    setShowWarning(false);
  };

  const handleUse3D  = () => {
    if (!demo3D) return;
    onChange({ ...config, from3DData: true, surfaces: demo3D.surfaces.map((s) => ({ ...s, id: uid() })) });
    setShowWarning(false);
  };
  const handleManual = () => {
    onChange({ ...config, from3DData: false, surfaces: DEFAULT_SURFACES[config.type].map((s) => ({ ...s, id: uid() })) });
    setShowWarning(false);
  };

  // ── Reset surfaces to original 3D or default ─────────────────────────────────
  const handleReset = () => {
    if (config.from3DData && demo3D) {
      onChange({ ...config, surfaces: demo3D.surfaces.map((s) => ({ ...s, id: uid() })) });
    } else {
      onChange({ ...config, surfaces: DEFAULT_SURFACES[config.type].map((s) => ({ ...s, id: uid() })) });
    }
    setShowWarning(false);
  };

  // ── Surface CRUD ─────────────────────────────────────────────────────────────
  const updateSurface = (id: string, updated: RoofSurface) =>
    onChange({ ...config, surfaces: config.surfaces.map((s) => (s.id === id ? updated : s)) });

  const deleteSurface = (id: string) =>
    onChange({ ...config, surfaces: config.surfaces.filter((s) => s.id !== id) });

  const addSurface = () => {
    // Show warning if trying to add surface when using 3D data
    if (config.from3DData) {
      setShowWarning(true);
      return;
    }
    onChange({
      ...config,
      surfaces: [...config.surfaces, {
        id: uid(), name: `Surface ${config.surfaces.length + 1}`,
        tilt: 30, azimuth: 180, area: 20, usefulArea: 17, useForPV: true, fromCityData: false,
      }],
    });
  };

  // ── Summary ─────────────────────────────────────────────────────────────────
  const totalArea = config.surfaces.reduce((s, r) => s + r.area, 0);
  const pvSurfs   = config.surfaces.filter((s) => s.useForPV);
  const pvArea    = pvSurfs.reduce((s, r) => s + r.usefulArea, 0);
  const coverPct  = totalArea > 0 ? Math.round((pvArea / totalArea) * 100) : 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <WbSunny sx={{ fontSize: '16px !important', color: '#ca8a04' }} />
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: T.foreground }}>
          Roof Geometry &amp; PV Surfaces
        </Typography>
      </Box>

      {/* ── 3D data banner ── */}
      {has3D ? (
        config.from3DData ? (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: '8px',
            bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px',
            px: '10px', py: '7px',
          }}>
            <VerifiedUser sx={{ fontSize: '14px !important', color: '#1d4ed8', flexShrink: 0 }} />
            <Typography sx={{ fontSize: 11, color: '#1d4ed8', flex: 1 }}>
              <strong>{demo3D!.source}</strong> · {demo3D!.buildingRef} · Inferred from 3D city model
            </Typography>
            <Box
              onClick={handleManual}
              sx={{
                px: '8px', py: '3px', borderRadius: '4px', cursor: 'pointer',
                border: '1px solid #bfdbfe',
                '&:hover': { bgcolor: '#dbeafe' },
                flexShrink: 0,
              }}
            >
              <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#1d4ed8' }}>Edit manually</Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: '8px',
            bgcolor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px',
            px: '10px', py: '7px',
          }}>
            <Typography sx={{ fontSize: 11, color: '#92400e', flex: 1 }}>
              Manual mode — <strong>{demo3D!.source}</strong> data available for this roof type.
            </Typography>
            <Box
              onClick={handleUse3D}
              sx={{
                display: 'flex', alignItems: 'center', gap: '4px',
                px: '8px', py: '3px', borderRadius: '4px', cursor: 'pointer',
                border: '1px solid #fde68a',
                '&:hover': { bgcolor: '#fef3c7' },
                flexShrink: 0,
              }}
            >
              <CloudSync sx={{ fontSize: '12px !important', color: '#92400e' }} />
              <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#92400e' }}>Use 3D data</Typography>
            </Box>
          </Box>
        )
      ) : (
        <Box sx={{
          bgcolor: T.inputBg, border: `1px solid ${T.border}`, borderRadius: '6px',
          px: '10px', py: '7px',
        }}>
          <Typography sx={{ fontSize: 11, color: T.mutedFg }}>
            No 3D city data found for this building — define roof geometry manually below.
          </Typography>
        </Box>
      )}

      {/* ── Roof type picker ── */}
      <Box>
        <Typography sx={{ fontSize: 10, fontWeight: 600, color: T.mutedFg, letterSpacing: '0.08em', textTransform: 'uppercase', mb: '6px' }}>
          ROOF TYPE
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {ROOF_TYPES.map((rt) => {
            const sel = config.type === rt.id;
            return (
              <Box
                key={rt.id}
                onClick={() => handleTypeChange(rt.id)}
                sx={{
                  cursor: 'pointer', borderRadius: '8px', p: '8px 10px',
                  border: '1.5px solid',
                  borderColor: sel ? T.primary : T.border,
                  bgcolor:     sel ? 'rgba(47,93,138,0.06)' : T.card,
                  transition:  'all 0.15s',
                  display:     'flex', alignItems: 'center', gap: '8px',
                  '&:hover':   { borderColor: T.primary, bgcolor: 'rgba(47,93,138,0.04)' },
                }}
              >
                {/* Cross-section preview */}
                <svg width={48} height={30} viewBox="0 0 80 50" style={{ flexShrink: 0 }}>
                  <rect width={80} height={50} fill={sel ? 'rgba(47,93,138,0.1)' : T.inputBg} rx={4} />
                  <line x1={8}  y1={36} x2={8}  y2={44} stroke={T.border} strokeWidth={1.5} />
                  <line x1={72} y1={36} x2={72} y2={44} stroke={T.border} strokeWidth={1.5} />
                  <line x1={8}  y1={44} x2={72} y2={44} stroke={T.border} strokeWidth={1.5} />
                  <path d={rt.path} fill="none"
                    stroke={sel ? T.primary : T.mutedFg}
                    strokeWidth={sel ? 2.2 : 1.8}
                    strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: sel ? 600 : 500, color: sel ? T.primary : T.foreground }}>
                    {rt.label}
                  </Typography>
                  <Typography sx={{ fontSize: 9, color: T.mutedFg }}>
                    {rt.subtitle}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* ── Surfaces ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: 10, fontWeight: 600, color: T.mutedFg, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          SURFACES ({config.surfaces.length})
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Reset button - show if surfaces have been modified */}
          {hasModifiedSurfaces && (
            <Box
              onClick={handleReset}
              sx={{
                display: 'flex', alignItems: 'center', gap: '4px',
                px: '8px', py: '3px', borderRadius: '4px', cursor: 'pointer',
                border: `1px solid ${T.border}`,
                '&:hover': { bgcolor: '#fef3c7' },
                '& svg': { fontSize: '12px !important', color: T.foreground },
              }}
            >
              <RestartAlt />
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: T.foreground }}>Reset</Typography>
            </Box>
          )}
          <Box
            onClick={addSurface}
            sx={{
              display: 'flex', alignItems: 'center', gap: '4px',
              px: '8px', py: '3px', borderRadius: '4px', cursor: 'pointer',
              border: `1px solid ${T.border}`,
              '&:hover': { bgcolor: T.muted },
              '& svg': { fontSize: '12px !important', color: T.foreground },
            }}
          >
            <Add />
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: T.foreground }}>Add surface</Typography>
          </Box>
        </Box>
      </Box>

      {config.surfaces.length === 0 ? (
        <Box sx={{
          border: `1px dashed ${T.border}`, borderRadius: '8px', p: 2,
          textAlign: 'center',
        }}>
          <Typography sx={{ fontSize: 11, color: T.mutedFg }}>
            No surfaces — add one or select a roof type above.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {config.surfaces.map((surf, i) => (
            <SurfaceCard
              key={surf.id}
              surface={surf}
              index={i}
              canDelete={config.surfaces.length > 1 || config.type === 'custom'}
              onChange={(updated) => updateSurface(surf.id, updated)}
              onDelete={() => deleteSurface(surf.id)}
            />
          ))}
        </Box>
      )}

      {/* ── PV summary ── */}
      <Box sx={{
        border:  `1.5px solid`,
        borderColor: pvArea > 0 ? 'rgba(22,163,74,0.4)' : T.border,
        bgcolor: pvArea > 0 ? 'rgba(22,163,74,0.05)' : T.inputBg,
        borderRadius: '8px',
        p: '10px 12px',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px', mb: 1 }}>
          <WbSunny sx={{ fontSize: '13px !important', color: pvArea > 0 ? '#ca8a04' : T.mutedFg }} />
          <Typography sx={{ fontSize: 10, fontWeight: 600, color: pvArea > 0 ? T.foreground : T.mutedFg, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            PV Simulation Summary
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', mb: pvSurfs.length > 0 ? 1 : 0 }}>
          {[
            { label: 'Total roof', value: `${totalArea.toFixed(1)} m²`, hl: false },
            { label: 'PV area',    value: `${pvArea.toFixed(1)} m²`,    hl: pvArea > 0 },
            { label: 'Coverage',   value: `${coverPct}%`,               hl: pvArea > 0 },
          ].map((row) => (
            <Box key={row.label}>
              <Typography sx={{ fontSize: 10, color: T.mutedFg, display: 'block' }}>{row.label}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: row.hl ? '#16a34a' : T.foreground }}>
                {row.value}
              </Typography>
            </Box>
          ))}
        </Box>

        {pvSurfs.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {pvSurfs.map((s) => (
              <Box key={s.id} sx={{
                display: 'flex', alignItems: 'center', gap: '3px',
                px: '6px', py: '3px', borderRadius: '4px',
                bgcolor: '#dcfce7',
              }}>
                <Check sx={{ fontSize: '10px !important', color: '#16a34a' }} />
                <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#16a34a' }}>
                  {s.name} · {s.usefulArea.toFixed(1)} m²
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* ── Warning for adding surfaces in 3D mode ── */}
      {showWarning && (
        <Box sx={{
          border: `1px solid ${T.warning}`, borderRadius: '8px', p: 2,
          textAlign: 'center',
          mt: 1,
        }}>
          <Typography sx={{ fontSize: 11, color: T.warning }}>
            <Warning sx={{ fontSize: '14px !important', color: T.warning, mr: 1 }} />
            Adding surfaces in 3D mode will overwrite the original data. Consider switching to manual mode first.
          </Typography>
          <Box
            onClick={handleReset}
            sx={{
              display: 'flex', alignItems: 'center', gap: '4px',
              px: '8px', py: '3px', borderRadius: '4px', cursor: 'pointer',
              border: `1px solid ${T.warning}`,
              '&:hover': { bgcolor: '#fef3c7' },
              flexShrink: 0,
              mt: 1,
            }}
          >
            <RestartAlt sx={{ fontSize: '12px !important', color: T.warning }} />
            <Typography sx={{ fontSize: 10, fontWeight: 600, color: T.warning }}>Reset to original</Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ─── Default export ────────────────────────────────────────────────────────────

export const DEFAULT_ROOF_CONFIG: RoofConfig = {
  type: 'gabled',
  from3DData: true,
  surfaces: [
    { id: 'r1', name: 'South Slope', tilt: 38.5, azimuth: 176.2, area: 54.8, usefulArea: 47.2, useForPV: true,  fromCityData: true },
    { id: 'r2', name: 'North Slope', tilt: 38.5, azimuth: 356.2, area: 54.8, usefulArea: 16.4, useForPV: false, fromCityData: true },
  ],
};