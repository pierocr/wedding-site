// app/sitemap.ts
import type { MetadataRoute } from 'next'

const site = 'https://www.pieroydebby.cl'

// Si tienes páginas reales además de la home, agrégalas aquí como { url: `${site}/rsvp`, ... }
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    {
      url: `${site}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
