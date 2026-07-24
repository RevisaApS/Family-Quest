import type { MetadataRoute } from 'next'

// Colours here are the candlelit theme from globals.css. They used to be a
// blue/gold pair left over from before the retheme, which meant the splash
// screen flashed a colour the app never actually uses.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Family Quest',
    short_name: 'Family Quest',
    description: 'AI-powered D&D adventures for families',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#211812',
    theme_color: '#211812',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Same artwork again as maskable: the die sits inside the central 66% of
      // the canvas, so Android can crop it to any mask shape without clipping.
      // Listed separately because Next's manifest type takes one purpose per
      // entry, not the space-separated form the web spec allows.
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
