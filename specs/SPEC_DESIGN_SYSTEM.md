# Mission Control — Design System Specification

## 1. Design Philosophy

**Keywords**: Minimal · Calm · Geometric · Intelligent · Light

The visual language is inspired by aerospace mission control rooms — precision, clarity, and spatial efficiency — translated into a consumer-friendly, approachable aesthetic. The design avoids decoration for its own sake; every visual element serves a functional purpose.

**Contrast approach**: Light backgrounds with high-contrast content. Geometric effects are subtle — they exist in the background, never competing with content.

---

## 2. Color System

### 2.1 Base Palette (CSS Custom Properties)

```css
:root {
  /* Neutrals */
  --color-bg:          #F8F9FC;   /* Page background — very light cool gray */
  --color-surface:     #FFFFFF;   /* Card/panel background */
  --color-surface-2:   #F1F3F9;   /* Slightly recessed surface */
  --color-border:      #E2E6F0;   /* Subtle borders */
  --color-border-2:    #CBD2E0;   /* Stronger border (inputs, dividers) */

  /* Text */
  --color-text-primary:   #0F1523;  /* Main text */
  --color-text-secondary: #4A5578;  /* Labels, captions */
  --color-text-muted:     #8E98B0;  /* Placeholder, metadata */
  --color-text-disabled:  #BCC4D6;  /* Disabled state */

  /* Brand — Indigo/Violet */
  --color-brand-50:   #EEF2FF;
  --color-brand-100:  #E0E7FF;
  --color-brand-200:  #C7D2FE;
  --color-brand-300:  #A5B4FC;
  --color-brand-400:  #818CF8;
  --color-brand-500:  #6366F1;   /* Primary brand */
  --color-brand-600:  #4F46E5;   /* Primary hover */
  --color-brand-700:  #4338CA;
  --color-brand-800:  #3730A3;
  --color-brand-900:  #312E81;

  /* Semantic */
  --color-success:   #10B981;
  --color-success-bg: #ECFDF5;
  --color-warning:   #F59E0B;
  --color-warning-bg: #FFFBEB;
  --color-error:     #EF4444;
  --color-error-bg:  #FEF2F2;
  --color-info:      #3B82F6;
  --color-info-bg:   #EFF6FF;

  /* Module accent colors (sidebar icons + badges) */
  --color-finance:   #10B981;  /* Green */
  --color-recipes:   #F97316;  /* Orange */
  --color-shopping:  #8B5CF6;  /* Purple */
  --color-jobs:      #3B82F6;  /* Blue */
  --color-calendar:  #EC4899;  /* Pink */
  --color-gallery:   #14B8A6;  /* Teal */
  --color-smarthome: #F59E0B;  /* Amber */
  --color-reminders: #EF4444;  /* Red */
  --color-agent:     #6366F1;  /* Indigo (brand) */
  --color-models:    #6B7280;  /* Gray */
  --color-reports:   #0EA5E9;  /* Sky */

  /* Geometric effect colors */
  --color-geo-line:   rgba(99, 102, 241, 0.07);  /* Grid lines */
  --color-geo-dot:    rgba(99, 102, 241, 0.12);  /* Grid dots */
  --color-geo-glow:   rgba(99, 102, 241, 0.15);  /* Orb glow */
}
```

### 2.2 Tailwind Config Extension

```typescript
// tailwind.config.ts
export default {
  content: ['./app/**/*.tsx', './components/**/*.tsx'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'var(--color-brand-50)',
          // ... all brand tokens
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          2: 'var(--color-surface-2)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          2: 'var(--color-border-2)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(15,21,35,0.06), 0 1px 2px rgba(15,21,35,0.04)',
        'card-hover': '0 4px 12px rgba(15,21,35,0.10), 0 2px 4px rgba(15,21,35,0.06)',
        'dialog': '0 20px 60px rgba(15,21,35,0.15)',
        'brand': '0 4px 14px rgba(99,102,241,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'geo-drift': 'geoDrift 20s ease-in-out infinite',
      },
    },
  },
} satisfies Config;
```

---

## 3. Typography

### 3.1 Font Loading

```html
<!-- In app/layout.tsx head -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
  rel="stylesheet"
/>
```

### 3.2 Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `text-hero` | 48px | 700 | 1.1 | Marketing/landing only |
| `text-h1` | 32px | 700 | 1.2 | Page titles |
| `text-h2` | 24px | 600 | 1.25 | Section headers |
| `text-h3` | 20px | 600 | 1.3 | Card headers |
| `text-h4` | 16px | 600 | 1.4 | Sub-section labels |
| `text-body-lg` | 16px | 400 | 1.6 | Primary body text |
| `text-body` | 14px | 400 | 1.6 | Default body text |
| `text-body-sm` | 13px | 400 | 1.5 | Secondary content |
| `text-caption` | 12px | 400 | 1.4 | Metadata, timestamps |
| `text-label` | 12px | 500 | 1 | Form labels, badges |
| `text-mono` | 13px | 400 | 1.6 | Code, terminal output |

