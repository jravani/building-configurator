Design a React component called BuildingConfigurator using Material UI (MUI) v6 — a side-panel or modal form used by urban energy planners to configure building

    parameters before running a thermal simulation. The component targets two audiences: Basic (urban planners, non-technical users) and Expert (energy engineers), toggled by a
   ToggleButtonGroup at the top.

  ---
## Technology stack
 - React with TypeScript
 - Material UI v6 (@mui/material, @mui/icons-material)
 - All layout via MUI Box, Stack, Grid2
 - All typography via MUI Typography with variant props
 - Custom MUI theme via createTheme / ThemeProvider — define the palette once at the top of the file:
## palette: {
    primary:    { main: '#2f5d8a' },
       text:       { primary: '#1f2933', secondary: '#6b7280' },                                                                                     divider:    '#b0bacf',
       background: { default: '#f5f6f7', paper: '#ffffff' },
 }
 - Icons from @mui/icons-material: InfoOutlined, ExpandMore, RestartAlt, Check

---
## Visual style
 - Component width: 380px; vertically scrollable
 - Section cards: MUI Accordion with disableGutters and elevation={0}; border 1px solid divider (#b0bacf); borderRadius: 2; sx={{ mb: 1.5 }}
 - Section headers: MUI AccordionSummary with expandIcon={<ExpandMore />}; label as Typography variant="overline" in text.secondary
 - Form fields: MUI TextField with variant="outlined" size="small" fullWidth; units rendered via InputProps.endAdornment using InputAdornment
 - Dropdowns: MUI Select inside FormControl size="small" fullWidth with InputLabel
 - Sliders: MUI Slider size="small" with color="primary" alongside a TextField size="small" sx={{ width: 72 }} showing the current value
 - Toggles: MUI Switch with color="primary" in a FormControlLabel
 - Segmented controls: MUI ToggleButtonGroup exclusive size="small" with color="primary"
 - Info icons: IconButton size="small" wrapping InfoOutlined sx={{ fontSize: 16, color: 'divider' }} wrapped in a MUI Tooltip with placement="right" and arrow; tooltip
  content is multi-line Typography variant="body2"
 - TABULA-default badges: MUI Chip label="auto" size="small" variant="outlined" sx={{ color: '#b0bacf', borderColor: '#b0bacf', ml: 0.5 }}; overridden state: same Chip
  label="edited" with color="primary"
 - Key metric cards: MUI Paper elevation={0} with 1px solid #b0bacf border, centered content: Typography variant="h4" fontWeight={700} for value, Typography
  variant="caption" color="text.secondary" for unit, Typography variant="body2" for label; clicking the card activates an inline TextField

 ---
Header (always visible)
 MUI Box with px={2} py={1.5} borderBottom="1px solid" borderColor="divider":
 - Typography variant="subtitle1" fontWeight={600} — building label e.g. "Building 1 · MFH"
 - Typography variant="caption" color="text.secondary" — coordinates
 - ToggleButtonGroup exclusive value={mode} size="small" sx={{ mt: 1 }} with two ToggleButton values "basic" and "expert"; active state uses primary.main fill with white
  text via MUI theme

 ---
 BASIC MODE — sections and fields

 Section 1 — Building Identity
 AccordionDetails with Grid2 container spacing={1.5} — three Grid2 size={4} cells:
 1. Building Type — Select: SFH, TH, MFH, AB; default MFH; ⓘ "Residential typology from TABULA. Determines default envelope and thermal parameters."
 2. Construction Period — Select: Pre-1960, 1960–1980, 1980–2000, 2000–2010, Post-2010; ⓘ "Year range for TABULA variant lookup. Affects U-values and insulation levels."
 3. Country — Select: DE, AT, CH, NL; default DE; ⓘ "Country code for TABULA lookup."

 Section 2 — Key Metrics
 AccordionDetails with Grid2 container spacing={1.5} — three Grid2 size={4} metric Paper cards:
 1. Reference Floor Area — value 363.4, unit m², label "Floor Area"; clicking card shows TextField type="number"; ⓘ "Total conditioned floor area (A_ref). Pre-filled from
  3D building data."
 2. Room Height — value 2.7, unit m, label "Room Height"; ⓘ "Average clear room height (h_room). TABULA default." + · auto Chip
 3. Floors — value 4, unit floors, label "Storeys"; integer stepper using TextField with InputAdornment +/- IconButtons; ⓘ "Estimated above-ground floor count. Pre-filled
  from 3D data."

 ---
 EXPERT MODE — all Basic sections plus:

 Section 3 — Ventilation
 Grid2 container spacing={1.5} — two Grid2 size={6} TextField type="number" fields:
 1. n_air_infiltration · 1/h · default 0.4 · · auto Chip; ⓘ "Infiltration through building envelope leaks. Old: 0.4–0.7. Modern: 0.1–0.2 1/h."
 2. n_air_use · 1/h · default 0.4 · · auto Chip; ⓘ "Intentional ventilation for hygiene. Standard: 0.4 1/h."

 Section 4 — Internal Conditions
 Grid2 container spacing={1.5} — two Grid2 size={6} fields:
 1. φ_int · W/m² · default 3.0 · · auto Chip; ⓘ "Internal heat gains from occupants, appliances and lighting. TABULA default: 3.0 W/m²."
 2. q_w_nd · kWh/(m²·yr) · default 12.5 · · auto Chip; ⓘ "Net energy for domestic hot water per year."

 Section 5 — Thermal Mass
 Stack spacing={1.5}:
 1. ToggleButtonGroup exclusive with three ToggleButton options: Light Medium Heavy; default Medium; ⓘ "Light = timber (45 Wh/(m²K)) · Medium = brick (110) · Heavy =
  concrete (165)."
 2. TextField type="number" label c_m unit Wh/(m²·K) — auto-filled when mass class changes but manually editable; · auto Chip; ⓘ "Effective internal heat capacity. Drives
  the thermal time constant."

 Section 6 — Solar & Shading
 Grid2 container spacing={2} — four Grid2 size={6} items, each a Stack direction="row" alignItems="center" spacing={1}:
 Slider size="small" min=0 max=1 step=0.01 + TextField size="small" sx={{ width: 72 }} showing value + ⓘ icon
 1. F_sh,hor · default 0.6; ⓘ "Horizontal shading from overhangs or balconies. 0.6–0.7 typical urban."
 2. F_sh,vert · default 0.6; ⓘ "Vertical shading from side fins or neighboring buildings."
 3. F_f · default 0.75; ⓘ "Frame factor: ratio of glazing to total window area. Typically 0.70–0.80."
 4. F_w · default 0.90; ⓘ "Correction for non-perpendicular incidence. TABULA standard: 0.9."

 Section 7 — Envelope U-values
 MUI Table size="small" with TableHead row: Element · U-value [W/(m²·K)] ⓘ · g-value [-] ⓘ
 Five TableRows: Roof · Wall · Floor · Window · Door
 Each U-value cell: inline TextField type="number" size="small" sx={{ width: 80 }} + · auto Chip
 g-value column: filled for Window row only; other rows show Typography color="text.disabled" —
 ⓘ in U-value header: "Thermal transmittance. Lower = better insulation. TABULA defaults for selected type and period."
 ⓘ in g-value header: "Solar heat gain coefficient of glazing at normal incidence. Typical: 0.60–0.85."

 Section 8 — Solver
 FormControlLabel with Switch color="primary" label "MILP Solver (use_milp)" + ⓘ "Use Mixed Integer Linear Programming. More accurate for inequality constraints but
  slower. Default: off."

 ---
 Footer (always visible)
 MUI Box px={2} py={1.5} borderTop="1px solid" borderColor="divider":
 - Stack direction="row" justifyContent="space-between":
   - Button variant="text" color="inherit" startIcon={<RestartAlt />} — "Reset to defaults"
   - Button variant="contained" color="primary" disableElevation startIcon={<Check />} — "Apply"

 ---
 Developer extensibility
 At the top of the file define a FIELD_CONFIG array. Each entry:
 {
   id: string,
   label: string,
   unit: string,
   section: string,
   mode: 'basic' | 'expert',
   type: 'select' | 'number' | 'integer' | 'toggle' | 'slider' | 'segmented',
   defaultValue: unknown,
   source: 'user' | 'tabula',   // 'tabula' renders the · auto Chip
   tooltip: string,
   options?: string[],           // for select / segmented
   min?: number,                 // for slider / number
   max?: number,
   step?: number,
 }
 Adding or removing a field requires only editing FIELD_CONFIG. The render loop reads this config — no JSX changes needed. Each section is also config-driven via a
  SECTION_CONFIG array with { id, label, mode }.
