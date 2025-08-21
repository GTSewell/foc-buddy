import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import copy from "rollup-plugin-copy";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    copy({
      hook: 'buildStart',
      targets: [
        { src: 'node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js', dest: 'public/ffmpeg' },
        { src: 'node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm', dest: 'public/ffmpeg' },
        { src: 'node_modules/coi-serviceworker/coi-serviceworker.min.js', dest: 'public' },
      ],
      verbose: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
