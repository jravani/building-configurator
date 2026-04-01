# Building Configurator — Design Specification

Figma Make prompt and design reference for the Building Configurator panel component.
The panel is a floating overlay on a dark map canvas inside the EnerPlanET web application.

---

## Panel dimensions and placement

| Property | Value |
|---|---|
| Width | 860 px |
| Max height | 820 px |
| Border radius | 12 px |
| Shadow | `0 8px 32px rgba(0,0,0,0.16)` |
| Placement | Top-right of the map viewport, 16 px inset from edges |

---

## Color scheme

Light mode, flat and neutral. No gradients. No strong per-element shadows.

| Token | Value | Usage |
|---|---|---|
| `card` | `#ffffff` | Panel background, accordion backgrounds |
| `background` | `#f5f6f7` | Page / map surround |
| `foreground` | `#1f2933` | Primary text, active icons |
| `muted` | `#ececf0` | Hover state fills, track backgrounds |
| `muted-foreground` | `#717182` | Labels, secondary text, placeholder |
| `border` | `rgba(0,0,0,0.1)` | All dividers and input outlines |
| `primary` | `#2f5d8a` | Active selections, apply button, focus ring |
| `primary-foreground` | `#ffffff` | Text on primary-colored backgrounds |
| `input-background` | `#f3f3f5` | Number and text input fill |
| `switch-background` | `#cbced4` | Toggle switch track (off state) |
| `destructive` | `#d4183d` | Error banners and validation messages |

### Element type badge colours

| Type | Background | Text | Border |
|---|---|---|---|
| wall | `#eff6ff` (blue-50) | `#1d4ed8` (blue-700) | `#bfdbfe` (blue-200) |
| window | `#f0f9ff` (sky-50) | `#0369a1` (sky-700) | `#bae6fd` (sky-200) |
| roof | `#fffbeb` (amber-50) | `#b45309` (amber-700) | `#fde68a` (amber-200) |
| floor | `#f0fdf4` (green-50) | `#15803d` (green-700) | `#bbf7d0` (green-200) |
| door | `#fff7ed` (orange-50) | `#c2410c` (orange-700) | `#fed7aa` (orange-200) |

### Element list dot colours

| Type | Dot colour |
|---|---|
| wall | `#8ab4d0` |
| window | `#56bce0` |
| roof | `#c0a870` |
| floor | `#608c4c` |
| door | `#8a5a38` |

---

## Typography

Font family: **Inter** (system-ui fallback).

| Context | Size | Weight | Colour |
|---|---|---|---|
| Panel title | 14 px | Semibold (600) | `foreground` |
| Coordinate subtitle | 11 px | Regular (400) | `muted-foreground` |
| Section label | 11 px | Semibold, uppercase, letter-spacing 0.08em | `muted-foreground` |
| Input label | 11 px | Medium (500) | `muted-foreground` |
| Input value | 14 px | Regular (400) | `foreground` |
| List item — name | 12 px | Medium (500) | `foreground` / `primary-foreground` when active |
| List item — detail | 10 px | Regular (400) | `muted-foreground` / 70% white when active |
| Button text | 12 px | Semibold (600) | varies |
| Hint / caption | 10–11 px | Regular (400) | `muted-foreground` |

---

## Layout — three zones

```
┌─ Header (52 px) ─────────────────────────────────────────────────────┐
│ [■] Building 3 · MFH          [Basic | Expert]  [↓] [↑]  [×]       │
├─ Content (fills remaining height) ───────────────────────────────────┤
│                                                                        │
│  Left column (340 px, fixed)  │  Right column (flex-1)               │
│  ─────────────────────────────│──────────────────────────────────     │
│  Hint text                    │  Element attribute editor             │
│  3D building SVG              │  (visible when a surface is selected) │
│  Element list                 │                                        │
│                               │  Configuration sections               │
│                               │  (collapsible accordion)              │
│                                                                        │
├─ Footer (44 px) ─────────────────────────────────────────────────────┤
│                                          [↺ Reset]  [✓ Apply]        │
└──────────────────────────────────────────────────────────────────────┘
```

Both content columns scroll independently. The header and footer are fixed within the panel.

---

## Zone 1 — Header

Height: 52 px. `border-bottom`. Background: `card`.

Left to right:

1. **Icon badge** — 28×28 px, `foreground` fill, `primary-foreground` icon, 8 px radius
2. **Title block** — building name (14 px semibold) above coordinate string (11 px, `muted-foreground`)
3. **Segmented control** — "Basic / Expert" pill (see Segmented Control below)
4. **Icon buttons** — Download and Upload, 28×28 px ghost style, separated from close by a 1 px vertical `border` divider
5. **Close button** — 28×28 px ghost, × icon, only rendered when parent provides `onClose`

---

## Zone 2 — Content

### Left column (340 px)

**Hint text** — 10 px, `muted-foreground`, one line above the SVG.

**3D building SVG**
- Aspect ratio: 455:320 (fills column width, ~220 px tall at 340 px column width)
- Container: `border`, `border-radius` 8 px, `overflow: hidden`
- Isometric cabinet-projection of a generic multi-storey building
- Visible surfaces: south wall, east wall, roof, floor, door, south windows ×2, east window
- Each surface is individually clickable and highlights on hover

**Element list**
- Section label above: "BUILDING ELEMENTS" (uppercase, 11 px, `muted-foreground`)
- Each row: full-width button, 32 px tall, 8 px radius
  - Left: 10 px color dot (type-coded, see dot colours above)
  - Middle: element name (12 px medium) + `U · R · area m²` (10 px, muted)
  - Right: optional "hidden" badge (9 px, dashed border, muted) for surfaces not shown in the SVG
  - **Active**: `primary` fill, all text white
  - **Hover**: `muted` fill