### 3.3 Typography Rules
- Maximum line length: 68 characters for reading content
- Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text
- Letter spacing: -0.01em for headings, 0 for body, 0.05em for labels/badges

---

## 4. Spacing System

Based on an 4px base unit (following Tailwind defaults):

```
4px   → space-1  → micro gaps (icon+text)
8px   → space-2  → tight grouping
12px  → space-3  → item padding
16px  → space-4  → standard padding
20px  → space-5  → relaxed padding
24px  → space-6  → section gaps
32px  → space-8  → card padding
48px  → space-12 → major section spacing
64px  → space-16 → page-level spacing
```

---

## 5. Component Library

### 5.1 Button Variants

```typescript
// Variants + sizes
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'brand-gradient';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

// Primary: brand-500 bg, white text, brand shadow on hover
// Secondary: surface bg, border, brand text on hover
// Ghost: transparent, subtle hover bg
// Destructive: error bg on hover
// Brand-gradient: indigo→violet gradient (CTAs only)
```

**Visual spec:**
```
Primary Button (md):
  height: 36px | padding: 8px 16px | radius: 8px
  background: var(--color-brand-500)
  text: white, 14px, weight 500
  hover: var(--color-brand-600) + box-shadow: var(--shadow-brand)
  active: scale(0.98) transition
  disabled: opacity 0.4, cursor not-allowed
  loading: spinner replaces left icon, text unchanged
```

### 5.2 Card

```typescript
// Card variants
type CardVariant = 'default' | 'glass' | 'stat' | 'interactive';

// default: white bg, card shadow, border, 16px radius
// glass: white/80 bg, backdrop-blur-sm, border, lighter shadow
// stat: no border, tinted left accent bar
// interactive: default + hover shadow elevation + cursor pointer
```

**Glass card CSS:**
```css
.card-glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(226, 230, 240, 0.6);
  box-shadow: 0 1px 3px rgba(15,21,35,0.06);
}
```

### 5.3 Input

```
height: 36px | padding: 8px 12px | radius: 8px
border: 1px solid var(--color-border-2)
bg: white
focus: border-brand-500 + ring-2 ring-brand-200
error: border-error + error text below
placeholder: text-muted
```

### 5.4 Badge

```
height: 20px | padding: 2px 8px | radius: 999px
font: 11px, weight 500, uppercase, letter-spacing 0.04em

Variants:
  default    → gray bg + gray text
  brand      → brand-50 bg + brand-700 text
  success    → success-bg + success text
  warning    → warning-bg + warning text
  error      → error-bg + error text
  [module]   → module color bg/text
```

### 5.5 Sidebar Navigation

```
Width: 240px (expanded) | 64px (collapsed)
Transition: 200ms ease-in-out width + opacity

Item height: 40px
Item radius: 8px
Active: brand-50 bg + brand-600 text + brand left border (3px)
Hover: surface-2 bg
Icon: 20px, module accent color when active

Collapsed state: icons only, tooltip on hover
Mobile: slides in from left as drawer
```

---

## 6. Layout System

### 6.1 Shell Layout

```
┌──────────────────────────────────────────────────┐
│  TOPBAR (56px height)                            │
│  [☰ Sidebar toggle] [logo] ─── [Search] [User]  │
├────────────┬─────────────────────────────────────┤
│            │                                     │
│  SIDEBAR   │   PAGE CONTENT                      │
│  240px     │   max-width: 1280px, mx-auto        │
│            │   padding: 24px                     │
│            │                                     │
│            │                                     │
│            │                                     │
└────────────┴─────────────────────────────────────┘
```

### 6.2 Page Header Pattern

Every page starts with:
```tsx
<PageHeader
  title="Finance"
  subtitle="Track your spending and stay within budget"
  icon={<TrendingUp className="text-finance" />}
  actions={<Button>Add Transaction</Button>}
/>
```

### 6.3 Grid Layouts

```css
/* Dashboard widget grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
}

/* Standard module content grid */
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
```

---

## 7. Geometric Effects Specification

This is the signature visual element of the platform. Effects live in the background layer (`z-index: -1`) and never overlap interactive content.

### 7.1 Grid Background Effect

```tsx
// components/effects/geometric-bg.tsx
// Renders an SVG grid with perspective transformation + subtle animation

// Grid specs:
// - Line spacing: 40px
// - Line color: var(--color-geo-line)  (rgba indigo, 7% opacity)
// - Line width: 1px
// - Animation: very slow drift (translate Y by 40px over 20s, loop)
// - Only visible on large screens (md+)
// - Grid fades out at page edges (linear gradient mask)

export function GeometricBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <SVGGrid />          {/* Faint grid lines */}
      <OrbGlow />          {/* Soft radial gradient orb, top-right */}
      <FloatingShapes />   {/* 3-5 subtle geometric shapes (triangles, hexagons) */}
    </div>
  );
}
```

### 7.2 Orb Glow Effect

```css
.orb-glow {
  position: absolute;
  top: -20%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(
    circle,
    rgba(99, 102, 241, 0.08) 0%,
    rgba(139, 92, 246, 0.05) 40%,
    transparent 70%
  );
  border-radius: 50%;
  animation: float 8s ease-in-out infinite;
  /* Subtle enough to only be noticed on a second look */
}
```

