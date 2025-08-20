import { type Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import { fontFamily } from "tailwindcss/defaultTheme";

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
      // Spacing Scale - Gaming-focused spacing system
      spacing: {
        // Micro spacing for tight layouts
        "0.5": "0.125rem", // 2px
        "1.5": "0.375rem", // 6px
        "2.5": "0.625rem", // 10px
        "3.5": "0.875rem", // 14px

        // Component spacing
        "4.5": "1.125rem", // 18px
        "5.5": "1.375rem", // 22px
        "6.5": "1.625rem", // 26px
        "7.5": "1.875rem", // 30px

        // Layout spacing
        "8.5": "2.125rem", // 34px
        "9.5": "2.375rem", // 38px
        "11": "2.75rem", // 44px
        "13": "3.25rem", // 52px
        "15": "3.75rem", // 60px
        "17": "4.25rem", // 68px
        "19": "4.75rem", // 76px
        "21": "5.25rem", // 84px
        "23": "5.75rem", // 92px

        // Large layout spacing
        "26": "6.5rem", // 104px
        "28": "7rem", // 112px
        "30": "7.5rem", // 120px
        "32": "8rem", // 128px
        "36": "9rem", // 144px
        "40": "10rem", // 160px
        "44": "11rem", // 176px
        "48": "12rem", // 192px
        "52": "13rem", // 208px
        "56": "14rem", // 224px
        "60": "15rem", // 240px
        "64": "16rem", // 256px
        "72": "18rem", // 288px
        "80": "20rem", // 320px
        "96": "24rem", // 384px
      },

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
        "gaming-gradient-vertical":
          "linear-gradient(180deg, hsl(var(--gaming-gradient-start)), hsl(var(--gaming-gradient-end)))",
        "gaming-gradient-radial":
          "radial-gradient(ellipse at center, hsl(var(--gaming-gradient-start)), hsl(var(--gaming-gradient-end)))",
        "radial-gaming":
          "radial-gradient(circle at center, hsl(var(--gaming-primary) / 0.1), transparent)",
        "platform-nintendo": "linear-gradient(135deg, #e60012, #ff4757)",
        "platform-playstation": "linear-gradient(135deg, #0070d1, #4834d4)",
        "platform-xbox": "linear-gradient(135deg, #107c10, #26c726)",
        "platform-pc": "linear-gradient(135deg, #1b2838, #4b79a1)",
      },
      boxShadow: {
        neon: "0 0 20px hsl(var(--accent) / 0.3), 0 0 40px hsl(var(--accent) / 0.1)",
        "neon-strong":
          "0 0 30px hsl(var(--accent) / 0.5), 0 0 60px hsl(var(--accent) / 0.2), 0 0 90px hsl(var(--accent) / 0.1)",
        "neon-gaming":
          "0 0 20px hsl(var(--gaming-primary) / 0.4), 0 0 40px hsl(var(--gaming-primary) / 0.2), 0 0 60px hsl(var(--gaming-primary) / 0.1)",
        gaming: "0 4px 20px hsl(var(--gaming-primary) / 0.3)",
        "gaming-hover": "0 0 20px hsl(var(--gaming-primary) / 0.5)",
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
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        shimmer: "shimmer 2s infinite ease-in-out",
      },
    },
  },
  plugins: [animate],
} satisfies Config;

export default config;
