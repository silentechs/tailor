// ============================================
// StitchCraft Ghana Design System
// Ghana-themed colors, patterns, and animations
// ============================================

// Ghana Flag Colors
export const GHANA_COLORS = {
  red: '#CE1126',
  gold: '#FCD116',
  green: '#006B3F',
  black: '#000000',

  // Extended palette
  redLight: '#E53E3E',
  redDark: '#9B1B1B',
  goldLight: '#FFE066',
  goldDark: '#D4A012',
  greenLight: '#38A169',
  greenDark: '#004D2C',

  // Neutral tones
  cream: '#FDF5E6',
  beige: '#F5F5DC',
  brown: '#8B4513',
  darkBrown: '#4A2C2A',
} as const;

// CSS Variables for theming
export const CSS_VARIABLES = {
  light: {
    '--ghana-red': GHANA_COLORS.red,
    '--ghana-gold': GHANA_COLORS.gold,
    '--ghana-green': GHANA_COLORS.green,
    '--ghana-black': GHANA_COLORS.black,
    '--background': '0 0% 100%',
    '--foreground': '0 0% 3.9%',
    '--card': '0 0% 100%',
    '--card-foreground': '0 0% 3.9%',
    '--primary': '142 76% 22%', // Ghana green
    '--primary-foreground': '0 0% 98%',
    '--secondary': '45 93% 54%', // Ghana gold
    '--secondary-foreground': '0 0% 9%',
    '--accent': '356 90% 44%', // Ghana red
    '--accent-foreground': '0 0% 98%',
    '--muted': '0 0% 96.1%',
    '--muted-foreground': '0 0% 45.1%',
    '--border': '0 0% 89.8%',
    '--ring': '142 76% 22%',
  },
  dark: {
    '--ghana-red': GHANA_COLORS.red,
    '--ghana-gold': GHANA_COLORS.gold,
    '--ghana-green': GHANA_COLORS.green,
    '--ghana-black': GHANA_COLORS.black,
    '--background': '0 0% 7%',
    '--foreground': '0 0% 95%',
    '--card': '0 0% 10%',
    '--card-foreground': '0 0% 95%',
    '--primary': '142 76% 36%', // Ghana green (lighter for dark mode)
    '--primary-foreground': '0 0% 98%',
    '--secondary': '45 93% 58%', // Ghana gold
    '--secondary-foreground': '0 0% 9%',
    '--accent': '356 90% 55%', // Ghana red (lighter)
    '--accent-foreground': '0 0% 98%',
    '--muted': '0 0% 15%',
    '--muted-foreground': '0 0% 65%',
    '--border': '0 0% 20%',
    '--ring': '45 93% 54%',
  },
} as const;

// Kente-inspired gradient patterns
export const KENTE_PATTERNS = {
  // Traditional Kente stripes
  kenteStripes: `
    repeating-linear-gradient(
      90deg,
      ${GHANA_COLORS.gold} 0px,
      ${GHANA_COLORS.gold} 10px,
      ${GHANA_COLORS.green} 10px,
      ${GHANA_COLORS.green} 20px,
      ${GHANA_COLORS.red} 20px,
      ${GHANA_COLORS.red} 30px,
      ${GHANA_COLORS.black} 30px,
      ${GHANA_COLORS.black} 40px
    )
  `,

  // Ghana flag gradient
  ghanaFlag: `linear-gradient(180deg, ${GHANA_COLORS.red} 0%, ${GHANA_COLORS.red} 33%, ${GHANA_COLORS.gold} 33%, ${GHANA_COLORS.gold} 66%, ${GHANA_COLORS.green} 66%, ${GHANA_COLORS.green} 100%)`,

  // Gold shimmer gradient
  goldShimmer: `linear-gradient(135deg, ${GHANA_COLORS.goldLight} 0%, ${GHANA_COLORS.gold} 50%, ${GHANA_COLORS.goldDark} 100%)`,

  // Green to gold gradient
  greenGold: `linear-gradient(135deg, ${GHANA_COLORS.green} 0%, ${GHANA_COLORS.gold} 100%)`,

  // Royal gradient (dark to gold)
  royal: `linear-gradient(135deg, ${GHANA_COLORS.black} 0%, ${GHANA_COLORS.darkBrown} 50%, ${GHANA_COLORS.gold} 100%)`,

  // Subtle hero background
  heroBackground: `
    radial-gradient(circle at 20% 80%, ${GHANA_COLORS.green}15 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, ${GHANA_COLORS.gold}20 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, ${GHANA_COLORS.red}08 0%, transparent 50%)
  `,

  // Card highlight
  cardHighlight: `linear-gradient(135deg, ${GHANA_COLORS.gold}10 0%, transparent 50%)`,
} as const;

// Adinkra symbols (for decorative use)
export const ADINKRA_SYMBOLS = {
  gyeNyame: '☥', // God's Supremacy (placeholder - use actual SVG in production)
  sankofa: '↺', // Return and get it
  dwennimmen: '❖', // Ram's horns - humility
  adinkrahene: '⊕', // Chief of Adinkra symbols
} as const;

// Animation configurations for Framer Motion
export const ANIMATIONS = {
  // Page transitions
  pageEnter: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  // Stagger children animation
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },

  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },

  // Card hover effect
  cardHover: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },

  // FAB spring animation
  fabSpring: {
    type: 'spring',
    stiffness: 400,
    damping: 25,
  },

  // Counter animation (for stats)
  counter: {
    duration: 1.5,
    ease: 'easeOut',
  },

  // Shimmer effect
  shimmer: {
    initial: { x: '-100%' },
    animate: { x: '100%' },
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'linear',
    },
  },

  // Pulse effect
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },

  // Slide in from left
  slideInLeft: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },

  // Slide in from right
  slideInRight: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },

  // Fade in up
  fadeInUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: 'easeOut' },
  },
} as const;

// Responsive breakpoints
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Touch-friendly sizes (44px minimum tap target)
export const TOUCH_TARGETS = {
  minimum: 44,
  comfortable: 48,
  spacious: 56,
} as const;

// Z-index scale
export const Z_INDEX = {
  dropdown: 50,
  sticky: 100,
  modal: 200,
  overlay: 300,
  toast: 400,
  fab: 500,
} as const;

// Shadow presets
export const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  gold: `0 4px 14px 0 ${GHANA_COLORS.gold}40`,
  green: `0 4px 14px 0 ${GHANA_COLORS.green}40`,
} as const;

// Typography scale
export const TYPOGRAPHY = {
  fontFamily: {
    heading: '"Playfair Display", Georgia, serif',
    body: '"DM Sans", system-ui, sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
} as const;
