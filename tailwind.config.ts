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
				casino: {
					red: 'hsl(var(--casino-red))',
					gold: 'hsl(var(--casino-gold))',
					'gold-light': 'hsl(var(--casino-gold-light))',
					pink: 'hsl(var(--casino-pink))',
					'pink-light': 'hsl(var(--casino-pink-light))',
					dark: 'hsl(var(--casino-dark))',
					darker: 'hsl(var(--casino-darker))'
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
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'glow': {
					'0%, 100%': {
						boxShadow: '0 0 20px hsl(var(--casino-gold) / 0.3)'
					},
					'50%': {
						boxShadow: '0 0 40px hsl(var(--casino-gold) / 0.6)'
					}
				},
				'float': {
					'0%, 100%': {
						transform: 'translateY(0px)'
					},
					'50%': {
						transform: 'translateY(-10px)'
					}
				},
				'casino-glow': {
					'0%': {
						opacity: '0.3',
						transform: 'scale(1)'
					},
					'50%': {
						opacity: '0.6',
						transform: 'scale(1.05)'
					},
					'100%': {
						opacity: '0.3',
						transform: 'scale(1)'
					}
				},
				'casino-float': {
					'0%': {
						transform: 'translateX(-100%) rotate(-15deg)'
					},
					'100%': {
						transform: 'translateX(100%) rotate(-15deg)'
					}
				},
				'card-flip': {
					'0%': {
						transform: 'rotateY(0deg) translateY(0px)'
					},
					'50%': {
						transform: 'rotateY(180deg) translateY(-20px)'
					},
					'100%': {
						transform: 'rotateY(360deg) translateY(0px)'
					}
				},
				'dice-roll': {
					'0%': {
						transform: 'rotate(0deg) scale(1)'
					},
					'25%': {
						transform: 'rotate(90deg) scale(1.1)'
					},
					'50%': {
						transform: 'rotate(180deg) scale(1)'
					},
					'75%': {
						transform: 'rotate(270deg) scale(1.1)'
					},
					'100%': {
						transform: 'rotate(360deg) scale(1)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'glow': 'glow 2s ease-in-out infinite',
				'float': 'float 3s ease-in-out infinite',
				'casino-glow': 'casino-glow 8s ease-in-out infinite alternate',
				'casino-float': 'casino-float 20s linear infinite',
				'card-flip': 'card-flip 4s ease-in-out infinite',
				'dice-roll': 'dice-roll 3s ease-in-out infinite'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-card': 'var(--gradient-card)',
				'gradient-gold': 'var(--gradient-gold)',
				'gradient-royal': 'var(--gradient-royal)'
			},
			boxShadow: {
				'glow': 'var(--shadow-glow)',
				'red-glow': 'var(--shadow-red-glow)',
				'pink-glow': 'var(--shadow-pink-glow)',
				'elegant': 'var(--shadow-elegant)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
