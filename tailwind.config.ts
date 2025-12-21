
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				// Neuomorphic colors com melhor contraste
				'neuro-bg': 'rgb(var(--neuro-bg) / <alpha-value>)',
				'neuro-surface': 'rgb(var(--neuro-surface) / <alpha-value>)',
				'neuro-element': 'rgb(var(--neuro-element) / <alpha-value>)',
				'neuro-calendar-header': 'rgb(var(--neuro-calendar-header) / <alpha-value>)',
				'neuro-text-primary': 'rgb(var(--neuro-text-primary) / <alpha-value>)',
				'neuro-text-secondary': 'rgb(var(--neuro-text-secondary) / <alpha-value>)',
				'neuro-text-muted': 'rgb(var(--neuro-text-muted) / <alpha-value>)',
				'neuro-accent': 'rgb(var(--neuro-accent) / <alpha-value>)',
				'neuro-accent-light': 'rgb(var(--neuro-accent-light) / <alpha-value>)',
				'neuro-success': 'rgb(var(--neuro-success) / <alpha-value>)',
				'neuro-warning': 'rgb(var(--neuro-warning) / <alpha-value>)',
				'neuro-error': 'rgb(var(--neuro-error) / <alpha-value>)',
				'neuro-calendar-weekend': 'rgb(var(--neuro-calendar-weekend) / <alpha-value>)',
				'neuro-calendar-weekday': 'rgb(var(--neuro-calendar-weekday) / <alpha-value>)',
				'neuro-calendar-event': 'rgb(var(--neuro-calendar-event) / <alpha-value>)',
				'neuro-calendar-routine': 'rgb(var(--neuro-calendar-routine) / <alpha-value>)',
				
				// Legacy colors for compatibility
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
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
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			},
			boxShadow: {
				'neuro-inset': 'inset 8px 8px 16px rgba(174, 174, 192, 0.4), inset -8px -8px 16px rgba(255, 255, 255, 0.7)',
				'neuro-outset': '8px 8px 16px rgba(174, 174, 192, 0.4), -8px -8px 16px rgba(255, 255, 255, 0.7)',
				'neuro-outset-sm': '4px 4px 8px rgba(174, 174, 192, 0.4), -4px -4px 8px rgba(255, 255, 255, 0.7)',
				'neuro-outset-lg': '12px 12px 24px rgba(174, 174, 192, 0.4), -12px -12px 24px rgba(255, 255, 255, 0.7)',
				'neuro-pressed': 'inset 4px 4px 8px rgba(174, 174, 192, 0.4), inset -4px -4px 8px rgba(255, 255, 255, 0.7)'
			},
			fontWeight: {
				'medium': '500',
				'semibold': '600',
				'bold': '700'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