### Right column (flex-1, min ~480 px)

**Element attribute editor** — shown when a surface is selected.

Container: 2 px border using `primary` at 60% opacity, 12 px radius, `card` background.

- **Header row**: type badge + element name (14 px semibold) + close × button (right-aligned)
- **Fields** (8 px vertical gap between each):
  - Area — full width, unit: m²
  - U-value + R-value — side by side (50/50), units: W/m²K and m²K/W
  - g-value — full width, unit: —, windows only
  - Tilt — range slider (full width) + number input (80 px) side by side, 0–90°, tick labels at 0/30/60/90
  - Azimuth — 76 px SVG compass widget (clickable) + number input side by side, 0–359°
- **Roof-only section**: info banner (blue-50 background, Home icon) + roof surface sub-configurator for PV simulation

**General configuration sections** — collapsible accordions below the attribute editor (or below the placeholder when nothing is selected).

- Section label above: "GENERAL BUILDING CONFIG" (uppercase, 11 px, `muted-foreground`)
- Sections: Building Identity, Key Metrics, Ventilation\*, Internal Conditions\*, Thermal Mass\*, Solver\*
  - \* Expert mode only

---

## Zone 3 — Footer

Height: 44 px. `border-top`. Background: `card`.

Right-aligned row:

| Element | Style |
|---|---|
| Reset | Ghost button — `RotateCcw` icon + "Reset" text, 12 px, `muted-foreground` text, `muted` hover |
| Apply | Filled button — `Check` icon + "Apply" text, 12 px semibold, `primary` fill, `primary-foreground` text, 4 px radius, 16 px horizontal padding |

---

## Input components

### Number input with unit

```
┌────────────────────────────┬──────────┐
│  {value}                   │  {unit}  │
└────────────────────────────┴──────────┘
```

- Container: `input-background` fill, `border` outline, 6 px radius, overflow hidden
- Value area: transparent background, 10 px horizontal padding, 6 px vertical, 14 px text
- Unit area: `muted` background, `muted-foreground` text, 11 px, separated by 1 px `border` on the left
- Label above: 11 px, medium, `muted-foreground`

### Select

Native `<select>` element.
- Fill: `input-background`
- Border: `border`
- Radius: 6 px
- Text: 14 px, `foreground`
- Label above: same as number input

### Segmented control

Used for Basic/Expert mode and Light/Medium/Heavy mass class.

```
┌─────────────────────────────────────┐  ← muted fill, 6 px radius, 2 px padding
│  [  Option A  ]  [  Option B  ]     │
└─────────────────────────────────────┘
```

- Track: `muted` background, 6 px radius, 2 px padding, 2 px gap between options
- Active thumb: `card` background, subtle shadow, same radius
- Active label: `foreground`, semibold
- Inactive label: `muted-foreground`, no background

### Range slider

Native `<input type="range">`.
- Track height: 6 px, `muted` fill
- Thumb: `primary` fill, 14 px diameter, no outline
- Tick labels below at key values: 10 px, `muted-foreground`

### Toggle switch

36 px wide × 20 px tall track.

- **On**: `primary` track, white 16 px thumb, thumb translated right
- **Off**: `switch-background` (#cbced4) track, white thumb at left
- Transition: 200 ms, ease

### Info tooltip

Small `Info` icon (14 px, `muted-foreground`). On hover, shows a 208 px wide dark tooltip above:
- Background: `foreground`
- Text: `primary-foreground`, 11 px, leading-snug
- Radius: 6 px, shadow

---

## Configuration section accordion

```
┌──────────────────────────────────────────────┐
│  SECTION LABEL                          ∨    │  ← 44 px, hover: muted
├──────────────────────────────────────────────┤
│                                              │
│  {content — inputs, controls}                │  ← 12 px padding
│                                              │
└──────────────────────────────────────────────┘
```

- Border: `border`, 8 px radius, `card` background
- Chevron rotates 180° when open (200 ms transition)
- No gap between label and content border — `overflow: hidden` on container

### Section contents

**Building Identity**
- Row 1: Building Type (dropdown: SFH, TH, MFH, AB) + Country (dropdown: DE, AT, CH, NL, FR, IT) — 50/50 grid
- Row 2: Construction Period (dropdown, full width)

**Key Metrics**
- Row 1: Floor Area (m²) + Room Height (m) — 50/50 grid
- Row 2: Storey counter — minus button (28×28 px, `border`, 6 px radius) + number (centre, 32 px wide, 14 px bold) + plus button

**Ventilation** *(expert)*
- n_air_infiltration (1/h) + n_air_use (1/h) — 50/50 grid with info tips

**Internal Conditions** *(expert)*
- φ_int / internal gains (W/m²) + q_w_nd / DHW demand (kWh/m²·yr) — 50/50 grid with info tips

**Thermal Mass** *(expert)*
- Segmented control: Light / Medium / Heavy (full width)
- c_m effective heat capacity (Wh/m²K) — full width with info tip

**Solver** *(expert)*
- Toggle switch: MILP Solver (label + info tip)

---

## Spacing

| Context | Value |
|---|---|
| Panel internal padding | 12 px |
| Header / footer horizontal padding | 16 px |
| Gap between accordion sections | 8 px |
| Gap between fields within a section | 8 px |
| Gap between left and right columns | 0 (border divider only) |
| Element list row gap | 2 px |

---

## Interaction states

| State | Treatment |
|---|---|
| Focus | 1 px ring, `primary` at 50% opacity, no browser default outline |
| Hover (buttons, list rows) | `muted` background fill |
| Active / selected | `primary` fill, `primary-foreground` text |
| Disabled | 40% opacity, `not-allowed` cursor |
| Error | `destructive` tint banner with `AlertCircle` icon |
