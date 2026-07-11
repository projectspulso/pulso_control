import type { MetadataRoute } from 'next'

// App interno (login-gated). O hub público de vídeos foi pra fora: https://pulsohub.vercel.app
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: '/' }],
  }
}
