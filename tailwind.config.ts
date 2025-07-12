import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import animate from "tailwindcss-animate";

const config = {
  content: [
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./shared/components/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    fontFamily: {
      sans: ["var(--font-sans)", ...fontFamily.sans],
    },
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Typography Scale - Unified font sizes with responsive behavior
      fontSize: {
        // Display sizes for hero sections
        "display-2xl": [
          "4.5rem",
          { lineHeight: "1", letterSpacing: "-0.02em" },
        ], // 72px
        "display-xl": [
          "3.75rem",
          { lineHeight: "1.1", letterSpacing: "-0.02em" },
        ], // 60px
        "display-lg": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }], // 48px

        // Heading sizes
        "heading-xl": [
          "2.25rem",
          { lineHeight: "1.2", letterSpacing: "-0.01em" },
        ], // 36px
        "heading-lg": [
          "1.875rem",
          { lineHeight: "1.3", letterSpacing: "-0.01em" },
        ], // 30px
        "heading-md": [
          "1.5rem",
          { lineHeight: "1.3", letterSpacing: "-0.01em" },
        ], // 24px
        "heading-sm": [
          "1.25rem",
          { lineHeight: "1.4", letterSpacing: "-0.01em" },
        ], // 20px
        "heading-xs": [
          "1.125rem",
          { lineHeight: "1.4", letterSpacing: "-0.01em" },
        ], // 18px

        // Body text sizes
        "body-lg": ["1.125rem", { lineHeight: "1.6" }], // 18px
        "body-md": ["1rem", { lineHeight: "1.6" }], // 16px
        "body-sm": ["0.875rem", { lineHeight: "1.5" }], // 14px
        "body-xs": ["0.75rem", { lineHeight: "1.5" }], // 12px

        // Caption and small text
        caption: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.01em" }], // 12px
        overline: ["0.75rem", { lineHeight: "1.3", letterSpacing: "0.08em" }], // 12px
      },

      // Font weights
      fontWeight: {
        display: "800", // For display text
        heading: "700", // For headings
        subheading: "600", // For subheadings
        body: "400", // For body text
        caption: "500", // For captions
      },

      colors: {
        nintendo: "#e60012",
        playstation: "#0070d1",
        xbox: "#107c10",
        pc: "#1b2838",
        gaming: {
          primary: "hsl(var(--gaming-primary))",
          secondary: "hsl(var(--gaming-secondary))",
          accent: "hsl(var(--gaming-accent))",
          "neon-green": "hsl(var(--gaming-neon-green))",
          "neon-blue": "hsl(var(--gaming-neon-blue))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        pill: "9999px",
      },
      backgroundImage: {
        "gaming-gradient":
          "linear-gradient(135deg, hsl(var(--gaming-gradient-start)), hsl(var(--gaming-gradient-end)))",
        "gaming-gradient-hover":
          "linear-gradient(135deg, hsl(var(--gaming-gradient-start) / 0.8), hsl(var(--gaming-gradient-end) / 0.8))",
        "radial-gaming":
          "radial-gradient(circle at center, hsl(var(--gaming-primary) / 0.1), transparent)",
      },
      boxShadow: {
        neon: "0 0 20px hsl(var(--accent) / 0.3), 0 0 40px hsl(var(--accent) / 0.1)",
        "neon-strong":
          "0 0 30px hsl(var(--accent) / 0.5), 0 0 60px hsl(var(--accent) / 0.2)",
        gaming: "0 4px 20px hsl(var(--gaming-primary) / 0.3)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "pulse-neon": {
          "0%, 100%": {
            boxShadow:
              "0 0 20px hsl(var(--accent) / 0.3), 0 0 40px hsl(var(--accent) / 0.1)",
          },
          "50%": {
            boxShadow:
              "0 0 30px hsl(var(--accent) / 0.5), 0 0 60px hsl(var(--accent) / 0.2)",
          },
        },
        float: {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-4px)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [animate],
} satisfies Config;

export default config;
