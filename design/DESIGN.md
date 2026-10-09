---
name: Obsidian Emerald Desktop
colors:
  surface: '#101411'
  surface-dim: '#101411'
  surface-bright: '#363a36'
  surface-container-lowest: '#0b0f0c'
  surface-container-low: '#181d19'
  surface-container: '#1c211d'
  surface-container-high: '#272b27'
  surface-container-highest: '#323632'
  on-surface: '#e0e3de'
  on-surface-variant: '#bbcbb2'
  inverse-surface: '#e0e3de'
  inverse-on-surface: '#2d312e'
  outline: '#85957e'
  outline-variant: '#3c4b37'
  surface-tint: '#2be52e'
  primary: '#44f740'
  on-primary: '#003a02'
  primary-container: '#0fd920'
  on-primary-container: '#005805'
  inverse-primary: '#006e08'
  secondary: '#d6ffc8'
  on-secondary: '#003a02'
  secondary-container: '#00f922'
  on-secondary-container: '#006d07'
  tertiary: '#60f455'
  on-tertiary: '#003a02'
  tertiary-container: '#40d73b'
  on-tertiary-container: '#005806'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#76ff66'
  primary-fixed-dim: '#2be52e'
  on-primary-fixed: '#002201'
  on-primary-fixed-variant: '#005304'
  secondary-fixed: '#76ff66'
  secondary-fixed-dim: '#00e61e'
  on-secondary-fixed: '#002201'
  on-secondary-fixed-variant: '#005304'
  tertiary-fixed: '#75ff67'
  tertiary-fixed-dim: '#4de246'
  on-tertiary-fixed: '#002201'
  on-tertiary-fixed-variant: '#005305'
  background: '#101411'
  on-background: '#e0e3de'
  surface-variant: '#323632'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.04em
  code-telemetry:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-compact: 0.5rem
  margin: 1.25rem
  margin-window: 0.75rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.875rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system defines an ultra-premium, precision desktop media utility. It merges technical command with atmospheric obsidian glassmorphism, tailored for frameless desktop runtime environments (macOS and Electron/Windows).

### Visual Language & Tone
- **Precision Engineering Meets Stealth Luxury:** Evokes the feeling of high-performance developer tooling and luxury audio workstation hardware rather than an ad-laden consumer utility.
- **Obsidian Substrates with Bio-Luminescing Accents:** Deep mineral black-greens form quiet backdrops that allow glowing phosphor-emerald telemetry and action nodes to direct focus instantly.
- **Physical Depth without Skeuomorphic Clutter:** Depth is communicated through translucent multi-planar acrylics, rim lighting, inner glass refractions, and radioactive-tuned diffuse halos.
- **Audience:** Digital archivists, video editors, audiophiles, and power users who demand zero friction, low visual fatigue during prolonged sessions, and pixel-precise desktop interaction.

## Colors

The palette is strictly tuned for dark-mode desktop interfaces, balancing deep dark-room contrast with calibrated toxic-emerald luminosity.

### Palette Architecture
- **Canvas Base:** Linear diagonal gradient from `#090D0A` to `#0D120E` (145deg), establishing a deep mineral obsidian anchor.
- **Glass Surfaces:** `rgba(20, 28, 22, 0.60)` with 16px to 24px hardware-accelerated backdrop blur (`backdrop-filter: blur(16px)`).
- **Elevated Controls & Floating Containers:** `#1C261F` with a soft top rim highlight of `rgba(255, 255, 255, 0.05)`.
- **Primary Accent (`#0FD920`):** Core interactive states, active indicators, and high-priority visual feedback.
- **Active / Neon Glow Accent (`#13FE27`):** Focused states, dynamic pulse animations, download speed spikes, and high-intensity radial halos.
- **Hover Accent (`#0BB81B`):** Slightly deeper emerald for direct mouse-down and hover suppression states.
- **Structural Outlines & Glass Borders:** `rgba(15, 217, 32, 0.15)` for cards; elevated inputs step down to `rgba(15, 217, 32, 0.22)`.
- **Dividers & Structural Hairlines:** `rgba(15, 217, 32, 0.08)`.

### Typography Colors
- **Headings & Key Metrics:** `#F0FDF4` (high-clarity crisp mint-white).
- **Body & Primary Labels:** `#DCFCE7` (legible, softened phosphor tint preventing retina fatigue).
- **Muted & Metadata:** `#718E76` (cool eucalyptus grey, strictly passing WCAG AA on `#090D0A`).

