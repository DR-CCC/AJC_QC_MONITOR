import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'pwa-icon.svg'],
    manifest: {
      name: 'AJS QC Monitor System',
      short_name: 'AJS QC',
      description: 'AJS Solution Factory QC Monitor',
      theme_color: '#1a1f2e',
      background_color: '#0f1117',
      display: 'standalone',
      orientation: 'landscape',
      start_url: '/',
      icons: [
        {
          src: 'pwa-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'pwa-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    },
  }), cloudflare()],
})