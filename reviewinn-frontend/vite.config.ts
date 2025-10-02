// @ts-nocheck
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  // Load environment variables from root directory
  envDir: '../',
  
  plugins: [
    react({
      // Enable React optimizations
      babel: {
        plugins: [
          // Remove console.log in production
          ...(process.env.NODE_ENV === 'production' ? ['babel-plugin-transform-remove-console'] : []),
        ],
      },
    }),
    // Bundle analyzer (generates stats.html)
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve('src'),
      'types': resolve('src/types'),
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor libraries with more granular splitting
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
            if (id.includes('react-router')) return 'router-vendor';
            if (id.includes('lucide-react')) return 'icons-vendor';
            if (id.includes('recharts')) return 'charts-vendor';
            if (id.includes('zustand')) return 'state-vendor';
            if (id.includes('canvas-confetti')) return 'animation-vendor';
            return 'vendor';
          }
          
          // Design system components
          if (id.includes('/shared/design-system/')) return 'design-system';
          
          // Store management
          if (id.includes('/stores/')) return 'stores';
          
          // Route-based splitting
          if (id.includes('/features/common/')) return 'common-pages';
          if (id.includes('/features/entities/')) return 'entity-pages';
          if (id.includes('/features/reviews/')) return 'review-pages';
          if (id.includes('/features/auth/')) return 'auth-pages';
          if (id.includes('/features/circle/')) return 'circle-pages';
          if (id.includes('/features/messaging/')) return 'messaging-pages';
          if (id.includes('/features/profile/')) return 'profile-pages';
          if (id.includes('/features/search/')) return 'search-pages';
          if (id.includes('/features/legal/')) return 'legal-pages';
          
          // API services
          if (id.includes('/api/')) return 'api-services';
          
          // Shared utilities
          if (id.includes('/shared/') && !id.includes('design-system')) return 'shared-utils';
        },
        // Optimize chunk names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return `js/[name]-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return 'images/[name]-[hash].[ext]';
          }
          if (/css/i.test(extType)) {
            return 'css/[name]-[hash].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
        pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log', 'console.info'] : [],
      },
      mangle: {
        safari10: true,
      },
    },
    sourcemap: process.env.NODE_ENV !== 'production',
    reportCompressedSize: false, // Faster builds
    cssCodeSplit: true,
  },
  
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'clsx',
    ],
    exclude: [
      // Large optional dependencies
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      // Disable HMR in production builds
      port: process.env.NODE_ENV === 'production' ? false : 5173,
    },
    proxy: {
      '/api': {
        target: process.env.VITE_DOCKER === 'true' ? 'http://reviewinn_backend:8000' : 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/docs': {
        target: process.env.VITE_DOCKER === 'true' ? 'http://reviewinn_backend:8000' : 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/redoc': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
