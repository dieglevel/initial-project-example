// orval.config.ts
import { defineConfig } from "orval";

export default defineConfig({
	api: {
		input: "http://localhost:3030/swagger/json",
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
