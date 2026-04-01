import React, { useState, useRef } from 'react';
import { Box, Typography, Tooltip, Alert } from '@mui/material';
import { FileDownload, FileUpload, Close, Apartment, RestartAlt, Check, Roofing } from '@mui/icons-material';

import { BuildingVisualization, BuildingElement, SVG_ELEMENTS } from './BuildingVisualization';
import { RoofConfigurator, RoofConfig, DEFAULT_ROOF_CONFIG } from './RoofConfigurator';
import {
  T, TYPE_BADGES, ELEMENT_DOTS,
  ConfiguratorStyles, NumberInput, SelectInput, SegmentedControl,
  RangeSlider, ToggleSwitch, InfoTip,
  SectionLabel, ConfigSection, FieldRow, FieldLabel, TypeBadge, InlineStepper,
} from './ui';

// ─── Data ────────────────────────────────────────────────────────────────────

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

const ALL_ELEMENT_IDS = [
  'south_wall', 'east_wall', 'north_wall', 'west_wall',
  'roof', 'floor', 'south_window_1', 'south_window_2', 'east_window', 'door',
];

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
};

const SVG_IDS = new Set(SVG_ELEMENTS.map((e) => e.id));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtR(u: number) { return u > 0 ? (1 / u).toFixed(3) : '∞'; }

function azimuthLabel(az: number) {
  if (az < 22.5 || az >= 337.5) return 'North-facing';
  if (az < 67.5)  return 'NE-facing';
  if (az < 112.5) return 'East-facing';
  if (az < 157.5) return 'SE-facing';
  if (az < 202.5) return 'South-facing';
  if (az < 247.5) return 'SW-facing';
  if (az < 292.5) return 'West-facing';
  return 'NW-facing';
}

function tiltLabel(t: number) {
  if (t <= 5)  return 'Horizontal';
  if (t <= 25) return 'Slightly pitched';
  if (t <= 55) return 'Pitched';
  if (t <= 80) return 'Steeply pitched';
  return 'Vertical';
}

// ─── Small header icon-button ─────────────────────────────────────────────────

function HeaderBtn({
  onClick, children, tooltip,
}: { onClick?: () => void; children: React.ReactNode; tooltip?: string }) {
  const btn = (
    <Box
      onClick={onClick}
      sx={{
        width:        28, height: 28,
        display:      'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '6px',
        cursor:       'pointer',
        color:         T.mutedFg,
        '&:hover':    { bgcolor: T.muted },
        flexShrink:   0,
        transition:   'background-color 0.12s',
        '& svg':      { fontSize: '16px !important' },
      }}
    >
      {children}
    </Box>
  );
  if (!tooltip) return btn;
  return <Tooltip title={<Typography sx={{ fontSize: 11 }}>{tooltip}</Typography>} placement="bottom" arrow>{btn}</Tooltip>;
}

// ─── Compact compass widget ───────────────────────────────────────────────────

