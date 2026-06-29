import type { MetadataRoute } from 'next'

import { getVideosRecentes, SITE_URL } from '@/lib/hub/data'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const vids = await getVideosRecentes(1000)
  return [
    { url: `${SITE_URL}/hub`, changeFrequency: 'daily', priority: 1 },
    ...vids.map((v) => ({
      url: `${SITE_URL}/v/${v.numero}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
