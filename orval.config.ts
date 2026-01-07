// orval.config.ts
import { defineConfig } from "orval";

const API_URL =
  process.env.ORVAL_API_URL || "http://localhost:3000/swagger/json";

export default defineConfig({
  api: {
    input: API_URL,
    output: {
      workspace: "src/api",
      mode: "tags-split",
      target: "./index.ts",
      client: "react-query", // 🔥 Tự động tạo hooks react-query
      schemas: "./schemas",
      clean: true,
      override: {
        mutator: {
          path: "../shared/lib/axios.ts",
          name: "customAxios",
        },
      },
    },
  },
});
