// orval.config.ts
import { defineConfig } from "orval";

export default defineConfig({
	api: {
		input: "http://localhost:3030/swagger/json",
		output: {
			mode: "tags-split",
			target: "./src/api/index.ts",
			client: "react-query", // 🔥 Tự động tạo hooks react-query
			schemas: "./src/api/schemas",
			clean: true,
			override: {
				mutator: {
					path: "./src/lib/axios.config.ts",
					name: "customAxios",
				},
			},
		},
	},
});
