// src/components/seo/SeoWebsite.tsx
export default function SeoWebsite({
  name,
  url,
}: {
  name: string
  url: string
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
