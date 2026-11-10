/**
 * JSON-LD builders.
 *
 * Only verified, visible facts appear here: no ratings, reviews, prices,
 * download counts or organisation details are invented. Each node matches
 * content a visitor can actually see on the page it is attached to.
 */

import { SITE, absolute } from "../config/site.js";

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: absolute("/"),
    description: SITE.description,
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    alternateName: SITE.packageName,
    description: SITE.description,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    programmingLanguage: "JavaScript",
    softwareVersion: SITE.version,
    license: "https://opensource.org/license/mit",
    url: absolute("/"),
    codeRepository: SITE.repoUrl,
  };
}

/**
 * BreadcrumbList from the visible breadcrumb trail.
 *
 * `items` is `[{ label, href }]` — the last item should have no `href`.
 */
export function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absolute(item.href) } : {}),
    })),
  };
}
