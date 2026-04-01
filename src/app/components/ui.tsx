/**
 * EnerPlanET — Building Configurator Design System
 * Shared primitive components and design tokens.
 */
import React from 'react';
import { Box, Typography, Tooltip, GlobalStyles } from '@mui/material';
import { InfoOutlined, ExpandMore } from '@mui/icons-material';

// ─── Design tokens ─────────────────────────────────────────────────────────────

export const T = {
  card:        '#ffffff',
  background:  '#f5f6f7',
  foreground:  '#1f2933',
  muted:       '#ececf0',
  mutedFg:     '#717182',
  border:      'rgba(0,0,0,0.1)',
  primary:     '#2f5d8a',
  primaryFg:   '#ffffff',
  inputBg:     '#f3f3f5',
  switchBg:    '#cbced4',
  destructive: '#d4183d',
  warning:     '#92400e',
};

// ─── Element type badge colours ────────────────────────────────────────────────

export const TYPE_BADGES: Record<string, { bg: string; fg: string; border: string }> = {
  wall:   { bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' },
  window: { bg: '#f0f9ff', fg: '#0369a1', border: '#bae6fd' },
  roof:   { bg: '#fffbeb', fg: '#b45309', border: '#fde68a' },
  floor:  { bg: '#f0fdf4', fg: '#15803d', border: '#bbf7d0' },
  door:   { bg: '#fff7ed', fg: '#c2410c', border: '#fed7aa' },
};

// ─── Element dot colours ───────────────────────────────────────────────────────

export const ELEMENT_DOTS: Record<string, string> = {
  wall:   '#8ab4d0',
  window: '#56bce0',
  roof:   '#c0a870',
  floor:  '#608c4c',
  door:   '#8a5a38',
};

// ─── Global CSS — range slider styling ────────────────────────────────────────

export function ConfiguratorStyles() {
  return (
    <GlobalStyles styles={{
      // Apply Inter to the whole panel
      '.cfg-panel, .cfg-panel *': {
        fontFamily: "'Inter', system-ui, sans-serif",
      },
      // Range slider reset + theme
      '.cfg-range': {
        WebkitAppearance: 'none',
        MozAppearance:    'none',
        appearance:       'none',
        width:            '100%',
        height:           6,
        background:       '#ececf0',
        borderRadius:     3,
        outline:          'none',
        cursor:           'pointer',
        padding:          0,
        margin:           0,
        border:           'none',
        display:          'block',
      },
      '.cfg-range::-webkit-slider-thumb': {
        WebkitAppearance: 'none',
        width:            14,
        height:           14,
        borderRadius:     '50%',
        background:       '#2f5d8a',
        cursor:           'pointer',
        border:           'none',
        marginTop:        -4,
      },
      '.cfg-range::-webkit-slider-runnable-track': {
        height:           6,
        borderRadius:     3,
        background:       '#ececf0',
      },
      '.cfg-range::-moz-range-thumb': {
        width:            14,
        height:           14,
        borderRadius:     '50%',
        background:       '#2f5d8a',
        border:           'none',
        cursor:           'pointer',
      },
      '.cfg-range::-moz-range-track': {
        height:           6,
        borderRadius:     3,
        background:       '#ececf0',
      },
      // Select element clean styling
      'select.cfg-select': {
        width:            '100%',
        padding:          '6px 28px 6px 10px',
        fontSize:         14,
        color:            '#1f2933',
        background:       `#f3f3f5 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23717182'/%3E%3C/svg%3E") no-repeat right 10px center`,
        border:           '1px solid rgba(0,0,0,0.1)',
        borderRadius:     '6px',
        outline:          'none',
        cursor:           'pointer',
        fontFamily:       'inherit',
        appearance:       'none',
        WebkitAppearance: 'none',
      },
      'select.cfg-select:focus': {
        boxShadow: '0 0 0 2px rgba(47,93,138,0.25)',
      },
      // Number input clean
      'input.cfg-number': {
        flex:             1,
        border:           'none',
        outline:          'none',
        background:       'transparent',
        padding:          '6px 10px',
        fontSize:         14,
        color:            '#1f2933',
        fontFamily:       'inherit',
        minWidth:         0,
        width:            '100%',
      },
      'input.cfg-number::-webkit-inner-spin-button, input.cfg-number::-webkit-outer-spin-button': {
        opacity: 0.4,
      },
      // Focus ring for container
      '.cfg-input-wrap:focus-within': {
        boxShadow: '0 0 0 2px rgba(47,93,138,0.25)',
      },
    }} />
  );
}

// ─── NumberInput ──────────────────────────────────────────────────────────────

interface NumberInputProps {
  label?: string;
  value: number | string;
  onChange?: (v: number) => void;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
  tip?: string;
  readOnly?: boolean;
  width?: number | string;
}

export function NumberInput({
  label, value, onChange, unit, min, max, step = 0.01,
  tip, readOnly = false, width,
}: NumberInputProps) {
  return (
    <Box sx={{ width }}>
      {label && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', mb: '4px' }}>
          <Typography sx={{ fontSize: 11, fontWeight: 500, color: T.mutedFg, lineHeight: 1.2 }}>
            {label}
          </Typography>
          {tip && <InfoTip tip={tip} />}
        </Box>
      )}
      <Box
        className="cfg-input-wrap"
        sx={{
          display:       'flex',
          bgcolor:        T.inputBg,
          border:        `1px solid ${T.border}`,
          borderRadius:  '6px',
          overflow:      'hidden',
          transition:    'box-shadow 0.15s',
        }}
      >
        <input
          className="cfg-number"
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          readOnly={readOnly}
          onChange={(e) => {
            if (!onChange) return;
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(v);
          }}
          style={{ cursor: readOnly ? 'default' : 'text' }}
        />
        <Box sx={{
          px:           1.5,
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          bgcolor:       T.muted,
          borderLeft:   `1px solid ${T.border}`,
          fontSize:      11,
          color:         T.mutedFg,
          whiteSpace:    'nowrap',
          flexShrink:    0,
          fontFamily:    'inherit',
          userSelect:    'none',
        }}>
          {unit}
        </Box>
      </Box>
    </Box>
  );
}

