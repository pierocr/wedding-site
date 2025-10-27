// app/robots.ts
import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/data/site'

export default function robots(): MetadataRoute.Robots {
  const site = SITE_URL.endsWith('/') ? SITE_URL.slice(0, -1) : SITE_URL
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  }
}
