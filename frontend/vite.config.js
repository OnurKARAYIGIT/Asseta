import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
// import cssnano from "cssnano";
// import autoprefixer from "autoprefixer";

export default defineConfig({
  plugins: [
    react(),
    // Bundle analizörü (isteğe bağlı)
    visualizer({
      filename: "bundle-report.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],

  server: {
    proxy: {
      "/api": "http://localhost:5001",
    },
  },

  build: {
    sourcemap: true, // hata ayıklamaya yardımcı olur
    minify: true, // JS'i minify etme!
    uglify: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          vendor: ["axios", "lodash"],
        },
      },
    },
  },
});
