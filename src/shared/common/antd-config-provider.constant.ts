import type { ConfigProviderProps } from "antd";

export const ConfigAntd: ConfigProviderProps = {
  theme: {
    token: {
      colorPrimary: "#6366F1",
    },
    components: {
      Button: {
        paddingBlockLG: 17,
        paddingInlineLG: 28,
        paddingInline: 10,
        borderRadius: 4,
      },
    },
  },
};
