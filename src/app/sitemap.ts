// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/data/site'

// Si tienes páginas reales además de la home, agrégalas aquí como { url: `${site}/rsvp`, ... }
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const site = SITE_URL.endsWith('/') ? SITE_URL.slice(0, -1) : SITE_URL
  return [
    {
      url: `${site}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
