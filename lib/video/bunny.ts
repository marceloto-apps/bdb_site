// lib/video/bunny.ts

interface BunnyVideoId {
  libraryId: string
  videoId: string
}

/**
 * Extrai o Library ID e o Video ID de qualquer link do Bunny.net (Media Delivery).
 * Suporta formatos:
 * - https://player.mediadelivery.net/play/682380/d125c4bb-0467-4ecb-ad78-656ca3e0a1ed
 * - https://iframe.mediadelivery.net/embed/682380/d125c4bb-0467-4ecb-ad78-656ca3e0a1ed
 */
export function extrairBunnyId(url: string): BunnyVideoId | null {
  const regex =
    /(?:player\.mediadelivery\.net\/play|iframe\.mediadelivery\.net\/embed)\/(\d+)\/([A-Za-z0-9-]+)/
  const match = url.match(regex)
  if (match) {
    return {
      libraryId: match[1],
      videoId: match[2],
    }
  }
  return null
}

/**
 * Gera a URL oficial de embed do Bunny.net.
 */
export function gerarBunnyEmbedUrl(libraryId: string, videoId: string): string {
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&loop=false`
}