## Typography

Typography pairs the contemporary geometric rhythm of Plus Jakarta Sans for structure and branding with the systematic legibility of Inter for interface telemetry, tabular metrics, and form states.

### Implementation Rules
- **Numerical Telemetry:** File transfer speeds, bitrates, resolutions, and timestamps must always use tabular figures (`font-variant-numeric: tabular-nums`) through the `label-md` and `code-telemetry` tokens.
- **Optical Hierarchy:** Restrict bold weights strictly to active badges, critical headings, and primary CTA triggers. Use letter-spacing compression on headings larger than 18px to maintain compact, precision-tool balance.
- **Capitalization:** Section anchors, badges, and segmented toggles use uppercase text paired with `label-sm` or `label-md` and increased tracking (`0.04em`).

## Layout & Spacing

This design system targets non-browser desktop viewports (fixed canvas or resizeable frameless electron window, baseline 960x640 up to 1920x1080).

### Structural Architecture
- **Frameless Window Shell:** A persistent 38px drag-region title bar sits at top. The window chrome carries an inner safe margin of `margin-window` (12px) preventing glass panels from touching native OS borders.
- **Workspace Partitioning:** Two-column split-panel layout:
  - **Master Navigation / Source Rail:** Fixed width of 240px or collapsible to 64px.
  - **Detail / Task Queue Canvas:** Fluid flexible workspace filling all remaining horizontal real estate.
- **Grid & Alignment:** Internal panel components align to a fluid 12-column layout with 16px gutters (`gutter`). For ultra-dense download queues, sub-elements switch to `gutter-compact` (8px).
- **Rhythm & Padding:** All interactive inputs adhere strictly to vertical 4px base increments (e.g., 32px standard input, 40px prominent CTA).

## Elevation & Depth

Visual hierarchy is maintained through optical translucency, hardware-accelerated blur, and emerald photon emission rather than heavy drop shadows.

### The Translucent Stacking Model
1. **Level 0 (Canvas Void):** `#090D0A` to `#0D120E` base layer. No blur, no elevation.
2. **Level 1 (App Glass Panels & Sidebar):**
   - Background: `rgba(20, 28, 22, 0.60)`
   - Backdrop Blur: `16px`
   - Border: `1px solid rgba(15, 217, 32, 0.15)`
   - Shadow: `0 8px 32px 0 rgba(0, 0, 0, 0.45)`
   - Rim Light: `inset 0 1px 0 0 rgba(255, 255, 255, 0.05)`
3. **Level 2 (Nested Cards & Table Rows):**
   - Background: `#1C261F` at 70% opacity
   - Border: `1px solid rgba(15, 217, 32, 0.20)`
   - Shadow: `0 4px 16px rgba(0, 0, 0, 0.35)`
4. **Level 3 (Floating Menus, Modals & Dropdowns):**
   - Background: `rgba(24, 34, 27, 0.90)`
   - Backdrop Blur: `24px`
   - Border: `1px solid rgba(15, 217, 32, 0.30)`
   - Shadow: `0 12px 40px rgba(0, 0, 0, 0.65), 0 0 1px 1px rgba(15, 217, 32, 0.10)`

### Emerald Glow & Atmospheric Halo
- **Inactive / Idle Surfaces:** No glow.
- **Active / Focused Interactive Elements:** Glow ring using `box-shadow: 0 0 0 2px rgba(15, 217, 32, 0.20), 0 0 16px rgba(19, 254, 39, 0.25)`.
- **Primary CTA Pulse:** `box-shadow: 0 0 24px -4px rgba(19, 254, 39, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.30)`.

## Shapes

The interface balances sharp technological precision with ergonomic rounded touchpoints, anchored by a Category 2 geometry framework.

### Geometry Specifications
- **Base Corner Radius (`rounded-md`):** 8px (0.5rem) used across standard input fields, dropdown trigger buttons, and contextual action menus.
- **Structural Containers (`rounded-lg`):** 16px (1rem) applied to glass cards, floating modal windows, and queue list containers.
- **Pill Elements (`rounded-full`):** 9999px applied unconditionally to:
  - Navigation tab switches
  - Segmented controls
  - Format/Quality badges (e.g., `4K`, `60FPS`, `HDR`, `FLAC`)
  - The primary download execution button
- **Micro Radii (`rounded-sm`):** 4px applied to checkboxes, progress fill heads, and code blocks.

