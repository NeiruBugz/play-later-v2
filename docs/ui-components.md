# UI Components

This document provides details about the UI components used in the PlayLater application and guidelines for creating new components.

## Overview

PlayLater uses Chakra UI as its primary UI component library, combined with custom components for specific features. The UI components are organized into two main categories:

1. **Shared Components**: Reusable components used across multiple features
2. **Feature-Specific Components**: Components specific to a particular feature

## Component Structure

### Shared Components

Shared components are located in the `shared/components/` directory and are organized into the following categories:

- `ui/`: Basic UI components like buttons, inputs, and layouts
- `game/`: Game-related components like game cards and game details

### Feature-Specific Components

Feature-specific components are located in their respective feature directories, such as:

- `features/collection/components/`
- `features/wishlist/components/`
- `features/add-game/components/`

## Chakra UI Integration

PlayLater uses Chakra UI v3, which is integrated with the application through the Provider component in `shared/components/ui/app-providers.tsx`.

Key Chakra UI features used in the application:

- **Responsive Design**: Components adapt to different screen sizes
- **Theming**: Custom theme with light and dark mode support
- **Component Composition**: Building complex UIs from simple components
- **Accessibility**: Built-in accessibility features

## Key Components

### UI Components

#### Layout Components

- **AppShell**: Main application layout with navigation
- **Container**: Centered content container
- **Box**: Basic layout component
- **Flex**: Flexbox container
- **Grid**: CSS Grid container

#### Navigation Components

- **Navbar**: Top navigation bar
- **Sidebar**: Side navigation menu
- **Tabs**: Tabbed navigation

#### Form Components

- **Input**: Text input field
- **Select**: Dropdown select field
- **Checkbox**: Checkbox input
- **Radio**: Radio button input
- **Button**: Action button

#### Feedback Components

- **Alert**: Alert message
- **Toast**: Temporary notification
- **Spinner**: Loading indicator
- **Progress**: Progress indicator

### Game Components

- **GameCard**: Card displaying game information
- **GameDetails**: Detailed game information
- **GameCover**: Game cover image
- **GameScreenshots**: Game screenshots gallery
- **GameRating**: Game rating display

## Component Usage

### Basic Component Usage

```tsx
import { Box, Text, Button } from '@chakra-ui/react';

function MyComponent() {
  return (
    <Box p={4} bg="gray.100" borderRadius="md">
      <Text fontSize="lg" fontWeight="bold">
        Hello World
      </Text>
      <Button colorPalette="blue" mt={4}>
        Click Me
      </Button>
    </Box>
  );
}
```

### Using Shared Components

```tsx
import { GameCard } from 'shared/components/game/GameCard';

function GameList({ games }) {
  return (
    <div>
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
```

## Responsive Design

PlayLater components are designed to be responsive using Chakra UI's responsive styles:

```tsx
<Box width={{ base: '100%', md: '50%', lg: '33%' }} p={{ base: 2, md: 4 }}>
  Content
</Box>
```

## Theming

The application uses a custom theme defined in `shared/config/theme.ts`. The theme includes:

- **Colors**: Brand colors, semantic colors, and color scales
- **Typography**: Font families, sizes, and weights
- **Spacing**: Consistent spacing scale
- **Breakpoints**: Screen size breakpoints
- **Component Styles**: Default styles for components

## Dark Mode

PlayLater supports dark mode using Chakra UI's color mode feature. The color mode is managed by the `next-themes` library and integrated with Chakra UI.

Components automatically adapt to the current color mode:

```tsx
<Box bg="bg.primary" color="text.primary">
  This component adapts to light and dark mode
</Box>
```

## Storybook Integration

PlayLater uses Storybook for component development and documentation. Storybook is configured in the `.storybook/` directory.

To run Storybook:

```bash
npm run storybook
```

## Creating New Components

### Guidelines for Creating Components

1. **Single Responsibility**: Each component should have a single responsibility
2. **Reusability**: Design components to be reusable when appropriate
3. **Composition**: Compose complex components from simpler ones
4. **Props Interface**: Define a clear props interface with TypeScript
5. **Default Props**: Provide sensible default props
6. **Documentation**: Document component usage and props

### Component Template

```tsx
import { Box, BoxProps } from '@chakra-ui/react';
import { ReactNode } from 'react';

interface MyComponentProps extends BoxProps {
  /** Description of title prop */
  title: string;
  /** Description of children prop */
  children: ReactNode;
}

/**
 * MyComponent description
 */
export function MyComponent({ title, children, ...rest }: MyComponentProps) {
  return (
    <Box {...rest}>
      <Box fontWeight="bold">{title}</Box>
      <Box mt={2}>{children}</Box>
    </Box>
  );
}
```

### Creating a Storybook Story

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  component: MyComponent,
  title: 'Components/MyComponent',
};

export default meta;
type Story = StoryObj<typeof MyComponent>;

export const Default: Story = {
  args: {
    title: 'Example Title',
    children: 'Example content',
  },
};
```

## Best Practices

### Performance

- Use memoization for expensive computations
- Avoid unnecessary re-renders with `React.memo`
- Use virtualization for long lists
- Optimize images and assets

### Accessibility

- Use semantic HTML elements
- Provide alternative text for images
- Ensure keyboard navigation works
- Maintain sufficient color contrast
- Test with screen readers

### Code Organization

- Group related components in directories
- Use index files to export components
- Separate logic from presentation
- Use consistent naming conventions

## Testing Components

Components should be tested using:

1. **Unit Tests**: Test component rendering and behavior
2. **Visual Tests**: Test component appearance with Storybook
3. **Accessibility Tests**: Test component accessibility

Example test:

```tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders the title', () => {
    render(<MyComponent title="Test Title">Content</MyComponent>);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
});
```
