import { type ConfigProviderProps } from "antd";

export const ConfigAntd: ConfigProviderProps = {
  theme: {
    token: {
      fontFamily: "'Pretendard', sans-serif",
      colorTextPlaceholder: "#475069",
      colorError: "#FF7D7D",
      borderRadius: 4,
      lineHeight: 1,

      colorPrimary: "#7c3aed", // primary
      colorSuccess: "#22c55e",
      colorWarning: "#f59e0b",
      colorInfo: "#0ea5e9",
    },
    components: {
      Button: {
        // primary
        colorPrimary: "#7c3aed",
        colorPrimaryHover: "#6d28d9",
        colorPrimaryActive: "#5b21b6",

        // default
        colorBgContainer: "#f5f3ff",
        colorBorder: "#ddd6fe",

        defaultColor: "#6366F1",
        defaultBg: "#6366F1",
        paddingBlockLG: 17,
        paddingInlineLG: 28,
        paddingInline: 10,
        borderRadius: 4,
        dangerColor: "#ef4444",
      },
    },
  },
};
