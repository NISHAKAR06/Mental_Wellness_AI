import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  // Get environment variables with fallbacks
  const wsBaseUrl = env.VITE_WS_BASE_URL || (mode === 'production' ? 'wss://ai-psychologist-service.onrender.com' : 'ws://localhost:8001');
  const apiBaseUrl = env.VITE_API_BASE_URL || (mode === 'production' ? 'https://mental-wellness-ai-backend.onrender.com' : 'http://localhost:8000');
  const fastApiUrl = env.VITE_FASTAPI_URL || (mode === 'production' ? 'https://ai-psychologist-service.onrender.com' : 'http://localhost:8001');

  return {
    server: {
      host: "0.0.0.0", // More reliable than "::"
      port: 5173, // Standard Vite port
      proxy: {
        '/ws': {
          target: wsBaseUrl,
          ws: true,
          secure: mode === 'production',
          changeOrigin: true,
        },
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: mode === 'production',
        },
        '/fastapi': {
          target: fastApiUrl,
          changeOrigin: true,
          secure: mode === 'production',
          rewrite: (path) => path.replace(/^\/fastapi/, ''),
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
  };
});
