# CLAUDE.md - Landing Feature

This file provides guidance to Claude Code when working with the Landing feature module in the PlayLater application.

## Feature Overview

### Purpose

The Landing feature serves as the primary marketing and conversion entry point for PlayLater. It presents the application's core value proposition to unauthenticated users through an engaging, feature-focused landing page that drives user registration and adoption.

### Business Goals

- Convert visitors to registered users (target: >12% conversion rate)
- Communicate key application benefits and features clearly
- Create positive first impression with professional design
- Drive user engagement through strategic call-to-action placement
- Support marketing and user acquisition efforts

## Architecture & Components

### Component Structure

#### FeatureCard Component

**Location**: `/features/landing/components/feature-card.tsx`

A reusable, interactive card component designed to showcase application features with visual appeal and hover effects.

**Props Interface**:

```typescript
{
  icon: React.ReactNode; // Lucide React icon component
  title: string; // Feature title
  description: string; // Feature description
}
```

**Key Features**:

- **Interactive Design** (lines 19-20): Hover effects with translate, border color, and shadow transitions
- **Visual Hierarchy** (lines 23-28): Icon + title layout with consistent spacing
- **Gradient Effects** (line 20): Dynamic background gradient on hover
- **Accessibility**: Semantic HTML structure with proper heading hierarchy
- **Responsive Design**: Works across all device sizes

**Styling Patterns**:

- **Backdrop Blur** (line 19): `backdrop-blur-sm` for modern glass morphism effect
- **Smooth Transitions** (line 19): 300ms duration for all hover states
- **Group Hover States** (lines 20, 24): Coordinated hover effects across child elements
- **Ring Borders** (line 24): Subtle border rings with hover state changes

### Implementation Usage

The FeatureCard is primarily used in the root page (`/app/page.tsx`) within the features section:

**Usage Pattern** (lines 104-133 in `/app/page.tsx`):

```jsx
<FeatureCard
  icon={<Gamepad2 className="size-8 text-primary" />}
  title="Smart Collection Management"
  description="Track your games across multiple platforms..."
/>
```

**Features Showcased**:

1. **Smart Collection Management** - Core game organization functionality
2. **Wishlist & Release Tracking** - Upcoming games and notifications
3. **Personal Analytics Dashboard** - Collection statistics and insights
4. **Game Reviews & Ratings** - User-generated content system
5. **IGDB Game Database** - Rich game metadata integration
6. **Social Sharing Features** - Public wishlist sharing capabilities

## Data Flow & Integration

### Client-Side Only Architecture

The landing feature operates entirely on the client side with no server actions or data fetching requirements.

**Data Flow**:

```
Static Content → React Components → UI Rendering
```

### Integration Points

1. **Authentication Flow** (line 72 in `/app/page.tsx`):

   - Integrates with `SignIn` component from `/features/sign-in`
   - Conditional rendering based on authentication state
   - Multiple CTA placements for conversion optimization

2. **Shared Component System**:

   - **Typography Components**: `Display`, `Subheading`, `Body`, `ResponsiveHeading`
   - **UI Components**: shadcn/ui `Card` system for consistent styling
   - **Icon System**: Lucide React icons for visual consistency

3. **Layout Integration**:
   - Responsive grid systems for feature showcase
   - Gradient backgrounds and animated elements
   - Footer integration with brand consistency

## TypeScript Patterns

### Component Props Pattern

**File**: `/features/landing/components/feature-card.tsx` (lines 13-16)

```typescript
{
  icon: React.ReactNode;
  title: string;
  description: string;
}
```

**Strengths**:

- Simple, focused interface
- Strong typing for all props
- `React.ReactNode` for flexible icon components
- No optional props - clear requirements

### Export Pattern

**File**: `/features/landing/index.ts`

```typescript
export { FeatureCard } from "./components/feature-card";
```

**Benefits**:

- Clean feature boundaries
- Single import entry point
- Easy component discovery

## Key Files & Responsibilities

### Core Files

