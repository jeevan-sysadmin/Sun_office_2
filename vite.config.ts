import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const rawBasePath = env.VITE_APP_BASE_PATH || "/sunoffice/";
  const appBasePath = rawBasePath === "/"
    ? "/"
    : `/${rawBasePath.replace(/^\/+|\/+$/g, "")}/`;
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || "http://localhost:5000";

  return {
    plugins: [
      react({
        // Remove babel plugin for now - it's causing issues
        // babel: {
        //   plugins: [['babel-plugin-react-compiler']]
        // }
      })
    ],

    // Base path for the deployed app
    base: appBasePath,
    
    // Server configuration
    server: {
      port: 5173,
      host: true,
      open: true,
      cors: true,
      // Proxy for API requests
      proxy: {
        '/api': {

          target: proxyTarget,
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/api/, '/api')
        }
      }
    },

    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            three: ['three', '@react-three/fiber', '@react-three/drei'],
            utils: ['framer-motion', 'file-saver']
          }
        }
      }
    },

    // Resolve paths
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@css': path.resolve(__dirname, './src/css'),
        '@assets': path.resolve(__dirname, './src/assets')
      }
    },

    // CSS configuration
    css: {
      devSourcemap: true,
      modules: {
        localsConvention: 'camelCase'
      }
    }
  }
})