// ─── SelectInput ──────────────────────────────────────────────────────────────

interface SelectInputProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: string[] | { value: string; label: string }[];
  tip?: string;
}

export function SelectInput({ label, value, onChange, options, tip }: SelectInputProps) {
  const normalized = (options as any[]).map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o
  );
  return (
    <Box>
      {label && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', mb: '4px' }}>
          <Typography sx={{ fontSize: 11, fontWeight: 500, color: T.mutedFg, lineHeight: 1.2 }}>
            {label}
          </Typography>
          {tip && <InfoTip tip={tip} />}
        </Box>
      )}
      <select
        className="cfg-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Box>
  );
}

// ─── SegmentedControl ─────────────────────────────────────────────────────────

interface SegOpt { value: string; label: string }

interface SegmentedControlProps {
  options: SegOpt[];
  value: string;
  onChange: (v: string) => void;
  fullWidth?: boolean;
}

export function SegmentedControl({ options, value, onChange, fullWidth }: SegmentedControlProps) {
  return (
    <Box sx={{
      display:      fullWidth ? 'flex' : 'inline-flex',
      bgcolor:       T.muted,
      borderRadius:  '6px',
      p:             '2px',
      gap:           '2px',
    }}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Box
            key={opt.value}
            onClick={() => onChange(opt.value)}
            sx={{
              flex:         fullWidth ? 1 : undefined,
              px:           '12px',
              py:           '5px',
              borderRadius: '4px',
              cursor:       'pointer',
              textAlign:    'center',
              fontSize:     12,
              fontWeight:   active ? 600 : 400,
              color:        active ? T.foreground : T.mutedFg,
              bgcolor:      active ? T.card       : 'transparent',
              boxShadow:    active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition:   'all 0.15s ease',
              userSelect:   'none',
              whiteSpace:   'nowrap',
            }}
          >
            {opt.label}
          </Box>
        );
      })}
    </Box>
  );
}

// ─── RangeSlider ─────────────────────────────────────────────────────────────

interface RangeMark { value: number; label: string }

interface RangeSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  marks?: RangeMark[];
  onChange: (v: number) => void;
}

export function RangeSlider({ value, min, max, step = 1, marks, onChange }: RangeSliderProps) {
  return (
    <Box>
      <input
        className="cfg-range"
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      {marks && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: '2px' }}>
          {marks.map((m) => (
            <Typography key={m.value} sx={{ fontSize: 10, color: T.mutedFg, lineHeight: 1 }}>
              {m.label}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ─── ToggleSwitch ─────────────────────────────────────────────────────────────

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  tip?: string;
}

export function ToggleSwitch({ checked, onChange, label, tip }: ToggleSwitchProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Typography sx={{ fontSize: 12, color: T.foreground }}>
          {label}
        </Typography>
        {tip && <InfoTip tip={tip} />}
      </Box>
      <Box
        onClick={() => onChange(!checked)}
        sx={{
          width:      36, height: 20,
          borderRadius: 10,
          bgcolor:    checked ? T.primary : T.switchBg,
          position:   'relative',
          cursor:     'pointer',
          flexShrink: 0,
          transition: 'background-color 200ms ease',
        }}
      >
        <Box sx={{
          position:   'absolute',
          top:        2,
          left:       checked ? 18 : 2,
          width:      16, height: 16,
          borderRadius: '50%',
          bgcolor:    'white',
          transition: 'left 200ms ease',
          boxShadow:  '0 1px 3px rgba(0,0,0,0.18)',
        }} />
      </Box>
    </Box>
  );
}

// ─── InfoTip ──────────────────────────────────────────────────────────────────

export function InfoTip({ tip }: { tip: string }) {
  return (
    <Tooltip
      title={
        <Typography sx={{ fontSize: 11, lineHeight: 1.4, color: T.primaryFg }}>
          {tip}
        </Typography>
      }
      placement="top"
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor:      T.foreground,
            borderRadius: '6px',
            maxWidth:     208,
            p:            '6px 10px',
            boxShadow:    '0 2px 8px rgba(0,0,0,0.22)',
          },
        },
        arrow: { sx: { color: T.foreground } },
      }}
      arrow
    >
      <Box sx={{ display: 'inline-flex', alignItems: 'center', cursor: 'help', flexShrink: 0 }}>
        <InfoOutlined sx={{ fontSize: '14px !important', color: T.mutedFg }} />
      </Box>
    </Tooltip>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{
      fontSize:      11,
      fontWeight:    600,
      color:         T.mutedFg,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      display:       'block',
    }}>
      {children}
    </Typography>
  );
}