function CompassWidget({ azimuth, onChange }: { azimuth: number; onChange: (v: number) => void }) {
  const cx = 38, cy = 38, r = 26;
  const rad = (azimuth - 90) * (Math.PI / 180);
  const ax = cx + r * Math.cos(rad);
  const ay = cy + r * Math.sin(rad);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = 76 / rect.width;
    const sy = 76 / rect.height;
    const dx = (e.clientX - rect.left) * sx - cx;
    const dy = (e.clientY - rect.top) * sy - cy;
    let a = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (a < 0) a += 360;
    if (a >= 360) a -= 360;
    onChange(Math.round(a));
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <svg
        width={76} height={76}
        viewBox="0 0 76 76"
        style={{ cursor: 'crosshair', flexShrink: 0 }}
        onClick={handleClick}
      >
        <circle cx={cx} cy={cy} r={r + 8} fill={T.inputBg} stroke={T.border} strokeWidth={1} />
        {/* Cardinal ticks */}
        {[0, 90, 180, 270].map((deg) => {
          const tr = (deg - 90) * (Math.PI / 180);
          return (
            <line key={deg}
              x1={cx + (r + 2) * Math.cos(tr)} y1={cy + (r + 2) * Math.sin(tr)}
              x2={cx + (r + 7) * Math.cos(tr)} y2={cy + (r + 7) * Math.sin(tr)}
              stroke={deg === 0 ? '#c53030' : T.border} strokeWidth={1.5}
            />
          );
        })}
        {/* Azimuth arrow */}
        <line x1={cx} y1={cy} x2={ax} y2={ay} stroke={T.primary} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={ax} cy={ay} r={4} fill={T.primary} />
        <circle cx={cx} cy={cy} r={3} fill={T.foreground} />
        {/* Labels */}
        <text x={cx}   y={5}    textAnchor="middle" fontSize="8" fill="#c53030" fontWeight="700" style={{ userSelect: 'none' }}>N</text>
        <text x={cx}   y={74}   textAnchor="middle" fontSize="8" fill={T.mutedFg} style={{ userSelect: 'none' }}>S</text>
        <text x={73}   y={cy+3} textAnchor="middle" fontSize="8" fill={T.mutedFg} style={{ userSelect: 'none' }}>E</text>
        <text x={4}    y={cy+3} textAnchor="middle" fontSize="8" fill={T.mutedFg} style={{ userSelect: 'none' }}>W</text>
      </svg>

      <Box sx={{ flex: 1 }}>
        <NumberInput
          value={azimuth}
          onChange={(v) => {
            let a = ((v % 360) + 360) % 360;
            onChange(Math.round(a));
          }}
          unit="°"
          min={0} max={359} step={1}
        />
        <Typography sx={{ fontSize: 10, color: T.mutedFg, mt: '4px' }}>
          {azimuthLabel(azimuth)}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Element attribute panel ───────────────────────────────────────────────────

interface ElementPanelProps {
  selectedId: string;
  elements: Record<string, BuildingElement>;
  onUpdate: (id: string, patch: Partial<BuildingElement>) => void;
  onDeselect: () => void;
  roofConfig: RoofConfig;
  onRoofConfigChange: (c: RoofConfig) => void;
}

function ElementPanel({ selectedId, elements, onUpdate, onDeselect, roofConfig, onRoofConfigChange }: ElementPanelProps) {
  const el = elements[selectedId];
  if (!el) return null;

  const rValue = el.uValue > 0 ? parseFloat((1 / el.uValue).toFixed(4)) : 0;
  const badge = TYPE_BADGES[el.type] ?? { border: T.border };
  const isRoof = selectedId === 'roof';

  return (
    <Box sx={{
      border:       `2px solid rgba(47,93,138,0.6)`,
      borderRadius: '12px',
      bgcolor:       T.card,
      mb:            1.5,
      overflow:     'hidden',
    }}>
      {/* Panel header row */}
      <Box sx={{
        display:       'flex',
        alignItems:    'center',
        px:            1.5,
        py:            1.25,
        borderBottom:  `1px solid ${T.border}`,
        gap:           '8px',
      }}>
        <TypeBadge type={el.type} />
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: T.foreground, flex: 1 }}>
          {el.label}
        </Typography>
        <Box
          onClick={onDeselect}
          sx={{
            width: 22, height: 22, display: 'flex', alignItems: 'center',
            justifyContent: 'center', borderRadius: '4px', cursor: 'pointer',
            color: T.mutedFg, '&:hover': { bgcolor: T.muted }, flexShrink: 0,
            '& svg': { fontSize: '15px !important' },
          }}
        >
          <Close />
        </Box>
      </Box>

      {/* Fields */}
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Area */}
        <NumberInput
          label="Area"
          tip="Net surface area of this building element."
          value={el.area}
          onChange={(v) => onUpdate(el.id, { area: v })}
          unit="m²"
          step={0.1} min={0}
        />

        {/* U-value + R-value */}
        <FieldRow>
          <NumberInput
            label="U-value"
            tip="Thermal transmittance (W/m²K). Changing U auto-updates R."
            value={el.uValue}
            onChange={(v) => v > 0 && onUpdate(el.id, { uValue: v })}
            unit="W/m²K"
            step={0.01} min={0.01}
          />
          <NumberInput
            label="R-value"
            tip="Thermal resistance = 1 / U-value. Changing R auto-updates U."
            value={rValue}
            onChange={(v) => v > 0 && onUpdate(el.id, { uValue: parseFloat((1 / v).toFixed(4)) })}
            unit="m²K/W"
            step={0.01} min={0.01}
          />
        </FieldRow>

        {/* g-value — windows only */}
        {el.gValue !== null && (
          <NumberInput
            label="g-value (SHGC)"
            tip="Solar Heat Gain Coefficient — fraction of solar radiation transmitted. Typical 0.30–0.65."
            value={el.gValue ?? 0}
            onChange={(v) => onUpdate(el.id, { gValue: Math.min(1, Math.max(0, v)) })}
            unit="—"
            step={0.01} min={0} max={1}
          />
        )}

        {/* Tilt */}
        <Box>
          <FieldLabel tip="Angle from horizontal: 0° = flat roof/floor, 90° = wall or window.">
            Tilt
            {isRoof && (
              <Box component="span" sx={{ ml: 1, fontSize: 10, color: T.mutedFg, fontWeight: 400 }}>
                (assembly — for heat-loss)
              </Box>
            )}
          </FieldLabel>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: '2px' }}>
            <Box sx={{ flex: 1 }}>
              <RangeSlider
                value={el.tilt}
                min={0} max={90} step={1}
                marks={[{ value: 0, label: '0°' }, { value: 30, label: '30°' }, { value: 60, label: '60°' }, { value: 90, label: '90°' }]}
                onChange={(v) => onUpdate(el.id, { tilt: v })}
              />
            </Box>
            <NumberInput
              value={el.tilt}
              onChange={(v) => onUpdate(el.id, { tilt: Math.min(90, Math.max(0, v)) })}
              unit="°"
              min={0} max={90} step={1}
              width={80}
            />
          </Box>
          <Typography sx={{ fontSize: 10, color: T.mutedFg, mt: '3px' }}>
            {tiltLabel(el.tilt)}
          </Typography>
        </Box>

        {/* Azimuth */}
        <Box>
          <FieldLabel tip="Compass direction the surface faces. 0° = North, 90° = East, 180° = South, 270° = West. Click the compass disc to set.">
            Azimuth
          </FieldLabel>
          <CompassWidget azimuth={el.azimuth} onChange={(v) => onUpdate(el.id, { azimuth: v })} />
        </Box>

        {/* ── Roof-only: PV surface configurator ── */}
        {isRoof && (
          <Box sx={{
            mt: 0.5,
            pt: 1.5,
            borderTop: `1px solid ${T.border}`,
          }}>
            {/* Blue info banner */}
            <Box sx={{
              display:      'flex',
              alignItems:   'flex-start',
              gap:          '8px',
              bgcolor:      '#eff6ff',
              border:       '1px solid #bfdbfe',
              borderRadius: '8px',
              p:            '8px 10px',
              mb:           1.5,
            }}>
              <Roofing sx={{ fontSize: 15, color: '#1d4ed8', flexShrink: 0, mt: '1px' }} />
              <Typography sx={{ fontSize: 11, color: '#1d4ed8', lineHeight: 1.5 }}>
                Fields above define the <strong>thermal assembly</strong> (heat loss). Configure individual
                roof surfaces for <strong>PV simulation</strong> below.
              </Typography>
            </Box>
            <RoofConfigurator config={roofConfig} onChange={onRoofConfigChange} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─── Element list ─────────────────────────────────────────────────────────────

interface ElementListProps {
  elements: Record<string, BuildingElement>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function ElementList({ elements, selectedId, onSelect }: ElementListProps) {
  return (
    <Box sx={{ mt: 1.5 }}>
      <SectionLabel>Building Elements</SectionLabel>
      <Box sx={{ mt: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {ALL_ELEMENT_IDS.map((id) => {
          const el = elements[id];
          const active = selectedId === id;
          const inSvg  = SVG_IDS.has(id);
          const dot    = ELEMENT_DOTS[el.type];

          return (
            <Box
              key={id}
              onClick={() => onSelect(id)}
              sx={{
                height:       32,
                px:           '8px',
                borderRadius: '8px',
                display:      'flex',
                alignItems:   'center',
                gap:          '8px',
                cursor:       'pointer',
                bgcolor:      active ? T.primary : 'transparent',
                '&:hover':    { bgcolor: active ? T.primary : T.muted },
                transition:   'background-color 0.12s',
                userSelect:   'none',
              }}
            >
              {/* Colour dot */}
              <Box sx={{
                width:        10, height: 10, borderRadius: '50%', flexShrink: 0,
                bgcolor:      dot,
                outline:      active ? '2px solid rgba(255,255,255,0.7)' : 'none',
                outlineOffset: 1,
              }} />

              {/* Labels */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{
                  fontSize:  12, fontWeight: 500, lineHeight: 1.2,
                  color:     active ? T.primaryFg : T.foreground,
                  overflow:  'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {el.label}
                </Typography>
                <Typography sx={{
                  fontSize: 10, lineHeight: 1,
                  color:    active ? 'rgba(255,255,255,0.7)' : T.mutedFg,
                }}>
                  U {el.uValue} · R {fmtR(el.uValue)} · {el.area} m²
                </Typography>
              </Box>

              {/* Hidden badge */}
              {!inSvg && (
                <Box sx={{
                  px:           '5px', py: '1px',
                  borderRadius: '4px',
                  border:       `1px dashed ${active ? 'rgba(255,255,255,0.4)' : T.border}`,
                  flexShrink:   0,
                }}>
                  <Typography sx={{ fontSize: 9, color: active ? 'rgba(255,255,255,0.6)' : T.mutedFg }}>
                    hidden
                  </Typography>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ─── General config (all sections) ────────────────────────────────────────────

interface GeneralConfigProps {
  mode: 'basic' | 'expert';
  general: typeof DEFAULT_GENERAL;
  setGen: (key: string, value: any) => void;
  expanded: Record<string, boolean>;
  toggle: (id: string) => void;
}

function GeneralConfig({ mode, general, setGen, expanded, toggle }: GeneralConfigProps) {
  const massOpts = [
    { value: 'Light', label: 'Light' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Heavy', label: 'Heavy' },
  ];
  const massMap: Record<string, number> = { Light: 45, Medium: 110, Heavy: 165 };

  return (
    <Box>
      <SectionLabel>General Building Config</SectionLabel>
      <Box sx={{ mt: '8px', display: 'flex', flexDirection: 'column', gap: 1 }}>

        {/* Building Identity */}
        <ConfigSection title="Building Identity" expanded={expanded.identity} onToggle={() => toggle('identity')}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FieldRow>
              <SelectInput
                label="Building Type"
                value={general.buildingType}
                onChange={(v) => setGen('buildingType', v)}
                options={['SFH', 'TH', 'MFH', 'AB']}
              />
              <SelectInput
                label="Country"
                value={general.country}
                onChange={(v) => setGen('country', v)}
                options={['DE', 'AT', 'CH', 'NL', 'FR', 'IT']}
              />
            </FieldRow>
            <SelectInput
              label="Construction Period"
              value={general.constructionPeriod}
              onChange={(v) => setGen('constructionPeriod', v)}
              options={['Pre-1960', '1960–1980', '1980–2000', '2000–2010', 'Post-2010']}
            />
          </Box>
        </ConfigSection>

        {/* Key Metrics */}
        <ConfigSection title="Key Metrics" expanded={expanded.metrics} onToggle={() => toggle('metrics')}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FieldRow>
              <NumberInput label="Floor Area" value={general.floorArea} onChange={(v) => setGen('floorArea', v)} unit="m²" step={0.1} min={0} />
              <NumberInput label="Room Height" value={general.roomHeight} onChange={(v) => setGen('roomHeight', v)} unit="m" step={0.1} min={1} />
            </FieldRow>
            <InlineStepper
              label="Storeys"
              value={general.storeys}
              min={1}
              onDecrement={() => setGen('storeys', general.storeys - 1)}
              onIncrement={() => setGen('storeys', general.storeys + 1)}
            />
          </Box>
        </ConfigSection>

        {/* Expert-only sections */}
        {mode === 'expert' && (
          <>
            <ConfigSection title="Ventilation" expanded={expanded.ventilation} onToggle={() => toggle('ventilation')}>
              <FieldRow>
                <NumberInput
                  label="n_air_infiltration"
                  tip="Air change rate due to building infiltration (unintentional leakage)."
                  value={general.n_air_infiltration}
                  onChange={(v) => setGen('n_air_infiltration', v)}
                  unit="1/h" step={0.05} min={0}
                />
                <NumberInput
                  label="n_air_use"
                  tip="Ventilation air change rate from intentional use (e.g. mechanical ventilation)."
                  value={general.n_air_use}
                  onChange={(v) => setGen('n_air_use', v)}
                  unit="1/h" step={0.05} min={0}
                />
              </FieldRow>
            </ConfigSection>

            <ConfigSection title="Internal Conditions" expanded={expanded.internal} onToggle={() => toggle('internal')}>
              <FieldRow>
                <NumberInput
                  label="φ_int"
                  tip="Internal heat gains per floor area (occupants, appliances, lighting)."
                  value={general.phi_int}
                  onChange={(v) => setGen('phi_int', v)}
                  unit="W/m²" step={0.1} min={0}
                />
                <NumberInput
                  label="q_w_nd"
                  tip="Domestic hot water demand per year per floor area."
                  value={general.q_w_nd}
                  onChange={(v) => setGen('q_w_nd', v)}
                  unit="kWh/m²·yr" step={0.5} min={0}
                />
              </FieldRow>
            </ConfigSection>

            <ConfigSection title="Thermal Mass" expanded={expanded.thermal} onToggle={() => toggle('thermal')}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <SegmentedControl
                  fullWidth
                  options={massOpts}
                  value={general.massClass}
                  onChange={(v) => setGen('massClass', v) || setGen('c_m', massMap[v] ?? general.c_m)}
                />
                <NumberInput
                  label="c_m — effective heat capacity"
                  tip="Effective thermal mass per floor area. Light ≈ 45, Medium ≈ 110, Heavy ≈ 165 Wh/m²K."
                  value={general.c_m}
                  onChange={(v) => setGen('c_m', v)}
                  unit="Wh/m²K" step={5} min={0}
                />
              </Box>
            </ConfigSection>

            <ConfigSection title="Solver" expanded={expanded.solver} onToggle={() => toggle('solver')}>
              <ToggleSwitch
                checked={general.use_milp}
                onChange={(v) => setGen('use_milp', v)}
                label="MILP Solver"
                tip="Mixed Integer Linear Programming — higher accuracy, longer solve time."
              />
            </ConfigSection>
          </>
        )}
      </Box>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface BuildingConfiguratorProps {
  onClose?: () => void;
}

export function BuildingConfigurator({ onClose }: BuildingConfiguratorProps) {
  const [mode,       setMode]       = useState<'basic' | 'expert'>('basic');
  const [elements,   setElements]   = useState(DEFAULT_ELEMENTS);
  const [general,    setGeneralRaw] = useState(DEFAULT_GENERAL);
  const [roofConfig, setRoofConfig] = useState<RoofConfig>(DEFAULT_ROOF_CONFIG);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId,  setHoveredId]  = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    identity: true, metrics: true,
    ventilation: false, internal: false, thermal: false, solver: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const updateElement = (id: string, patch: Partial<BuildingElement>) =>
    setElements((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

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
  };

  // ── JSON export ──────────────────────────────────────────────────────────

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

  // ── JSON import ──────────────────────────────────────────────────────────

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

  // ── Layout ───────────────────────────────────────────────────────────────

  return (
    <Box className="cfg-panel" sx={{
      width:        860,
      maxHeight:    820,
      borderRadius: '12px',
      boxShadow:    '0 8px 32px rgba(0,0,0,0.16)',
      display:      'flex',
      flexDirection: 'column',
      bgcolor:       T.card,
      overflow:     'hidden',
    }}>
      <ConfiguratorStyles />

      {/* ── Header (52 px) ── */}
      <Box sx={{
        height:       52, flexShrink: 0,
        px:           2, 
        display:      'flex', 
        alignItems:   'center', 
        gap:          1.5,
        bgcolor:      T.card,
        borderBottom: `1px solid ${T.border}`,
      }}>
        {/* Icon badge */}
        <Box sx={{
          width:        28, height: 28,
          bgcolor:      T.foreground, borderRadius: '8px',
          display:      'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink:   0,
          '& svg':      { fontSize: '16px !important', color: T.primaryFg },
        }}>
          <Apartment />
        </Box>

        {/* Title block */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: T.foreground, lineHeight: 1.2 }}>
            Building 3 · MFH
          </Typography>
          <Typography sx={{ fontSize: 11, color: T.mutedFg, lineHeight: 1.2 }}>
            48.1351° N, 11.5820° E
          </Typography>
        </Box>

        {/* Mode segmented control */}
        <Box sx={{ flexShrink: 0 }}>
          <SegmentedControl
            options={[{ value: 'basic', label: 'Basic' }, { value: 'expert', label: 'Expert' }]}
            value={mode}
            onChange={(v) => setMode(v as 'basic' | 'expert')}
          />
        </Box>

        {/* Icon buttons */}
        <HeaderBtn onClick={handleDownload} tooltip="Export JSON">
          <FileDownload />
        </HeaderBtn>
        <HeaderBtn onClick={() => fileInputRef.current?.click()} tooltip="Import JSON">
          <FileUpload />
        </HeaderBtn>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleUpload} />

        {/* Divider */}
        <Box sx={{ width: 1, height: 20, bgcolor: T.border, flexShrink: 0 }} />

        {/* Close */}
        {onClose && (
          <HeaderBtn onClick={onClose} tooltip="Close">
            <Close />
          </HeaderBtn>
        )}
      </Box>

      {/* ── Content (flex) ── */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* ── Left column (340 px) ── */}
        <Box sx={{
          width:        340, flexShrink: 0,
          borderRight:  `1px solid ${T.border}`,
          overflowY:    'auto',
          p:            1.5,
        }}>
          {/* Upload error */}
          {uploadError && (
            <Box sx={{
              mb:           1,
              bgcolor:      '#fef2f2', border: `1px solid #fecaca`, borderRadius: '6px',
              p:            '8px 10px', display: 'flex', alignItems: 'flex-start', gap: '6px',
            }}>
              <Typography sx={{ fontSize: 11, color: T.destructive, lineHeight: 1.5, flex: 1 }}>
                {uploadError}
              </Typography>
              <Box
                onClick={() => setUploadError(null)}
                sx={{ cursor: 'pointer', color: T.destructive, fontSize: 14, flexShrink: 0, lineHeight: 1 }}
              >×</Box>
            </Box>
          )}

          {/* Hint */}
          <Typography sx={{ fontSize: 10, color: T.mutedFg, mb: '8px' }}>
            Click any surface on the building to open its attribute editor →
          </Typography>

          {/* 3D building SVG */}
          <BuildingVisualization
            elements={elements}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={setSelectedId}
            onHover={setHoveredId}
          />

          {/* Element list */}
          <ElementList
            elements={elements}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </Box>

        {/* ── Right column (flex-1) ── */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>

          {/* Element attribute editor or placeholder */}
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
            <Box sx={{
              border:       `1px dashed ${T.border}`,
              borderRadius: '12px',
              p:            3,
              mb:           1.5,
              textAlign:    'center',
              bgcolor:      T.inputBg,
            }}>
              <Typography sx={{ fontSize: 12, color: T.mutedFg }}>
                Click a building surface or select an element from the list to configure its properties.
              </Typography>
            </Box>
          )}

          {/* General building config */}
          <GeneralConfig
            mode={mode}
            general={general}
            setGen={setGen}
            expanded={expanded}
            toggle={toggleSection}
          />
        </Box>
      </Box>

      {/* ── Footer (44 px) ── */}
      <Box sx={{
        height:    44, flexShrink: 0,
        px:        2,
        borderTop: `1px solid ${T.border}`,
        bgcolor:   T.card,
        display:   'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px',
      }}>
        {/* Reset */}
        <Box
          onClick={handleReset}
          sx={{
            display:      'flex', alignItems: 'center', gap: '5px',
            px:           '10px', py: '5px',
            borderRadius: '4px',
            cursor:       'pointer',
            '&:hover':    { bgcolor: T.muted },
            transition:   'background-color 0.12s',
            '& svg':      { fontSize: '14px !important', color: T.mutedFg },
          }}
        >
          <RestartAlt />
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: T.mutedFg }}>Reset</Typography>
        </Box>

        {/* Apply */}
        <Box
          onClick={handleApply}
          sx={{
            display:      'flex', alignItems: 'center', gap: '5px',
            px:           '16px', py: '5px',
            borderRadius: '4px',
            bgcolor:       T.primary,
            cursor:       'pointer',
            '&:hover':    { bgcolor: '#254d78' },
            transition:   'background-color 0.12s',
            '& svg':      { fontSize: '14px !important', color: T.primaryFg },
          }}
        >
          <Check />
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: T.primaryFg }}>Apply</Typography>
        </Box>
      </Box>
    </Box>
  );
}