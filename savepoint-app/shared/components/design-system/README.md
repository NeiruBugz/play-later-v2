# SavePoint Design System

A comprehensive design system for SavePoint, built on top of shadcn/ui with Apple-level attention to detail and consistency.

## Design Philosophy

SavePoint's design system is inspired by the warm, inviting aesthetic of aged paper and leather-bound books, combined with Apple's meticulous attention to detail and smooth interactions.

### Core Principles

1. **Consistency** - Every element follows predictable patterns
2. **Clarity** - Visual hierarchy guides users naturally
3. **Delight** - Smooth micro-interactions create a polished feel
4. **Accessibility** - Inclusive design for all users
5. **Themeability** - Easy switching between visual styles

## Design Tokens

All design tokens are defined as CSS variables in `shared/globals.css` and exported as JavaScript constants in `shared/lib/design-system/themes.ts`.

### Color System

#### Semantic Colors

| Token | Usage | Example |
|-------|-------|---------|
| `--primary` | Primary brand actions | Primary buttons, links |
| `--secondary` | Secondary actions | Secondary buttons |
| `--accent` | Highlighted content | Badges, tags |
| `--muted` | Subdued backgrounds | Input backgrounds, disabled states |
| `--destructive` | Destructive actions | Delete buttons, error states |
| `--success` | Success feedback | Success messages, completed states |
| `--warning` | Warning feedback | Warning messages, cautionary states |
| `--info` | Informational feedback | Info messages, help text |

#### Usage Guidelines

✅ **Do:**
- Use semantic color tokens (`bg-primary`, `text-success`)
- Consider color contrast for accessibility
- Test colors in both light and dark modes

❌ **Don't:**
- Use hardcoded color values (`bg-blue-500`)
- Mix semantic colors inconsistently
- Rely on color alone to convey information

### Typography Scale

Typography utilities combine font size, line height, letter spacing, and weight for perfect readability.

#### Display Text
- `.display-2xl` - 72px, Hero headings
- `.display-xl` - 60px, Large hero headings
- `.display-lg` - 48px, Section headers

#### Headings
- `.heading-xl` - 36px, Page titles
- `.heading-lg` - 30px, Section titles
- `.heading-md` - 24px, Subsection titles
- `.heading-sm` - 20px, Card titles
- `.heading-xs` - 18px, Small card titles

#### Body Text
- `.body-lg` - 18px, Emphasized body text
- `.body-md` - 16px, Default body text
- `.body-sm` - 14px, Secondary text
- `.body-xs` - 12px, Fine print

#### Specialty
- `.caption` - 12px, Image captions, metadata
- `.overline` - 12px uppercase, Labels, categories

#### Usage Guidelines

✅ **Do:**
```tsx
<h1 className="heading-xl">Page Title</h1>
<p className="body-md text-muted-foreground">Description text</p>
```

❌ **Don't:**
```tsx
<h1 className="text-3xl font-bold">Page Title</h1>
<p className="text-base text-gray-600">Description text</p>
```

### Spacing Scale

Consistent spacing creates visual rhythm and hierarchy.

#### Semantic Spacing

| Token | Value | Usage | Utility Classes |
|-------|-------|-------|----------------|
| `--space-compact` | 6px | Tight spacing, icon gaps | `gap-compact`, `space-x-compact` |
| `--space-comfortable` | 16px | Default spacing | `gap-comfortable`, `space-x-comfortable` |
| `--space-spacious` | 24px | Generous spacing | `gap-spacious`, `space-x-spacious` |

#### Guidelines

- **Compact**: Badge groups, toolbar buttons, inline lists
- **Comfortable**: Card grids, form fields, section content
- **Spacious**: Major sections, empty states, hero content

### Border Radius

Rounded corners soften the interface and create a friendly feel.

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | Badges, small elements |
| `--radius-md` | 10px | Buttons, inputs |
| `--radius-lg` | 12px | Cards, dialogs |
| `--radius-xl` | 16px | Large cards, hero sections |
| `--radius-pill` | 9999px | Pills, avatars |

### Shadow System

Paper-like shadows create subtle depth and hierarchy.

| Level | Utility Class | Usage |
|-------|--------------|-------|
| **sm** | `.shadow-paper-sm` | Buttons at rest, input fields |
| **default** | `.shadow-paper` | Cards at rest |
| **md** | `.shadow-paper-md` | Cards on hover, floating elements |
| **lg** | `.shadow-paper-lg` | Modals, dialogs, dropdowns |

#### Apple-Style Shadow Guidelines

1. **Layered Shadows**: Combine soft and sharp shadows for realism
2. **Subtle Motion**: Elevate shadows on hover/interaction
3. **Consistent Direction**: Light source from top-left
4. **Dark Mode**: Deeper, more pronounced shadows

### Animation Durations

Apple-quality timing creates smooth, natural motion.

| Token | Value | Usage | Utility Class |
|-------|-------|-------|--------------|
| `--duration-fast` | 150ms | Micro-interactions (hovers, toggles) | `.duration-fast` |
| `--duration-normal` | 200ms | Standard transitions (buttons, cards) | `.duration-normal` |
| `--duration-slow` | 300ms | Emphasized motion (modals, panels) | `.duration-slow` |

#### Motion Guidelines

