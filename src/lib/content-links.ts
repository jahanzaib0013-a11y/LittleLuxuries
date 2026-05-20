/** True when the URL should open externally (http/https). */
export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}
