import { defineConfig } from "vite";

export default defineConfig({
    optimizeDeps: {
        exclude: ["google.visualization"],
    },
});
