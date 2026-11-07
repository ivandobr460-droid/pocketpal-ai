/**
 * PocketPal AI - Theme Colors
 * Modified for Nubia Red Magic 10 Pro (AMOLED, Snapdragon 8 Elite)
 * System Palette: Warm Mocha & Terracotta
 */

export const colors = {
  // Backgrounds / Dark theme base
  background: '#181513',
  backgroundSecondary: '#1F1B19',
  backgroundTertiary: '#241F1B',

  // Surfaces, Cards, Incoming message bubbles
  surface: '#26211E',
  surfaceVariant: '#2F2925',
  card: '#26211E',
  cardElevated: '#2F2925',
  incomingBubble: '#26211E',
  incomingBubbleText: '#F2ECE9',

  // Primary, Accents, Outgoing message bubbles, Active microphone
  primary: '#BA5D27',
  primaryContainer: '#2F2925',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#F2ECE9',
  accent: '#BA5D27',
  outgoingBubble: '#BA5D27',
  outgoingBubbleText: '#FFFFFF',
  activeMic: '#BA5D27',
  activeMicGlow: 'rgba(186, 93, 39, 0.45)',

  // Typography
  text: '#F2ECE9',
  textSecondary: '#A89F98',
  textTertiary: '#7A726C',
  placeholder: '#6B635E',
  onBackground: '#F2ECE9',
  onSurface: '#F2ECE9',
  onSurfaceVariant: '#A89F98',

  // Borders & Dividers
  border: '#3E3530',
  borderSubtle: '#2A2420',
  divider: '#3E3530',
  outline: '#3E3530',
  outlineVariant: '#2A2420',

  // Functional status colors
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#410002',
  onErrorContainer: '#FFDAD6',
  success: '#4E9A68',
  warning: '#E29738',
  info: '#4B88BF',
};

export const darkTheme = {
  dark: true,
  colors: {
    ...colors,
  },
};

export default colors;