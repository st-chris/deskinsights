import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Split large libraries into separate chunks
            if (id.includes('@tiptap')) return 'tiptap';
            if (id.includes('@reduxjs') || id.includes('react-redux'))
              return 'redux';
            if (id.includes('@tanstack')) return 'tanstack';
            if (id.includes('react-router')) return 'router';

            // Split React core libraries
            if (id.includes('react-dom')) return 'react-dom';
            if (id.includes('react') && !id.includes('react-dom'))
              return 'react';

            // Split other heavy libraries
            if (id.includes('lucide-react')) return 'lucide';
            if (id.includes('dompurify')) return 'dompurify';
            if (id.includes('axios')) return 'axios';

            // All other vendor packages
            return 'vendor';
          }
        },
      },
    },
  },
});
