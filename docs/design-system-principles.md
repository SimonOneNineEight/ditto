# Ditto Design System Principles

**Version:** 1.0
**Last Updated:** 2026-01-12
**Author:** Simon

---

## Design Philosophy

### Core Principles

**1. Dark Theme First**
- Design for dark mode as the primary experience
- Light theme as secondary consideration
- Dark backgrounds reduce eye strain during extended job search sessions

**2. 80% Notion-Like Aesthetic**
- Clean, minimal, document-editing feel
- Content-first, chrome-last approach
- Forms should feel like editing a document, not filling out a traditional form

**3. Calm and Focused**
- Reduce cognitive load during an already stressful job search process
- Feel like a reliable workspace, not another source of stress
- No unnecessary visual noise or distractions

**4. Progressive Disclosure**
- Start simple, reveal complexity only when needed
- Hover reveals actions (ghostly buttons)
- Borders appear on interaction, not by default

---

## Color Palette

### Primary Colors (Dark Theme)

```css
/* Backgrounds */
--background: hsl(212 12% 13%);        /* Main page background */
--card: hsl(192 9% 18%);               /* Elevated surfaces */
--muted: hsl(192 8% 25%);              /* Subtle backgrounds, hover states */

/* Text */
--foreground: hsl(192 7% 97%);         /* Primary text */
--muted-foreground: hsl(192 6% 55%);   /* Secondary text, labels */

/* Borders */
--border: hsl(192 8% 22%);             /* Subtle borders (appear on hover) */
--border-hover: hsl(192 8% 30%);       /* Active/focus borders */
```

### Brand Colors

```css
/* Blue - Primary Actions */
--primary: hsl(219 93% 53%);           /* #219BF3 - Save, Submit, Main CTAs */
--primary-muted: hsl(219 50% 20%);     /* Subtle blue backgrounds */

/* Orange - Secondary Actions */
--secondary: hsl(32 92% 50%);          /* #FF7C2A - Import, Supporting actions */
--secondary-muted: hsl(32 60% 22%);    /* Subtle orange backgrounds */

/* Yellow - Success/Accent */
--accent: hsl(48 91% 54%);             /* #F2C744 - Success states, highlights */
--accent-muted: hsl(48 50% 18%);       /* Subtle yellow backgrounds */
```

### Color Usage Rules

| Color | Use For | Examples |
|-------|---------|----------|
| **Blue (Primary)** | Main actions, primary CTAs | Save button, Submit, Create |
| **Orange (Secondary)** | Supporting actions, imports | Import button, secondary actions |
| **Yellow (Accent)** | Success states, confirmations | "Imported" label, success toasts, field highlights |
| **Muted Foreground** | Labels, secondary text | Field labels, helper text, breadcrumbs |

---

## Typography

### Font Family

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
-webkit-font-smoothing: antialiased;
```

### Type Scale

| Element | Size | Weight | Letter-spacing | Use |
|---------|------|--------|----------------|-----|
| **Page Title** | 40px | 600 | -0.03em | Main page headings |
| **Section Title** | 24px | 600 | -0.02em | Section headings |
| **Body** | 16px | 400 | normal | Form inputs, content |
| **Body Small** | 15px | 400 | normal | Secondary content |
| **Labels** | 11px | 500 | 0.08em | Field labels (uppercase) |
| **Caption** | 12px | 400 | normal | Helper text, hints |

### Label Style

Field labels follow Notion's uppercase style:

```css
.field-label {
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted-foreground);
    opacity: 0.6;
}
```

---

## Spacing & Layout

### Page Layout

```css
.page {
    max-width: 720px;      /* Content width for forms */
    margin: 0 auto;
    padding: 60px 48px;    /* Generous vertical padding */
}
```

### Spacing Scale

| Token | Value | Use |
|-------|-------|-----|
| `xs` | 4px | Tight spacing, inline elements |
| `sm` | 8px | Between related elements |
| `md` | 16px | Standard spacing |
| `lg` | 24px | Section spacing |
| `xl` | 32px | Major section breaks |
| `2xl` | 48px | Page sections |

### Section Spacing

- Between fields in same section: 8px padding
- Between sections: 40px margin
- Divider margins: 32px top/bottom
- Actions from content: 48px margin-top

---

## Components

### Inputs (Document Style)

Inputs should look like plain text until focused:

```css
.field-input {
    width: 100%;
    background: transparent;
    border: none;
    color: var(--foreground);
    font-size: 16px;
    outline: none;
    padding: 4px 0;
}

.field-input::placeholder {
    color: var(--muted-foreground);
    opacity: 0.4;
}
```

**Field Container Behavior:**
- Default: No visible border
- Hover: Subtle bottom border appears (`border-color: var(--border)`)
- Focus: Slightly brighter border (`border-color: var(--border-hover)`)

### Buttons

**Primary Button (Blue)**
```css
.btn-primary {
    background: var(--primary);
    border: none;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
}
```

**Ghost Button (Hover-reveal)**
```css
.btn-ghost {
    background: transparent;
    border: none;
    color: var(--muted-foreground);
    opacity: 0;  /* Hidden by default */
}

