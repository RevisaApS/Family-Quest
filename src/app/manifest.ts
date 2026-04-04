import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Family Quest',
    short_name: 'Family Quest',
    description: 'AI-powered D&D adventures for families',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0e14',
    theme_color: '#f0a500',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
