// src/components/seo/SeoFaq.tsx
type FaqItem = { question: string; answer: string }

export default function SeoFaq({ items }: { items: FaqItem[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: { '@type': 'Answer', text: it.answer },
    })),
  }

  return (
    <script
      type="application/ld+json"
      // 👇 el contenido del FAQ DEBE ser exactamente el que muestras en la UI
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
