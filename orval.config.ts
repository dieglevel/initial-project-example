// orval.config.ts
import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: "http://localhost:3030/swagger/json", // Hoặc URL: 'http://localhost:3030/swagger/json'
    output: {
      target: "./src/api/index.ts",
      client: "react-query", // 🔥 Tự động tạo hooks react-query
      schemas: "./src/api/schemas",
      override: {
        mutator: {
          path: "./src/lib/axios.config.ts",
          name: "customAxios"
        }
      }
    }
  }
});
