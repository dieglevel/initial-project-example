import { colors } from './design-token'
import type { ConfigProviderProps } from 'antd'

const hoverColor = (colorValue: string) => {
  return `color-mix(in srgb, ${colorValue} 90%, transparent)`
}

const activeColor = (colorValue: string) => {
  return `color-mix(in srgb, ${colorValue} 75%, black)`
}

export const ConfigAntd: ConfigProviderProps = {
  theme: {
    token: {
      colorPrimary: colors.primary.base,
      fontFamily: `'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif`,
    },
    components: {
      Button: {
        fontSize: 14,
        fontWeight: 600,
        fontSizeIcon: 14,
        colorIcon: colors.primary.light,
        colorIconHover: hoverColor(colors.primary.light),
        primaryShadow: 'none',
        dangerShadow: 'none',
        defaultShadow: 'none',
      },
      Pagination: {
        itemActiveBg: colors.primary.base,
        itemActiveColor: colors.primary.light,
        itemBg: 'transparent',
      },
    },
  },
}