✅ **Do:**
- Use easing functions (`ease-out` for entrances, `ease-in` for exits)
- Combine transforms (scale + shadow for "lifting")
- Keep motion purposeful and subtle

❌ **Don't:**
- Use linear motion (feels robotic)
- Over-animate (creates chaos)
- Mix inconsistent durations

## Component Patterns

### Interactive Elements

#### Hover States

Standard hover pattern for cards and interactive elements:

```tsx
<div className="transition-all duration-normal hover:scale-[1.02] hover:shadow-paper-md">
  {/* Card content */}
</div>
```

#### Button Variants

See `shared/components/ui/button.tsx` for all button variants:

- **default**: Primary actions
- **secondary**: Secondary actions
- **outline**: Tertiary actions
- **ghost**: Minimal emphasis
- **destructive**: Dangerous actions
- **link**: Text-only links

#### Loading States

Use the `Skeleton` component from shadcn/ui:

```tsx
import { Skeleton } from "@/shared/components/ui/skeleton";

<Skeleton className="h-32 w-24 rounded-md" />
```

### Layout Patterns

#### Responsive Grids

Standard responsive grid pattern:

```tsx
<div className="grid grid-cols-2 gap-comfortable sm:grid-cols-3 lg:grid-cols-4">
  {/* Grid items */}
</div>
```

#### Flexible Layouts

Use semantic spacing for consistent gaps:

```tsx
<div className="flex flex-wrap gap-compact">
  {/* Badges, tags */}
</div>

<div className="flex flex-col gap-comfortable">
  {/* Form fields, stacked content */}
</div>
```

## Apple-Level Details

### Micro-Interactions

1. **Scale + Shadow**: Cards lift slightly on hover
   ```css
   hover:scale-[1.02] hover:shadow-paper-md
   ```

2. **Opacity Transitions**: Smooth fade-in for overlays
   ```css
   opacity-0 transition-opacity duration-normal group-hover:opacity-100
   ```

3. **Transform Origin**: Natural pivot points
   ```css
   transform-origin-center hover:scale-105
   ```

### Visual Polish

1. **Consistent Spacing**: Always use design tokens, never arbitrary values
2. **Perfect Alignment**: Icons and text should be visually centered
3. **Appropriate Weights**: Use semantic font weights (heading, body, caption)
4. **Balanced Composition**: Equal visual weight across sections

### Accessibility

1. **Color Contrast**: All text meets WCAG AA standards (4.5:1 for body, 3:1 for large text)
2. **Focus States**: Visible focus rings on all interactive elements
3. **Keyboard Navigation**: Logical tab order and keyboard shortcuts
4. **Screen Readers**: Semantic HTML and ARIA labels where needed

## Theme System

### Using Themes

Import and apply themes programmatically:

```tsx
import { applyThemePreset, themePresets } from "@/shared/lib/design-system";

// Apply theme
applyThemePreset("midnight");

// Get current theme
const currentTheme = getCurrentThemePreset();
```

### Available Themes

1. **Aged Paper (default)**: Warm, cozy tones
2. **Modern Clean**: High-contrast, crisp design
3. **Midnight**: Deep dark mode
4. **Monochrome**: Grayscale focus mode

### Creating Custom Themes

Add new theme classes in `globals.css`:

```css
.theme-custom {
  --primary: oklch(0.50 0.15 200);
  --background: oklch(0.98 0.002 200);
  /* Override other tokens as needed */
}
```

Register in `themes.ts`:

```ts
export const themePresets: Record<ThemePreset, ThemeConfig> = {
  // ... existing themes
  custom: {
    name: "Custom Theme",
    description: "Your custom theme description",
    className: "theme-custom",
  },
};
```

## Component Development Checklist

When creating or updating components, ensure:

- [ ] Uses design tokens (no hardcoded values)
- [ ] Implements proper hover states
- [ ] Uses semantic spacing (`gap-comfortable`, etc.)
- [ ] Typography uses utility classes (`.heading-lg`, `.body-md`)
- [ ] Transitions use token durations (`.duration-normal`)
- [ ] Works in both light and dark modes
- [ ] Accessible (keyboard nav, focus states, ARIA)
- [ ] Responsive (works on mobile, tablet, desktop)
- [ ] Documented in Storybook (when applicable)

## Quick Reference

### Common Patterns

```tsx
// Card with hover effect
<Card className="transition-all duration-normal hover:shadow-paper-md">
  <CardHeader className="gap-comfortable">
    <CardTitle className="heading-md">Title</CardTitle>
    <CardDescription className="body-sm text-muted-foreground">
      Description
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-comfortable">
    {/* Content */}
  </CardContent>
</Card>

// Badge group
<div className="flex flex-wrap gap-compact">
  {badges.map(badge => <Badge key={badge}>{badge}</Badge>)}
</div>

// Success message
<Alert className="bg-success/10 border-success/30 text-success">
  <CheckCircle className="h-4 w-4" />
  <AlertDescription>Operation successful!</AlertDescription>
</Alert>
```

## Resources

- **Design Tokens**: `shared/lib/design-system/themes.ts`
- **CSS Variables**: `shared/globals.css`
- **Base Components**: `shared/components/ui/`
- **shadcn/ui Docs**: https://ui.shadcn.com/
- **Tailwind CSS v4**: https://tailwindcss.com/docs

---

**Note**: This design system is living documentation. Update this file as new patterns emerge and components evolve.
