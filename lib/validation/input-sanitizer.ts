import DOMPurify from "isomorphic-dompurify"

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
}

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html)
}

export function validateAndSanitizeUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url)
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return null
    }
    return parsedUrl.toString()
  } catch {
    return null
  }
}