| File                          | Responsibility                      | Lines of Code |
| ----------------------------- | ----------------------------------- | ------------- |
| `index.ts`                    | Feature exports and public API      | 2             |
| `components/feature-card.tsx` | Reusable feature showcase component | 38            |

### Related Files

| File                                | Purpose                          | Integration                     |
| ----------------------------------- | -------------------------------- | ------------------------------- |
| `/app/page.tsx`                     | Main landing page implementation | Primary consumer of FeatureCard |
| `/shared/components/ui/card.tsx`    | Base card component system       | Styling foundation              |
| `/shared/components/typography.tsx` | Typography component library     | Text rendering                  |

## Testing Strategy

### Current State

**No tests currently implemented** - This presents an opportunity for improvement.

### Recommended Testing Approach

#### Unit Testing

```typescript
// Suggested test structure
describe("FeatureCard", () => {
  it("renders with required props", () => {
    // Test basic rendering
  });

  it("applies hover effects on interaction", () => {
    // Test interactive states
  });

  it("maintains accessibility standards", () => {
    // Test ARIA attributes and keyboard navigation
  });
});
```

#### Visual Testing

- Snapshot testing for design consistency
- Responsive design testing across breakpoints
- Hover state and animation testing

#### Integration Testing

- Landing page conversion flow testing
- Authentication integration testing
- CTA button functionality testing

## Dependencies & Integrations

### Direct Dependencies

- **React**: Component framework
- **Lucide React**: Icon system
- **shadcn/ui**: Base UI components
- **Tailwind CSS**: Styling system

### Feature Dependencies

- **Sign-In Feature**: Authentication flow integration
- **Shared Components**: Typography and UI components
- **Theme System**: Design tokens and styling

### External Integrations

- **NextAuth.js**: Authentication state checking
- **Next.js App Router**: Routing and page structure

## Performance Considerations

### Optimization Strengths

1. **Static Rendering**: No server-side data requirements
2. **Component Reuse**: Single FeatureCard component for all features
3. **CSS Animations**: Hardware-accelerated transforms and transitions
4. **Minimal JavaScript**: Primarily presentational components

### Performance Metrics Goals

- Landing page load time: < 1.5 seconds
- Above-the-fold render: < 1 second
- Smooth 60fps animations
- Mobile performance parity with desktop

## SEO & Accessibility

### SEO Implementation

The landing page includes comprehensive SEO optimization:

**Title Strategy**: "PlayLater - Organize Your Gaming Backlog"
**Meta Description**: Value proposition and key features
**Structured Data**: Organization and product schema markup
**Keywords**: Gaming backlog, game organizer, Steam integration

### Accessibility Features

- Semantic HTML structure in FeatureCard
- Proper heading hierarchy
- Keyboard navigation support
- Color contrast compliance
- Screen reader compatibility

## Future Enhancement Opportunities

### High Priority

1. **A/B Testing Infrastructure**: Test different headlines and CTAs
2. **Analytics Integration**: Conversion tracking and user behavior analysis
3. **Social Proof Elements**: User testimonials and statistics
4. **Lead Magnets**: Free trial offers and feature previews

### Medium Priority

1. **Interactive Demos**: Live product previews and walkthroughs
2. **FAQ Section**: Address common user concerns
3. **Newsletter Signup**: Product update notifications
4. **Performance Metrics**: Real user monitoring and optimization

### Low Priority

1. **Internationalization**: Multi-language support
2. **Advanced Personalization**: Content based on referral source
3. **Marketing Automation**: Integration with marketing tools
4. **Progressive Web App**: Enhanced mobile experience

## Development Commands

### Feature-Specific Testing

```bash
# Run component-specific tests (when implemented)
bun test features/landing

# Visual regression testing
bun test:visual landing

# Accessibility testing
bun test:a11y landing
```

### Development Workflow

```bash
# Start development server
bun dev

# Check code quality
bun code-check

# Format and lint
bun code-fix
```

---

**Note**: This landing feature follows the established architectural patterns of the PlayLater application while maintaining simplicity appropriate for a marketing page. The focus on conversion optimization and user experience makes it a critical component for user acquisition and business growth.
