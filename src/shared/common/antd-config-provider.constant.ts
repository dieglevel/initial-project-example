import type { ConfigProviderProps } from "antd";

export const ConfigAntd: ConfigProviderProps = {
  theme: {
    token: {
      colorPrimary: "#6366F1",
    },
  },
  button: {
    styles: {
      root: {
        padding: "24px 32px",
        fontWeight: "bold",
      },
    },
  },
};
