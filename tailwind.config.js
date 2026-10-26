/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [i, `${i / 100}`])),
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			xl: '1rem',
  			'2xl': '1.5rem',
  			'3xl': '1.75rem'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			// The journal palette. Defined through the `-rgb` channel vars so
			// Tailwind can apply opacity modifiers (bg-journal-ink/60) — a
			// plain var() carries no alpha channel, which silently dropped
			// every rule that used one.
  			journal: {
  				paper: 'rgb(var(--j-paper-rgb) / <alpha-value>)',
  				'paper-deep': 'rgb(var(--j-paper-deep-rgb) / <alpha-value>)',
  				card: 'rgb(var(--j-card-rgb) / <alpha-value>)',
  				ink: 'rgb(var(--j-ink-rgb) / <alpha-value>)',
  				'ink-soft': 'rgb(var(--j-ink-soft-rgb) / <alpha-value>)',
  				rule: 'rgb(var(--j-rule-rgb) / <alpha-value>)',
  				stamp: 'rgb(var(--j-stamp-rgb) / <alpha-value>)',
  				materials: 'rgb(var(--j-materials-rgb) / <alpha-value>)',
  				labour: 'rgb(var(--j-labour-rgb) / <alpha-value>)',
  				freight: 'rgb(var(--j-freight-rgb) / <alpha-value>)',
  				brand: 'rgb(var(--j-brand-rgb) / <alpha-value>)',
  				retail: 'rgb(var(--j-retail-rgb) / <alpha-value>)'
  			},
  			jejak: {
  				navy: '#1B1B3A',
  				materials: '#2FBF71',
  				labour: '#FF7A1A',
  				freight: '#2D5BFF',
  				brand: '#8B5CF6',
  				retail: '#FF3D81',
  				coral: '#FF8A65',
  				amber: '#FFC24B',
  				magenta: '#FF3D81',
  				gold: '#FFC24B',
  				goldDeep: '#E8921A'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			'serif-display': ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
  			grotesk: ['"Schibsted Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			plexmono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
  			hand: ['Caveat', 'cursive'],
  			heading: ['"Schibsted Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			body: ['"Schibsted Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
  			mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace']
  		},
  		keyframes: {
  			'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
  			'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
  			'spin-slow': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
  			'pulse-soft': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.55' } }
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'spin-slow': 'spin-slow 8s linear infinite',
  			'pulse-soft': 'pulse-soft 1.6s ease-in-out infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