// ─── ConfigSection (accordion) ────────────────────────────────────────────────

interface ConfigSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function ConfigSection({ title, expanded, onToggle, children }: ConfigSectionProps) {
  return (
    <Box sx={{
      border:       `1px solid ${T.border}`,
      borderRadius: '8px',
      bgcolor:       T.card,
      overflow:     'hidden',
    }}>
      <Box
        onClick={onToggle}
        sx={{
          height:        44,
          px:            1.5,
          display:       'flex',
          alignItems:    'center',
          justifyContent: 'space-between',
          cursor:        'pointer',
          userSelect:    'none',
          '&:hover':     { bgcolor: T.muted },
          transition:    'background-color 0.12s',
        }}
      >
        <Typography sx={{
          fontSize:      11,
          fontWeight:    600,
          color:         T.mutedFg,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {title}
        </Typography>
        <Box sx={{
          transform:  expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 200ms ease',
          display:    'flex',
          alignItems: 'center',
          color:       T.mutedFg,
        }}>
          <ExpandMore sx={{ fontSize: 18 }} />
        </Box>
      </Box>

      {/* Animated content */}
      <Box sx={{
        maxHeight:  expanded ? 600 : 0,
        overflow:   'hidden',
        transition: 'max-height 200ms ease',
      }}>
        <Box sx={{
          px: 1.5, pb: 1.5, pt: 0.5,
          borderTop: expanded ? `1px solid ${T.border}` : 'none',
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

// ─── FieldRow — equal-width 2-column grid helper ─────────────────────────────

export function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
      {children}
    </Box>
  );
}

// ─── FieldLabel — label above a field ────────────────────────────────────────

export function FieldLabel({ children, tip }: { children: React.ReactNode; tip?: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', mb: '4px' }}>
      <Typography sx={{ fontSize: 11, fontWeight: 500, color: T.mutedFg, lineHeight: 1.2 }}>
        {children}
      </Typography>
      {tip && <InfoTip tip={tip} />}
    </Box>
  );
}

// ─── TypeBadge ────────────────────────────────────────────────────────────────

export function TypeBadge({ type }: { type: string }) {
  const b = TYPE_BADGES[type] ?? { bg: T.muted, fg: T.mutedFg, border: T.border };
  return (
    <Box sx={{
      display:      'inline-flex',
      alignItems:   'center',
      px:           '6px',
      py:           '2px',
      borderRadius: '4px',
      bgcolor:       b.bg,
      border:       `1px solid ${b.border}`,
    }}>
      <Typography sx={{ fontSize: 10, fontWeight: 600, color: b.fg, textTransform: 'capitalize' }}>
        {type}
      </Typography>
    </Box>
  );
}

// ─── InlineStepper — minus/number/plus counter ───────────────────────────────

interface InlineStepperProps {
  label: string;
  value: number;
  min?: number;
  onDecrement: () => void;
  onIncrement: () => void;
}

export function InlineStepper({ label, value, min = 1, onDecrement, onIncrement }: InlineStepperProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Typography sx={{ fontSize: 11, fontWeight: 500, color: T.mutedFg, flex: 1 }}>
        {label}
      </Typography>
      <Box
        onClick={() => value > min && onDecrement()}
        sx={{
          width:        28, height: 28,
          border:       `1px solid ${T.border}`,
          borderRadius: '6px',
          display:      'flex', alignItems: 'center', justifyContent: 'center',
          cursor:       value > min ? 'pointer' : 'not-allowed',
          opacity:      value > min ? 1 : 0.4,
          '&:hover':    { bgcolor: value > min ? T.muted : undefined },
          userSelect:   'none',
          fontSize:     18, color: T.foreground,
        }}
      >
        −
      </Box>
      <Typography sx={{
        fontSize:  14, fontWeight: 700, color: T.foreground,
        width:     32, textAlign: 'center',
      }}>
        {value}
      </Typography>
      <Box
        onClick={onIncrement}
        sx={{
          width:        28, height: 28,
          border:       `1px solid ${T.border}`,
          borderRadius: '6px',
          display:      'flex', alignItems: 'center', justifyContent: 'center',
          cursor:       'pointer',
          '&:hover':    { bgcolor: T.muted },
          userSelect:   'none',
          fontSize:     18, color: T.foreground,
        }}
      >
        +
      </Box>
    </Box>
  );
}