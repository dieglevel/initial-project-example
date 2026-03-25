/* =====================================================
 * COLOR SYSTEM — LIGHT MODE
 * ===================================================== */

export const colors = {
  /* ================= PRIMARY ================= */
  primary: {
    50: '#fdf2f2',
    100: '#fde6e6',
    200: '#f9caca',
    300: '#f29e9f',
    400: '#e66b6e',
    500: '#73080e', // base
    600: '#8e0a11',
    700: '#a3151c',
    800: '#5c060b',
    900: '#3f0407',

    base: '#73080e',
    hover: '#8e0a11',
    active: '#a3151c',
    light: '#ffffff',
    dark: '#5c060b',
    rgb: '115, 8, 14',
  },

  /* ================= SECONDARY ================= */
  secondary: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e8e8e8',
    300: '#d9d9d9',
    400: '#bfbfbf',
    500: '#8c8c8c',
    600: '#595959',
    700: '#434343',
    800: '#262626',
    900: '#1f1f1f',

    base: '#8c8c8c',
    hover: '#595959',
    active: '#434343',
    light: '#f5f5f5',
    dark: '#262626',
    rgb: '140, 140, 140',
  },

  /* ================= SUCCESS ================= */
  success: {
    50: '#f6ffed',
    100: '#d9f7be',
    200: '#b7eb8f',
    300: '#95de64',
    400: '#73d13d',
    500: '#52c41a',
    600: '#389e0d',
    700: '#237804',
    800: '#135200',
    900: '#092b00',

    base: '#52c41a',
    hover: '#389e0d',
    active: '#237804',
    light: '#d9f7be',
    dark: '#135200',
    rgb: '82, 196, 26',
  },

  /* ================= ERROR ================= */
  error: {
    50: '#fff2f0',
    100: '#ffccc7',
    200: '#ffa39e',
    300: '#ff7875',
    400: '#ff4d4f',
    500: '#f5222d',
    600: '#cf1322',
    700: '#a8071a',
    800: '#820014',
    900: '#5c0011',

    base: '#f5222d',
    hover: '#cf1322',
    active: '#a8071a',
    light: '#ffccc7',
    dark: '#820014',
    rgb: '245, 34, 45',
  },
}

/* ================= TEXT ================= */

export const textColors = {
  primary: colors.secondary[900],
  secondary: colors.secondary[600],
  disabled: colors.secondary[400],
  inverse: '#ffffff',
}

/* ================= BACKGROUND ================= */

export const background = {
  base: '#ffffff',
  layout: colors.secondary[100],
  elevated: '#ffffff',
  spotlight: `rgba(${colors.primary.rgb}, 0.08)`,
}

/* ================= BORDER ================= */

export const border = {
  base: colors.secondary[300],
  light: colors.secondary[200],
  focus: colors.primary.base,
}

/* ================= SHADOW ================= */

export const shadow = {
  primary: `0 4px 12px rgba(${colors.primary.rgb}, 0.2)`,
}

/* ================= RADIUS ================= */

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
}

/* ================= TRANSITION ================= */

export const transition = {
  fast: '0.2s ease',
  base: '0.3s ease',
}