.parent:hover .btn-ghost {
    opacity: 1;  /* Appears on parent hover */
}

.btn-ghost:hover {
    background: var(--muted);
    color: var(--foreground);
}
```

**Secondary Button (Orange)**
```css
.btn-secondary:hover {
    background: var(--secondary);
    color: white;
    border-color: var(--secondary);
}
```

### Cards

Minimal card styling - let content breathe:

```css
.card {
    background: var(--card);
    border-radius: 8px;
    padding: 24px;
    /* No border by default - content defines boundaries */
}
```

### Dividers

Subtle, not prominent:

```css
.divider {
    height: 1px;
    background: var(--border);
    margin: 32px 0;
    opacity: 0.5;
}
```

### Toast Notifications

Centered at bottom, minimal:

```css
.toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 20px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 14px;
}

.toast.success {
    border-color: var(--accent-muted);
    color: var(--accent);
}
```

---

## Interaction Patterns

### Hover-Reveal Actions

Actions appear on hover, not cluttering the default state:

```
Default state:  [                          ]
Hover state:    [                   [Import]]
```

### Border Transitions

Borders fade in smoothly:

```css
.field {
    border-bottom: 1px solid transparent;
    transition: border-color 0.15s;
}

.field:hover {
    border-color: var(--border);
}
```

### Success State Animation

Fields flash with accent color on populate:

```css
.field.just-populated {
    background: var(--accent-muted);
    border-radius: 4px;
    /* Fades out after 1.5s */
}
```

### Loading States

Orange spinner for secondary actions:

```css
.spinner {
    border: 2px solid var(--border);
    border-top-color: var(--secondary);  /* Orange */
    animation: spin 0.8s linear infinite;
}
```

---

## Responsive Behavior

### Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 640px | Single column, reduced padding |
| Tablet | 640-1024px | Content max-width maintained |
| Desktop | > 1024px | Full experience |

### Mobile Adjustments

```css
@media (max-width: 640px) {
    .page {
        padding: 32px 20px;
    }

    .page-title {
        font-size: 32px;
    }
}
```

---

## Accessibility

### Focus States

Always visible focus rings for keyboard navigation:

```css
:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
}
```

### Color Contrast

- Text on dark background: minimum 4.5:1 ratio
- Interactive elements: minimum 3:1 ratio
- Use `--foreground` for primary text (meets WCAG AA)

### Motion

Respect reduced motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

---

## Design References

### Primary Design Asset

**[ditto-design.pen](../ditto-design.pen)** - The complete Pencil design file containing:
- **Design System**: 80 reusable components
- **22 Screen Designs**: All application screens with component compositions
- **Component Library**: Buttons, inputs, cards, badges, modals, tables, and more
- **State Variants**: Default, hover, focus, active, disabled states

Use this file as the source of truth for visual implementation details.

### Inspiration Sources

1. **Notion** - Document-editing feel, minimal chrome, hover-reveal actions
2. **Linear** - Dark theme execution, typography, professional feel
3. **Vercel** - Clean forms, subtle interactions

### What to Avoid

- Heavy shadows or gradients
- Prominent borders on everything
- Traditional form styling (visible input boxes)
- Colorful backgrounds for sections
- Excessive use of icons
- Multiple competing accent colors

---

## Implementation Notes

### For AI Agents

When creating UI mockups for Ditto:

1. **Always start with dark theme** (`--background: hsl(212 12% 13%)`)
2. **Use the brand colors purposefully:**
   - Blue for primary actions (Save, Submit)
   - Orange for secondary actions (Import, supporting CTAs)
   - Yellow for success states only
3. **Keep borders invisible by default** - reveal on hover/focus
4. **Use uppercase labels** at 11px with letter-spacing
5. **Big, bold titles** at 40px with negative letter-spacing
6. **Generous whitespace** - 48-60px padding on pages
7. **Ghost buttons** that appear on hover
8. **Centered toasts** at the bottom

### CSS Variables Template

```css
:root {
    /* Backgrounds */
    --background: hsl(212 12% 13%);
    --card: hsl(192 9% 18%);
    --muted: hsl(192 8% 25%);

    /* Text */
    --foreground: hsl(192 7% 97%);
    --muted-foreground: hsl(192 6% 55%);

    /* Borders */
    --border: hsl(192 8% 22%);
    --border-hover: hsl(192 8% 30%);

    /* Brand Colors */
    --primary: hsl(219 93% 53%);
    --primary-muted: hsl(219 50% 20%);
    --secondary: hsl(32 92% 50%);
    --secondary-muted: hsl(32 60% 22%);
    --accent: hsl(48 91% 54%);
    --accent-muted: hsl(48 50% 18%);
}
```

---

## Changelog

### v1.0 (2026-01-12)
- Initial design system principles document
- Established dark theme first approach
- Defined color palette (blue, orange, yellow)
- Documented Notion-like aesthetic guidelines
- Created component patterns (inputs, buttons, toasts)
- Added implementation notes for AI agents
