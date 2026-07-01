---
name: theFOX Web
description: Mobile-first black and silver fresh goods delivery marketplace.
colors:
  light-bg: "#f7f7f5"
  light-bg-soft: "#ededeb"
  light-surface: "#ffffff"
  dark-bg: "#050505"
  dark-bg-soft: "#0f0f10"
  dark-surface: "#141416"
  dark-raised: "#1b1c1f"
  ink: "#101010"
  white-ink: "#f6f6f2"
  muted: "#5d5f63"
  dark-muted: "#b5b8bd"
  silver: "#c7cbd1"
  silver-bright: "#eef0f3"
  success: "#2f7d50"
  warning: "#a16500"
  danger: "#c43737"
typography:
  display:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "2.55rem"
    fontWeight: 900
    lineHeight: 1.08
    letterSpacing: "normal"
  headline:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "1.18rem"
    fontWeight: 850
    lineHeight: 1.2
  title:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "1.04rem"
    fontWeight: 850
    lineHeight: 1.25
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "0.94rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "0.76rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  sm: "10px"
  md: "16px"
  lg: "22px"
  dock: "24px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "14px"
  lg: "18px"
  xl: "22px"
  xxl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white-ink}"
    rounded: "{rounded.sm}"
    height: "48px"
  icon-button:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.ink}"
    rounded: "50%"
    height: "42px"
    width: "42px"
  product-card:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "13px"
  bottom-nav:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.dock}"
    height: "66px"
  theme-switcher:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.muted}"
    rounded: "999px"
    height: "54px"
---

# Design System: theFOX Web

## 1. Overview

**Creative North Star: "Silver Fox Delivery OS"**

theFOX is a mobile-first delivery marketplace with the ordering ergonomics users know from LINE MAN and Grab: search first, nearby shops, ETA, rating, quick add, and bottom navigation. The visual identity should not copy their green category language. theFOX is black, silver, and restrained, closer to Uber's product confidence with a polished metallic cue from the silver fox-head logo.

The system supports both light and dark themes. Light mode should feel clean, fast, and everyday-use friendly. Dark mode should feel premium and operational, with black surfaces, silver accents, and sharp contrast. Both modes should share the same component anatomy so marketplace and future vendor/admin surfaces feel like one product.

**Key Characteristics:**
- Mobile-first app shell with sticky top location, search, horizontal service chips, product rails, and bottom nav.
- Black and silver brand palette with no green brand accent.
- Built-in light/dark theme preview control for design tuning before deeper flows are built.
- Clear delivery marketplace signals: ETA, distance, rating, stock, unit, and quick add.
- Light/dark theme parity using the same tokens.
- Product UI discipline: familiar controls, strong focus states, compact cards, and no decorative excess.

## 2. Colors

The palette is black and silver with semantic colors kept separate from brand identity.

