/**
 * Heading slug shared by the TOC island and the build-time heading-id pass.
 *
 * Both import this module so a heading gets the same fragment in development
 * (generated in the browser) and in production (written into the HTML at
 * build time).
 */
export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
