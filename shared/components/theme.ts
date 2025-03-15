// shared/theme.ts
import {
  createSystem,
  defineConfig,
  defaultConfig,
  mergeConfigs,
  defineRecipe,
} from '@chakra-ui/react';

// Define our custom theme configuration
const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        // Base colors
        purple: { value: '#6B46C1' },
        teal: { value: '#319795' },
        slate: {
          50: { value: '#F7FAFC' },
          100: { value: '#EDF2F7' },
          700: { value: '#2D3748' },
          800: { value: '#1A202C' },
          900: { value: '#171923' },
        },
        // Game status colors
        statusColors: {
          playing: { value: '#38A169' }, // Green
          completed: { value: '#3182CE' }, // Blue
          toPlay: { value: '#DD6B20' }, // Orange
          played: { value: '#805AD5' }, // Purple
        },
      },
      fonts: {
        body: { value: 'var(--font-geist-sans), system-ui, sans-serif' },
        mono: { value: 'var(--font-geist-mono), monospace' },
      },
      radii: {
        sm: { value: '0.25rem' },
        md: { value: '0.375rem' },
        lg: { value: '0.5rem' },
      },
      shadows: {
        gameCard: {
          value:
            '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        gameCardHover: {
          value:
            '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    semanticTokens: {
      colors: {
        // App-specific semantic tokens
        primary: {
          value: { base: '{colors.purple}', _dark: '{colors.purple}' },
        },
        secondary: {
          value: { base: '{colors.teal}', _dark: '{colors.teal}' },
        },
        // Background colors
        bg: {
          DEFAULT: {
            value: { base: '{colors.slate.50}', _dark: '{colors.slate.800}' },
          },
          muted: {
            value: { base: '{colors.slate.100}', _dark: '{colors.slate.700}' },
          },
        },
        // Text colors
        text: {
          DEFAULT: {
            value: { base: '{colors.slate.900}', _dark: '{colors.slate.50}' },
          },
          muted: {
            value: { base: '{colors.slate.700}', _dark: '{colors.slate.100}' },
          },
        },
        // Game status colors
        playing: {
          value: {
            base: '{colors.statusColors.playing}',
            _dark: '{colors.statusColors.playing}',
          },
        },
        completed: {
          value: {
            base: '{colors.statusColors.completed}',
            _dark: '{colors.statusColors.completed}',
          },
        },
        backlog: {
          value: {
            base: '{colors.statusColors.toPlay}',
            _dark: '{colors.statusColors.toPlay}',
          },
        },
        played: {
          value: {
            base: '{colors.statusColors.played}',
            _dark: '{colors.statusColors.played}',
          },
        },
        wishlist: {
          value: { base: '{colors.purple}', _dark: '{colors.purple}' },
        },
      },
    },
    // Component recipes
    recipes: {
      // Game card recipe
      Card: {
        variants: {
          gameCard: {
            root: {
              width: '140px',
              height: 'fit-content',
              minH: '184px',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 'md',
              boxShadow: '{shadows.gameCard}',
              transition: 'all 0.2s ease-in-out',
              _hover: {
                transform: 'translateY(-4px)',
                boxShadow: '{shadows.gameCardHover}',
              },
            },
          },
        },
      },
    },
  },
});

// Define the status button recipe
const statusButtonRecipe = defineRecipe({
  className: 'status-button',
  base: {
    borderRadius: 'full',
    p: '1',
    minW: 'auto',
    h: 'auto',
    transition: 'all 0.2s',
  },
  variants: {
    status: {
      playing: {
        bg: 'playing',
        color: 'white',
        _hover: {
          transform: 'scale(1.1)',
          opacity: 0.9,
        },
      },
      completed: {
        bg: 'completed',
        color: 'white',
        _hover: {
          transform: 'scale(1.1)',
          opacity: 0.9,
        },
      },
      backlog: {
        bg: 'backlog',
        color: 'white',
        _hover: {
          transform: 'scale(1.1)',
          opacity: 0.9,
        },
      },
      played: {
        bg: 'played',
        color: 'white',
        _hover: {
          transform: 'scale(1.1)',
          opacity: 0.9,
        },
      },
    },
  },
  defaultVariants: {
    status: 'playing',
  },
});

// Merge our custom config with the default config
const config = mergeConfigs(defaultConfig, customConfig);

// Add the button recipe to the merged config
const configWithButtonRecipe = mergeConfigs(config, {
  theme: {
    recipes: {
      StatusButton: statusButtonRecipe,
    },
  },
});

// Create the system with the merged config
export const system = createSystem(configWithButtonRecipe);
