/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-banner. Base: hero.
 * Source: https://www.panynj.gov/port-authority/en/business-opportunities/solicitations-advertisements/Construction.html
 * Generated: 2026-09-23
 *
 * Library convention (Hero): 1 column, 3 rows.
 *   Row 1 = block name.
 *   Row 2 = background image (optional) — none in this title-only dark banner.
 *   Row 3 = title (Heading) + optional subheading + optional CTA.
 * Source (.SimpleHero) contains an (empty) breadcrumb nav and a .Title > h1.
 * Iteration: none — single hero instance (structure.json repeatingUnits: []).
 */
export default function parse(element, { document }) {
  // Title — validated against source: div.Title > h1. Fall back through heading
  // levels, then to the .Title container's text if no heading element exists.
  let heading = element.querySelector('.Title h1, .Title h2, .SimpleHero-wrapper h1, h1, h2');
  const titleContainer = element.querySelector('.Title, [class*="title"]');
  if (!heading && titleContainer) {
    const text = titleContainer.textContent.trim();
    if (text) {
      heading = document.createElement('h1');
      heading.textContent = text;
    }
  }

  // Optional subheading/description (not present in this title-only variant).
  const subheading = element.querySelector('.SubTitle, [class*="subtitle"]');
  // Optional CTA (not present in this variant) — hero CTAs only, not breadcrumb links.
  const ctaLinks = Array.from(element.querySelectorAll('a.button, a.cta, .SimpleHero-cta a'));
  // Optional background image.
  const bgImage = element.querySelector('img[class*="background"], img[class*="bg"], picture img');

  // Empty-block guard — only bail if there is genuinely no content.
  if (!heading && !subheading && !bgImage && ctaLinks.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  if (bgImage) cells.push([bgImage]);

  const contentCell = [];
  if (heading) contentCell.push(heading);
  if (subheading) contentCell.push(subheading);
  contentCell.push(...ctaLinks);
  cells.push([contentCell]); // hero is 1-column: one row, one cell holding all elements.

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