### 7.3 Floating Geometric Shapes

```typescript
// 5 shapes total, randomly positioned at mount (seed from user ID for consistency)
const shapes = [
  { type: 'triangle', size: 40, opacity: 0.04, animDuration: 12 },
  { type: 'hexagon',  size: 28, opacity: 0.05, animDuration: 16 },
  { type: 'diamond',  size: 20, opacity: 0.06, animDuration: 10 },
  { type: 'triangle', size: 16, opacity: 0.04, animDuration: 20 },
  { type: 'square',   size: 12, opacity: 0.05, animDuration: 14 },
];
// Each floats with random translateY (±12px) on its own timer
// All colored with brand-500 at very low opacity
```

### 7.4 Card Entrance Animation

```typescript
// Framer Motion variants used on all module cards
export const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.25, ease: 'easeOut' },
  }),
};

// Usage: staggered entrance when page loads
// Each card gets its index as custom prop
```

### 7.5 AI Thinking Indicator

```typescript
// Three dots with varying opacity + scale, pulsing in sequence
// Used whenever an AI response is being generated
export function ThinkingIndicator() {
  return (
    <div className="flex gap-1 items-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-brand-400"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}
```

---

## 8. Motion Design

### 8.1 Duration Scale

```
50ms  → micro (button press, toggle)
150ms → fast (tooltip, badge)
200ms → standard (hover states)
300ms → medium (panel open, modal)
400ms → slow (page transitions)
600ms → expressive (hero animations, onboarding)
```

### 8.2 Easing Functions

```css
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);   /* Most interactions */
--ease-enter:    cubic-bezier(0.0, 0.0, 0.2, 1);  /* Elements entering */
--ease-exit:     cubic-bezier(0.4, 0.0, 1, 1);    /* Elements leaving */
--ease-spring:   cubic-bezier(0.5, -0.3, 0.5, 1.3); /* Playful bounce */
```

### 8.3 Page Transitions

```typescript
// app/(dashboard)/layout.tsx — wraps all page content
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
};
```

### 8.4 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Iconography

**Library**: Lucide React v0.400+

**Usage rules:**
- Size `sm`: 16px (inline with text)
- Size `md`: 20px (sidebar, action buttons) — default
- Size `lg`: 24px (page headers, empty states)
- Size `xl`: 32px (onboarding, large cards)
- Stroke width: 1.5px (default) for all icons
- Never use `fill` except for favorite/star/heart states
- Color: inherit from parent text color, except in module contexts

```typescript
// Module icon mapping
export const moduleIcons = {
  dashboard: LayoutDashboard,
  finance: TrendingUp,
  recipes: ChefHat,
  shopping: ShoppingCart,
  jobs: Briefcase,
  calendar: Calendar,
  gallery: Image,
  smarthome: Home,
  reminders: Bell,
  agent: Bot,
  models: Cpu,
  reports: FileBarChart,
} as const;
```

---

## 10. Empty States

Every module that can have no data must have a designed empty state:

```
┌────────────────────────────────┐
│                                │
│     [Module Icon — 48px]       │
│                                │
│  Nothing here yet              │  ← text-h3, text-secondary
│  Add your first transaction    │  ← text-body, text-muted
│  to get started.               │
│                                │
│  [ + Add Transaction ]         │  ← primary button
│                                │
└────────────────────────────────┘
```

---

## 11. Loading States

**Skeleton screens** (not spinners) for page-level loads:

```tsx
// Skeleton respects actual content layout
<SkeletonCard>
  <SkeletonLine className="w-1/3 h-4" />
  <SkeletonLine className="w-2/3 h-3 mt-2" />
  <SkeletonBlock className="w-full h-24 mt-4" />
</SkeletonCard>
```

**Inline spinners** (small, 16px) for button actions and small fetches.

---

## 12. Responsive Breakpoints

```
mobile:   < 640px  → single column, bottom nav
tablet:   640-1024px → sidebar collapses, 2-col grids
desktop:  > 1024px → full sidebar, 3-col grids
wide:     > 1440px → max-width 1280px, centered
```

**Mobile-specific:**
- Sidebar becomes bottom tab bar (5 most used modules)
- Cards go full-width, stacked vertically
- FAB (Floating Action Button) for primary action on each page
- Garage door control has large touch targets (min 56px)

---

## 13. Accessibility Standards

- **WCAG 2.1 AA** compliance
- All focusable elements have visible focus ring: `ring-2 ring-brand-500 ring-offset-2`
- Focus trapping in modals and drawers
- All images have descriptive `alt` text
- Color is never the only indicator of state (also use icon + label)
- `aria-live` regions for dynamic updates (AI responses, notifications)
- Keyboard navigation: Tab, Enter, Space, Escape, Arrow keys work as expected
- `prefers-color-scheme` hook ready (dark mode in future phase)

---

*Last updated: 2026-05-22 | Version: 1.0.0*