### Primary
- **Fox Black** (#101010 / #050505): Primary brand action, dark canvas, active bottom nav, and Uber-like product restraint.
- **Polished Silver** (#c7cbd1): Logo cue, trust marks, focus treatment, and metallic brand highlight.

### Secondary
- **Silver Bright** (#eef0f3): Light metallic highlight and dark-mode raised surface detail.

### Neutral
- **Light Background** (#f7f7f5): App background in light mode.
- **Light Soft Background** (#ededeb): Search fields, metadata pills, and subtle grouped surfaces.
- **Light Surface** (#ffffff): Cards, sheets, top controls.
- **Dark Background** (#050505): Dark-mode app background.
- **Dark Soft Background** (#0f0f10): Dark-mode grouped surface.
- **Dark Surface** (#141416): Dark-mode cards and controls.
- **Dark Raised** (#1b1c1f): Higher dark-mode surfaces.
- **Ink** (#101010): Primary light-mode text.
- **White Ink** (#f6f6f2): Primary dark-mode text.

### Named Rules

**The No Green Brand Rule.** Green can appear only as a semantic success color when required. It must never be the primary brand accent, active tab, CTA, or category color.

**The Silver Logo Rule.** Silver is a brand cue, not a decoration flood. Use it for logo mark, trust, focus, and small premium details.

## 3. Typography

**Display Font:** Arial, Helvetica, sans-serif
**Body Font:** Arial, Helvetica, sans-serif
**Label/Mono Font:** Arial, Helvetica, sans-serif

**Character:** The type system is tight and product-native. It should feel like a delivery app: readable at phone scale, fast to scan, and never theatrical.

### Hierarchy
- **Display** (900, `1.64rem` mobile / `2.55rem` desktop, 1.08): Hero strip headline and campaign-like marketplace moments.
- **Headline** (850, `1.18rem`, 1.2): Section headers such as nearby shops and active orders.
- **Title** (850, `1.04rem`, 1.25): Product names and merchant card titles.
- **Body** (400, `0.86rem-0.94rem`, 1.45-1.65): Descriptions, merchant text, and Thai helper copy.
- **Label** (800, `0.72rem-0.76rem`, normal tracking): ETA, rating, category, stock, and metadata chips.

### Named Rules

**The Phone First Type Rule.** Start every type decision at 320px width. Desktop may add room, but mobile owns the hierarchy.

## 4. Elevation

Elevation uses crisp surfaces, borders, and soft app shadows. Light mode has gentle delivery-app card lift. Dark mode relies more on tonal separation and deeper shadow.

### Shadow Vocabulary
- **Soft Card Shadow** (`0 16px 40px rgba(16, 16, 16, 0.08)`): Light-mode cards and search shell.
- **Dark Card Shadow** (`0 22px 60px rgba(0, 0, 0, 0.36)`): Dark-mode raised cards.
- **Dock Shadow** (`0 -18px 46px rgba(16, 16, 16, 0.14)`): Mobile bottom nav dock.

### Named Rules

**The App Surface Rule.** Cards, search, and bottom nav should feel like functional app surfaces. Avoid marketing-page hero depth and decorative glow.

## 5. Components

### Buttons
- **Shape:** Rounded mobile controls (`10px`) for action buttons, circular for icon actions.
- **Primary:** Fox Black background with White Ink in light mode; inverted in dark mode.
- **Hover / Focus:** Subtle state shifts only. Focus must use a visible silver ring.
- **Quick Add:** Circular 38px button inside product cards, using the active brand contrast pair.

### Chips
- **Style:** Horizontal scroll row, pill shape, bordered neutral surface.
- **State:** Active chip uses the black/white contrast pair. Inactive chips remain neutral; do not use green.

### Cards / Containers
- **Corner Style:** Large app-card radius (`22px`).
- **Background:** Theme surface token; never translucent glass.
- **Shadow Strategy:** Soft card shadow in light mode, stronger tonal separation in dark mode.
- **Border:** Subtle theme line tokens for all cards and controls.
- **Internal Padding:** 12-16px for mobile density.

### Inputs / Fields
- **Style:** Search-first input in a soft grouped surface with search icon and high-contrast placeholder.
- **Focus:** Silver focus ring outside the field.
- **Error / Disabled:** Use semantic tokens plus text/icon support, not color alone.

### Navigation
- **Style:** Mobile bottom dock with four primary tabs. Active tab uses black/white contrast, inactive tabs use muted text.
- **Desktop:** Bottom nav can hide when wider product navigation exists.

### Theme Switcher
- **Style:** Compact two-option segmented control for Light and Dark preview.
- **Purpose:** Let the team tune both themes in context without depending only on OS-level preference.
- **Touch Target:** Each segment should be at least 44px tall.

### Product Card
- **Style:** Image-led horizontal rail card with category, rating, product name, merchant, ETA, distance, stock, price, unit, and quick add.
- **Behavior:** Rail scrolls on mobile and becomes a grid on desktop.

## 6. Do's and Don'ts

### Do:
- **Do** design from mobile first: search, categories, product cards, quick add, and bottom navigation must work at 320px.
- **Do** use black and silver as the brand system across light and dark themes.
- **Do** expose delivery marketplace details: ETA, distance, rating, stock, unit, price, merchant, and order state.
- **Do** keep controls familiar to food-delivery users while making theFOX visually distinct.
- **Do** keep touch targets at 44px minimum on mobile controls.
- **Do** test both `prefers-color-scheme: light` and `prefers-color-scheme: dark`.

### Don't:
- **Don't** use green as the brand color, CTA color, active nav color, or category color.
- **Don't** copy LINE MAN or Grab visual identity directly; borrow workflow patterns, not palette.
- **Don't** use neon cybermarket styling, glassmorphism, purple-blue AI gradients, or gradient text.
- **Don't** overdo silver into chrome decoration; keep it as a premium cue.
- **Don't** rely on color alone for stock, role, order, warning, or error states.
