// lib/video/youtube.ts

/**
 * Extrai o ID do vídeo de qualquer formato comum de URL do YouTube.
 * Suporta formatos: youtube.com/watch?v=, youtu.be/ e youtube.com/embed/
 */
export function extrairYoutubeId(url: string): string | null {
  const regex =
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Gera a URL de embed com parâmetros de privacidade reforçados.
 * Utiliza youtube-nocookie.com e remove sugestões de outros canais (rel=0)
 */
export function gerarEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`;
}
