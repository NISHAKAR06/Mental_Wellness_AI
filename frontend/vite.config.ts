import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {

    // in production remove this two lines
    host: "0.0.0.0", // More reliable than "::"
    port: 5173, // Standard Vite port
    proxy: {
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        secure: false,
        // in production remove this line
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
    // Allow CORS for development
    cors: true,
    fs: {
      // Allow serving files from project root for GLB files
      allow: ['.']
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Optimize for 3D models and large assets
  build: {
    target: 'esnext',
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          '3d-libs': ['@react-three/fiber', '@react-three/drei', 'three'],
          'ui-libs': ['lucide-react', 'framer-motion'],
          'face-api': ['face-api.js'],
        },
      },
    },
  },
  // Optimize asset handling for GLB files
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  // Better chunk splitting for better caching
  optimizeDeps: {
    include: [
      '@react-three/fiber',
      '@react-three/drei',
      'three',
      'face-api.js'
    ],
    exclude: ['lucide-react'], // Keep lucide separate for better tree shaking
  },
}));
