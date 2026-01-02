import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'N2RevConLogo.png'],
      injectManifest: false,
      strategies: 'generateSW',
      manifest: {
        name: 'N2 RevCon',
        short_name: 'N2 RevCon',
        description: 'N2 RevCon - Company Monitoring System',
        theme_color: '#FFFFFF',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'any',
        categories: ['business', 'productivity'],
        scope: '/',
        start_url: '/',
        prefer_related_applications: false,
        // Disable default splash screen generation
        screenshots: [],
        icons: [
          {
            src: '/N2RevConLogo.png',
            sizes: '192x192 512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/N2RevConLogo.png',
            sizes: '192x192 512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        globIgnores: ['**/node_modules/**/*'],
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    strictPort: false, // Allow Vite to use next available port if 5173 is taken
    open: true, // Automatically open browser
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  // Clear cache on build
  build: {
    emptyOutDir: true,
    // Ensure public assets are copied
    copyPublicDir: true
  },
  // Ensure public directory is served correctly
  publicDir: 'public'
});

