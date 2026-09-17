import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    watch: process.env.CODEX_SANDBOX === "seatbelt"
      ? { useFsEvents: false, usePolling: true }
      : undefined,
  },
});