## Components

### Frameless Window Title Bar
- **Height & Behavior:** Fixed 38px, electron drag-region (`-webkit-app-region: drag`), unbuffered transparent background.
- **Window Controls (macOS / Windows Hybrid):**
  - Left-aligned traffic lights for macOS runtime (`close: #FF5F56`, `minimize: #FFBD2E`, `maximize: #27C93F` with 12px diameters).
  - Subtle window title centered in `label-sm` with color `#718E76`.
  - Right utility cluster (Settings gear, Network ping indicator, App Version badge) tagged with `-webkit-app-region: no-drag`.

### Buttons
- **Primary Download CTA:**
  - Shape: Pill (`rounded-full`), height: 44px, horizontal padding: 28px.
  - Background: Linear gradient (135deg, `#0FD920`, `#0BB81B`).
  - Text: `#090D0A`, weight 700 (`label-lg`).
  - Box Shadow: `0 0 20px rgba(15, 217, 32, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.35)`.
  - Hover: Background shifts to `#13FE27`; shadow expands to `0 0 28px rgba(19, 254, 39, 0.55)`.
  - Active: Scale transform `0.98`, background `#0BB81B`.
- **Secondary / Ghost Buttons:**
  - Shape: `rounded-md`, background: `rgba(20, 28, 22, 0.40)`.
  - Border: `1px solid rgba(15, 217, 32, 0.15)`.
  - Text: `#DCFCE7`.
  - Hover: Border color promotes to `rgba(15, 217, 32, 0.40)` with text `#F0FDF4`.

### Input Fields & URL Bar
- **Hero URL Input Field:**
  - Height: 48px, background: `#1C261F`, border: `1px solid rgba(15, 217, 32, 0.20)`, radius: 12px.
  - Typography: `body-lg`, `#F0FDF4`.
  - Placeholder: `#718E76`.
  - Leading Icon: Embedded paste trigger or media link status indicator.
  - Focus State: Border color `#0FD920`, shadow `0 0 0 3px rgba(15, 217, 32, 0.15), 0 0 16px rgba(15, 217, 32, 0.20)`.

### Segmented Controls & Navigation Tabs
- **Segmented Toggle:**
  - Track: Pill container with `#141C16`, inner shadow `inset 0 2px 4px rgba(0, 0, 0, 0.4)`.
  - Sliding Indicator: Pill geometry, `#1C261F`, border `1px solid rgba(15, 217, 32, 0.30)`, shadow `0 2px 8px rgba(0, 0, 0, 0.4)`.
  - Active Text: `#F0FDF4`, font weight 600.
  - Inactive Text: `#718E76`, transition `0.2s ease`.

### Pill Badges
- **Media Specs Badges (`4K`, `ProRes`, `MP4`, `120FPS`):**
  - Shape: Pill (`rounded-full`), height: 22px, padding: `0 10px`.
  - Background: `rgba(15, 217, 32, 0.08)`.
  - Border: `1px solid rgba(15, 217, 32, 0.25)`.
  - Text: `label-sm`, `#0FD920`.

### Custom Selects / Dropdowns
- **Trigger:** Height 36px, radius 8px, background `#1C261F`, border `1px solid rgba(15, 217, 32, 0.15)`.
- **Menu Container:** `Level 3` elevation glass dropdown, radius 10px, padding 4px.
- **Option Item:** Radius 6px, color `#DCFCE7`. On hover/focus: background `rgba(15, 217, 32, 0.12)`, text `#13FE27`.

### Checkboxes & Switches
- **Checkbox:** 18x18px box, radius 4px, border `1.5px solid rgba(15, 217, 32, 0.30)`. Checked: Background `#0FD920`, icon checkmark in `#090D0A`.
- **Switch:** 36x20px pill track. Inactive track `#1C261F`. Active track `#0FD920`. Thumb: 16px white circle with 2px offset.

### Download Queue Cards
- **Container:** Glass card (`rgba(20, 28, 22, 0.60)`), radius 12px, border `1px solid rgba(15, 217, 32, 0.12)`.
- **Video Thumbnail:** 16:9 ratio, radius 8px, subtle inner shadow.
- **Progress Bar:**
  - Track: 4px height, full width, background `rgba(28, 38, 31, 0.8)`.
  - Progress Fill: `#0FD920` graduating to `#13FE27`, head of fill carries `box-shadow: 0 0 10px #13FE27`.