// Une clases condicionales sin dependencias externas.
export function cn(...clases: Array<string | false | null | undefined>): string {
  return clases.filter(Boolean).join(" ");
}

// Convierte un texto en un slug url-safe (minúsculas, sin acentos, con guiones).
export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Devuelve la URL embebible de un video de YouTube o Vimeo; null si no se reconoce.
export function urlEmbedVideo(
  proveedor: "youtube" | "vimeo" | null | undefined,
  url: string | null | undefined
): string | null {
  if (!url) return null;

  if (proveedor === "youtube") {
    const id =
      url.match(/[?&]v=([\w-]{11})/)?.[1] ??
      url.match(/youtu\.be\/([\w-]{11})/)?.[1] ??
      url.match(/youtube\.com\/embed\/([\w-]{11})/)?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (proveedor === "vimeo") {
    const id = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }

  return null;
}
